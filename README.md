# 🎓 AI Asisten Tugas Mahasiswa

Platform SaaS AI modern berbasis **Next.js**, **TypeScript**, **Tailwind CSS**, dan **Supabase**. Aplikasi ini dirancang untuk membantu mahasiswa menyusun draft jawaban tugas kuliah, menganalisis struktur tulisan, dan menemukan referensi jurnal ilmiah asli terverifikasi dari OpenAlex dan Crossref.

---

## 🚀 Fitur Utama

1. **AI Asisten Tugas (`/dashboard/tugas/baru`)**
   - Mendukung berbagai jenis tugas: *Diskusi Forum, Essay, Makalah, Pertanyaan Singkat, dan Ringkasan Materi*.
   - Pilihan gaya bahasa (*Bahasa Mahasiswa, Akademik, Formal, Sederhana*) dan panjang jawaban (*Singkat, Sedang, Panjang*).
   - UI Progress *real-time* yang mengikuti tahapan backend secara transparan.

2. **Pencarian Jurnal & Referensi Ilmiah (`/dashboard/referensi`)**
   - Integrasi API akademik terbuka (**OpenAlex** & **Crossref**).
   - Penyaringan berdasarkan kata kunci soal dan rentang tahun terbit (misal: 2021–2026).
   - Metadata lengkap (Judul, Penulis, Tahun, Nama Jurnal, DOI, URL, Abstract).
   - Status verifikasi keaslian (**✓ Terverifikasi** vs **⚠ Belum Terverifikasi**). *Bebas dari jurnal rekaan AI*.
   - Salin format sitasi baku **APA 7** secara praktis.

3. **Revisi Jawaban Interaktif (`/dashboard/tugas/[id]`)**
   - Tampilan split-screen desktop (70% jawaban markdown, 30% referensi ilmiah).
   - Tombol modifikasi instan: *Copy*, *Buat Lebih Natural*, *Lebih Akademik*, *Persingkat*, *Perpanjang*, *Tambahkan Referensi*, dan *Generate Ulang*.

4. **Analisis Kualitas & Pola Tulisan (`/dashboard/analisis`)**
   - Modul estimasi pola tulisan (*Human-like %* vs *AI-like %*) dilengkapi **Disclaimer Etika Akademik Wajib**.
   - Indikator kualitas tulisan: Kejelasan argumen, struktur jawaban, konsistensi gaya bahasa, pengulangan kalimat, kalimat panjang, dan saran perbaikan (*actionable tips*).

5. **Riwayat Tugas (`/dashboard/riwayat`)**
   - Manajemen riwayat pengerjaan tugas dengan pencarian kata kunci, filter mata kuliah, filter jenis tugas, dan sorting.

6. **Admin Control Center (`/admin`)**
   - Khusus pengguna ber-role `admin`.
   - Ringkasan statistik jumlah user, total tugas, total generate AI, pencarian jurnal, serta catat log kesalahan API.

---

## 🛠️ Panduan Instalasi & Jalankan Lokal

### 1. Prasyarat
- Node.js versi 18.x / 20.x ke atas.
- npm atau pnpm.

### 2. Clone / Download Project & Install Dependency
```bash
git clone <repository-url>
cd AI_Deteksi
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan lengkapi konfigurasi berikut:
```env
# AI Provider Choice: gemini | openai | anthropic
AI_PROVIDER=gemini

# AI API Keys
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 4. Setup Database & Supabase Migration
1. Buka [Supabase Dashboard](https://supabase.com) dan buat project baru.
2. Pergi ke menu **SQL Editor**.
3. Buka file `supabase/migrations/001_initial_schema.sql` pada repository ini.
4. Salin seluruh teks SQL dan jalankan (*Run*) di Supabase SQL Editor.
5. Tabel `profiles`, `assignments`, `references`, `revisions`, `analyses`, beserta kebijakan **Row Level Security (RLS)** dan trigger profil otomatis akan langsung aktif.

### 5. Jalankan Server Dev
```bash
npm run dev
```
Aplikasi dapat diakses melalui browser di `http://localhost:3000`.

---

## 🔑 Cara Mendapatkan API Key

### A. Gemini API (Rekomendasi - Gratis)
1. Kunjungi [Google AI Studio](https://aistudio.google.com/).
2. Login dengan akun Google Anda.
3. Klik **Get API Key** -> **Create API Key**.
4. Tempelkan key ke `GEMINI_API_KEY` di `.env.local`.

### B. OpenAI API
1. Kunjungi [OpenAI Platform](https://platform.openai.com/api-keys).
2. Buat API Key baru.
3. Tempelkan ke `OPENAI_API_KEY` di `.env.local`.

### C. Anthropic Claude API
1. Kunjungi [Anthropic Console](https://console.anthropic.com/).
2. Buat API Key dan tempelkan ke `ANTHROPIC_API_KEY` di `.env.local`.

### D. Jurnal OpenAlex & Crossref API
- **OpenAlex** dan **Crossref** merupakan REST API terbuka (*open-access*) dan **tidak memerlukan API Key wajib**.
- Aplikasi secara otomatis melakukan kueri ke endpoint publik OpenAlex (`https://api.openalex.org/works`) dan Crossref (`https://api.crossref.org/works`).

---

## 🏗️ Build Production

Untuk menguji build versi produksi secara lokal:
```bash
npm run build
npm run start
```

---

## 🛡️ Keamanan & Validasi Input

- Seluruh endpoint API diverifikasi menggunakan **Zod Schema Validation**.
- API Key disimpan 100% aman di sisi server (Server-side environment variables).
- Row Level Security (RLS) di Supabase memastikan pengguna hanya dapat membaca dan mengolah data miliknya sendiri.

---

## ❓ Troubleshooting & Pertanyaan Umum

1. **AI API Key belum terpasang**:
   - Jika `GEMINI_API_KEY`, `OPENAI_API_KEY`, atau `ANTHROPIC_API_KEY` belum diisi di `.env.local`, aplikasi akan beralih ke mode *fallback* dengan memberikan draf jawaban dan instruksi konfigurasi tanpa menghentikan aplikasi secara *crash*.

2. **Supabase Auth / Session error**:
   - Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah diisi sesuai project Supabase Anda.

---

© {new Date().getFullYear()} **AI Asisten Tugas Mahasiswa**.
