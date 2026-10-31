/* =============================================================
   app.js — SQL Query Helper frontend logic
   No frameworks, no build step — plain vanilla JavaScript
   ============================================================= */

"use strict";

// ── DOM references ────────────────────────────────────────────
const dialectEl      = document.getElementById("dialect");
const schemaEl       = document.getElementById("schema");
const userRequestEl  = document.getElementById("userRequest");
const charCountEl    = document.getElementById("charCount");
const generateBtn    = document.getElementById("generateBtn");
const errorMsg       = document.getElementById("errorMsg");
const errorText      = document.getElementById("errorText");
const loadingState   = document.getElementById("loadingState");
const resultCard     = document.getElementById("resultCard");
const sqlOutput      = document.getElementById("sqlOutput");
const explanationOut = document.getElementById("explanationOutput");
const copyBtn        = document.getElementById("copyBtn");
const copyBtnText    = document.getElementById("copyBtnText");
const themeToggle    = document.getElementById("themeToggle");
const exampleChips   = document.querySelectorAll(".chip[data-example]");

// ── Theme management ──────────────────────────────────────────

/**
 * Apply a theme ("light" | "dark") to the document and persist
 * the choice in localStorage.
 */
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("sqlhelper-theme", theme);
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
  );
}

// Restore saved theme, or follow the OS preference
(function initTheme() {
  const saved  = localStorage.getItem("sqlhelper-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.hasAttribute("data-theme");
  applyTheme(isDark ? "light" : "dark");
});

// ── Character counter ─────────────────────────────────────────
const MAX_REQUEST_LEN = 2000;

function updateCharCount() {
  const len = userRequestEl.value.length;
  charCountEl.textContent = `${len} / ${MAX_REQUEST_LEN}`;

  charCountEl.classList.remove("near-limit", "at-limit");
  if (len >= MAX_REQUEST_LEN) {
    charCountEl.classList.add("at-limit");
  } else if (len >= MAX_REQUEST_LEN * 0.85) {
    charCountEl.classList.add("near-limit");
  }
}

userRequestEl.addEventListener("input", updateCharCount);

// ── Example chips ─────────────────────────────────────────────
exampleChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    userRequestEl.value = chip.dataset.example;
    updateCharCount();
    userRequestEl.focus();
    // Scroll to the textarea on small screens
    userRequestEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

// ── UI helpers ────────────────────────────────────────────────

/** Show an error message above the submit button. */
function showError(message) {
  errorText.textContent = message;
  errorMsg.hidden = false;
}

/** Clear the error banner. */
function clearError() {
  errorMsg.hidden = true;
  errorText.textContent = "";
}

/** Enter loading state: disable controls and show spinner. */
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  dialectEl.disabled   = isLoading;
  loadingState.hidden  = !isLoading;
  if (isLoading) {
    resultCard.hidden = true;
    clearError();
  }
}

// ── SQL syntax highlighting (minimal, no external deps) ───────

/**
 * Very lightweight SQL keyword highlighter.
 * Wraps known keywords in <span class="kw"> so CSS can colour them.
 * We escape HTML first to prevent XSS.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SQL_KEYWORDS = [
  "SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","FULL","CROSS",
  "ON","AND","OR","NOT","IN","IS","NULL","AS","DISTINCT","ORDER","BY","GROUP",
  "HAVING","LIMIT","OFFSET","INSERT","INTO","VALUES","UPDATE","SET","DELETE",
  "CREATE","TABLE","DROP","ALTER","INDEX","VIEW","DATABASE","SCHEMA","PRIMARY",
  "KEY","FOREIGN","REFERENCES","CONSTRAINT","UNIQUE","DEFAULT","AUTO_INCREMENT",
  "SERIAL","IF","EXISTS","CASE","WHEN","THEN","ELSE","END","UNION","ALL",
  "INTERSECT","EXCEPT","WITH","RECURSIVE","RETURNING","LIKE","ILIKE","BETWEEN",
  "EXISTS","ANY","SOME","COUNT","SUM","AVG","MIN","MAX","COALESCE","NULLIF",
  "CAST","CONVERT","TRUNCATE","ASC","DESC","TRUE","FALSE","INT","INTEGER",
  "VARCHAR","TEXT","BOOLEAN","DATE","TIMESTAMP","FLOAT","NUMERIC","DECIMAL",
  "BIGINT","SMALLINT",
];

const KW_PATTERN = new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi");

function highlightSQL(sql) {
  if (!sql || !sql.trim()) return "";
  const safe = escapeHtml(sql);
  return safe.replace(KW_PATTERN, (match) => `<span class="kw">${match}</span>`);
}

// ── Copy to clipboard ─────────────────────────────────────────
let copyResetTimer = null;

copyBtn.addEventListener("click", async () => {
  const text = sqlOutput.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtnText.textContent = "Tersalin!";
    copyBtn.setAttribute("aria-label", "Tersalin ke clipboard");
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyBtnText.textContent = "Salin SQL";
      copyBtn.setAttribute("aria-label", "Salin SQL ke clipboard");
    }, 2000);
  } catch (_err) {
    // Fallback for older browsers / non-HTTPS
    try {
      const range = document.createRange();
      range.selectNodeContents(sqlOutput);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      copyBtnText.textContent = "Tersalin!";
      clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => {
        copyBtnText.textContent = "Salin SQL";
      }, 2000);
    } catch (_) {
      copyBtnText.textContent = "Gagal menyalin";
    }
  }
});

// ── Input validation (client-side) ───────────────────────────

/**
 * Returns an error string if validation fails, or null if valid.
 */
function validateInputs(request) {
  if (!request.trim()) {
    return "Mohon deskripsikan permintaan data Anda sebelum membuat query.";
  }
  if (request.length > MAX_REQUEST_LEN) {
    return `Permintaan terlalu panjang (${request.length} / ${MAX_REQUEST_LEN} karakter).`;
  }
  return null;
}

// ── API call ──────────────────────────────────────────────────

/**
 * POST to the backend /api/generate and return { sql, explanation }.
 * Throws an Error with a user-friendly message on failure.
 */
async function callGenerateAPI(dialect, schema, request) {
  let response;
  try {
    response = await fetch("/api/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ dialect, schema, request }),
    });
  } catch (networkErr) {
    throw new Error("Tidak dapat menghubungi server. Periksa koneksi internet Anda.");
  }

  let data;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error("Respons tidak terduga dari server. Silakan coba lagi.");
  }

  if (!response.ok) {
    throw new Error(data.error || `Kesalahan server (${response.status}). Silakan coba lagi.`);
  }

  return data;
}

// ── Main generate handler ─────────────────────────────────────
generateBtn.addEventListener("click", async () => {
  const dialect = dialectEl.value;
  const schema  = schemaEl.value;
  const request = userRequestEl.value;

  // Client-side validation
  const validationError = validateInputs(request);
  if (validationError) {
    showError(validationError);
    userRequestEl.focus();
    return;
  }

  setLoading(true);

  try {
    const { sql, explanation } = await callGenerateAPI(dialect, schema, request);

    // Render result
    sqlOutput.innerHTML = highlightSQL(sql) || "<em style='opacity:0.6'>Tidak ada SQL yang dihasilkan.</em>";
    explanationOut.textContent = explanation || "";
    resultCard.hidden = false;

    // Scroll to result
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});

// Allow Ctrl+Enter / Cmd+Enter to submit from either textarea
function handleSubmitShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    generateBtn.click();
  }
}
userRequestEl.addEventListener("keydown", handleSubmitShortcut);
schemaEl.addEventListener("keydown", handleSubmitShortcut);
