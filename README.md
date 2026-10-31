# SQL Query Helper

> **IBM Capstone Project — IT Track | AI Agent for Programming**
>
> Ceritakan kebutuhan data Anda dalam bahasa sehari-hari (Bahasa Indonesia maupun Inggris) dan dapatkan query SQL beserta penjelasannya secara otomatis, didukung oleh Google Gemini API.

---

## Fitur

- 🌐 **Multi-dialek** — MySQL, PostgreSQL, SQLite
- 🗣️ **Dua bahasa** — mendukung Bahasa Indonesia dan Inggris
- 🧠 **Sadar skema** — tempel `CREATE TABLE` Anda agar AI hanya menggunakan kolom yang benar-benar ada
- 📋 **Salin sekali klik** — tombol "Salin SQL" langsung menyalin query ke clipboard
- 🌙 **Mode gelap/terang** — bisa diubah, tersimpan otomatis, mengikuti preferensi OS
- ⚠️ **Peringatan query berbahaya** — memberi label WARNING bila permintaan melibatkan DELETE, UPDATE, DROP, atau TRUNCATE
- ⌨️ **Pintasan keyboard** — `Ctrl+Enter` / `Cmd+Enter` langsung mengirim dari textarea mana pun
- 📱 **Responsif** — tampil rapi di desktop maupun ponsel

---

## Prasyarat

1. **Node.js v18 atau lebih baru** — unduh dari [https://nodejs.org](https://nodejs.org)
   Cek versi yang terpasang:
   ```
   node --version
   ```
2. **API Key Gemini** — diperoleh gratis dari [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Langkah Instalasi

### 1 — Buka folder project

Buka terminal/command prompt, lalu masuk ke folder project:

```bash
cd "Web SQL Helper"
```

### 2 — Install dependensi

```bash
npm install
```

> **Pengguna Windows PowerShell:** jika perintah `npm` diblokir oleh kebijakan eksekusi, gunakan:
> ```
> npm.cmd install
> ```

### 3 — Salin file konfigurasi

Buat file `.env` dari template yang sudah tersedia.

**Windows (Command Prompt / PowerShell):**
```
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

### 4 — Isi API Key

Buka file `.env` dengan editor teks, lalu isi nilainya:

```env
GEMINI_API_KEY=masukkan_api_key_anda_di_sini
GEMINI_MODEL=gemini-2.0-flash
PORT=3000
```

> ⚠️ **Catatan keamanan:** File `.env` sengaja **tidak disertakan** di repositori ini demi keamanan. Jangan pernah mengunggah file `.env` ke GitHub atau membagikannya kepada siapa pun.

### 5 — Jalankan server

```bash
npm start
```

> **Pengguna Windows PowerShell:** gunakan:
> ```
> npm.cmd start
> ```

Jika berhasil, terminal akan menampilkan:
```
[SQL Helper] Server running at http://localhost:3000
```

### 6 — Buka di browser

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## Cara Pakai

1. **Pilih Dialek SQL** — MySQL, PostgreSQL, atau SQLite.
2. **Tulis Permintaan Anda** — deskripsikan kebutuhan data dalam bahasa sehari-hari.
   - Contoh: *"Tampilkan 5 produk terlaris bulan ini beserta total kuantitas terjual."*
   - Contoh: *"Show all customers who have not placed any order in the last 90 days."*
3. *(Opsional)* **Tempel Skema Tabel** — pernyataan `CREATE TABLE` Anda. Jika dikosongkan, AI akan menyebutkan asumsi yang digunakan.
4. Klik **Buat Query** (atau tekan `Ctrl+Enter`).
5. Lihat SQL yang dihasilkan dan penjelasannya. Gunakan tombol **Salin SQL** untuk menyalin query.

Gunakan **Contoh Cepat** di bagian bawah form untuk mencoba berbagai jenis query tanpa mengetik.

---

## Struktur Folder

```
Web SQL Helper/
├── server.js          # Backend Express + integrasi Gemini API
├── package.json       # Hanya dua dependensi: express dan dotenv
├── .env.example       # Template konfigurasi (salin ke .env, isi API key)
├── .env               # ⚠ File ini TIDAK ada di repo — buat sendiri
├── README.md
└── public/
    ├── index.html     # Halaman antarmuka utama (satu halaman)
    ├── style.css      # Tema terang/gelap, IBM Blue, responsif
    ├── app.js         # Logika frontend — vanilla JS, tanpa framework
    └── sqllogo.png    # Logo aplikasi (tambahkan file sendiri)
```

---

## Troubleshooting

### Port 3000 sudah dipakai
Ubah nilai `PORT` di file `.env`:
```env
PORT=3001
```
Lalu akses [http://localhost:3001](http://localhost:3001).

### Model tidak ditemukan
Pastikan nilai `GEMINI_MODEL` di `.env` sesuai dengan model yang tersedia di akun Anda.  
Model yang umum digunakan:
- `gemini-2.0-flash` (cepat, hemat kuota)
- `gemini-1.5-pro`

### API Key salah atau tidak valid
Periksa kembali isi `.env`. Pastikan tidak ada spasi atau tanda kutip di sekitar nilai kunci:
```env
GEMINI_API_KEY=AIzaSyAbc123...   # Benar
GEMINI_API_KEY="AIzaSyAbc123..." # Salah — jangan pakai tanda kutip
```

### Kuota API habis
Google AI Studio menyediakan kuota gratis harian. Jika kuota habis, tunggu hingga besok atau buat API key baru di [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### `npm` diblokir di Windows PowerShell
Gunakan `npm.cmd` sebagai pengganti:
```
npm.cmd install
npm.cmd start
```
Atau jalankan perintah dari **Command Prompt** biasa (bukan PowerShell).

---

## Kredit
Logo: "Sql data base with logo.png" oleh Alaa Kaddour (charactercountonline.info),
sumber: Wikimedia Commons, lisensi CC BY-SA 4.0
(https://creativecommons.org/licenses/by-sa/4.0).
