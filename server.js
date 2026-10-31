// =============================================================
// server.js — SQL Query Helper backend
// Express server + Gemini API integration
// =============================================================

"use strict";

require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Validate required env vars at startup ────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error("[ERROR] GEMINI_API_KEY is not set. Copy .env.example to .env and fill in the key.");
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── System prompt factory ────────────────────────────────────
function buildSystemPrompt(dialect, schema) {
  const schemaSection = schema && schema.trim()
    ? `The user has provided the following table schema (use ONLY these tables and columns):\n\`\`\`sql\n${schema.trim()}\n\`\`\``
    : `No schema was provided. State clearly in the "explanation" field what tables and columns you are assuming.`;

  return `You are an expert SQL assistant specialized in ${dialect}.

${schemaSection}

Your task is to convert the user's plain-language request into a correct ${dialect} SQL query.

Rules you MUST follow:
1. Respond ONLY with valid JSON — no markdown fences, no extra text — using exactly these two fields:
   { "sql": "<the SQL query>", "explanation": "<short explanation>" }
2. Write the explanation in the same language the user used (Indonesian or English), using simple terms.
3. Prefer read-only SELECT queries. If the request involves DELETE, UPDATE, DROP, or TRUNCATE, begin the explanation with a clear WARNING label.
4. If the user's request is unrelated to SQL or data retrieval, set "sql" to "" and politely explain in "explanation" that you only handle SQL-related requests.
5. Do NOT include any key, secret, credentials, or sensitive information in your response.`;
}

// ── POST /api/generate ───────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { dialect, schema = "", request } = req.body;

  // ── Input validation ──────────────────────────────────────
  const validDialects = ["MySQL", "PostgreSQL", "SQLite"];
  if (!dialect || !validDialects.includes(dialect)) {
    return res.status(400).json({ error: "Dialek tidak valid. Pilih MySQL, PostgreSQL, atau SQLite." });
  }
  if (!request || typeof request !== "string" || request.trim().length === 0) {
    return res.status(400).json({ error: "Kolom permintaan wajib diisi dan tidak boleh kosong." });
  }
  if (request.length > 2000) {
    return res.status(400).json({ error: "Permintaan terlalu panjang (maks. 2000 karakter)." });
  }
  if (schema && schema.length > 5000) {
    return res.status(400).json({ error: "Skema terlalu panjang (maks. 5000 karakter)." });
  }

  // ── Build Gemini request payload ──────────────────────────
  const systemPrompt = buildSystemPrompt(dialect, schema);
  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: request.trim() }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024
    }
  };

  // ── Call Gemini with a 20-second timeout ──────────────────
  let geminiRes;
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 20_000);

    geminiRes = await fetch(GEMINI_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Permintaan ke Gemini API habis waktu. Silakan coba lagi." });
    }
    console.error("[Gemini fetch error]", err.message);
    return res.status(502).json({ error: "Gagal menghubungi Gemini API. Periksa koneksi jaringan Anda." });
  }

  // ── Handle non-OK responses from Gemini ───────────────────
  if (!geminiRes.ok) {
    let geminiError = "";
    try {
      const errBody = await geminiRes.json();
      geminiError = errBody?.error?.message || "";
    } catch (_) { /* ignore */ }
    console.error(`[Gemini API error] ${geminiRes.status}: ${geminiError}`);
    return res.status(502).json({
      error: `Gemini API mengembalikan kesalahan (${geminiRes.status}). ${geminiError}`
    });
  }

  // ── Parse Gemini response ─────────────────────────────────
  let geminiData;
  try {
    geminiData = await geminiRes.json();
  } catch (err) {
    console.error("[Gemini parse error]", err.message);
    return res.status(502).json({ error: "Tidak dapat membaca respons dari Gemini API." });
  }

  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return res.status(502).json({ error: "Gemini mengembalikan respons kosong. Silakan coba lagi." });
  }

  // ── Extract and validate the JSON the model returned ──────
  let result;
  try {
    // Strip optional markdown fences the model may have added despite instructions
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    result = JSON.parse(cleaned);
  } catch (err) {
    console.error("[Result JSON parse error]", err.message, rawText);
    return res.status(502).json({ error: "Gemini mengembalikan format yang tidak terduga. Silakan coba lagi." });
  }

  if (typeof result.sql === "undefined" || typeof result.explanation === "undefined") {
    return res.status(502).json({ error: "Respons Gemini tidak memiliki kolom yang diperlukan. Silakan coba lagi." });
  }

  return res.json({ sql: result.sql, explanation: result.explanation });
});

// ── Catch-all: serve index.html for any unknown route ───────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SQL Helper] Server running at http://localhost:${PORT}`);
});
