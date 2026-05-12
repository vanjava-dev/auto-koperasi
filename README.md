# 🏦 Koperasi-AI Core v1.0.0
**Platform Manajemen Koperasi Generasi Berikutnya Berbasis "Automation-First"**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)

**Koperasi-AI Core** adalah pangkalan kode terpadu (*monorepo*) yang merombak tata kelola koperasi konvensional melalui otomasi kecerdasan buatan dan transaksi yang dipicu oleh peristiwa (*event-driven*). Filosofi inti kami:

> *"Mesin mengerjakan, manusia memverifikasi."*

Peran manusia (staf/teller) digeser sepenuhnya dari pengetik data (*Data Entry*) menjadi verifikator akhir (*Data Reviewer*) yang menyetujui hasil ekstraksi dan kalkulasi otonom dari mesin.

---

## 🌟 Fitur Unggulan & Mesin Otomasi AI

### 1. 📄 Pemrosesan Dokumen Cerdas (Live KTP OCR Scanner)
Menggunakan **Google Gemini Vision API** (`@google/genai` model `gemini-1.5-flash`), sistem mampu membaca foto KTP secara instan, menyalin isian identitas ke formulir pendaftaran secara otomatis, menyuguhkan metrik akurasi pembacaan (*confidence scores*), dan membukukannya ke dalam jejak audit atomik.

### 2. 💬 Asisten Penasihat AI Global Mengambang (Advisory Agent)
Tertanam di seluruh halaman antarmuka pengguna dalam wujud widget *Glassmorphism* premium di sudut kanan bawah. Membimbing Teller dan Manajer secara real-time streaming mengenai Standar Operasional Prosedur (SOP) transaksi, batas limit saldo, serta tata kelola pembukuan akuntansi ganda.

### 3. ⚡ Transaksi Berbasis Peristiwa (Secure Xendit Webhooks)
Meniadakan entri manual untuk setoran simpanan maupun angsuran pinjaman melalui penangkap *webhook* otomatis ber-proteksi token otorisasi ganda (`x-callback-token`) dan sistem pertahanan **Idempotensi** mutlak.

### 4. 🕐 Pekerjaan Latar Belakang Mandiri (Isolated Cron Tasks)
Tiga mesin otonom terjadwal yang bertugas:
- **Kolektibilitas Harian**: Memutakhirkan status keterlambatan ke klasifikasi kolektibilitas OJK.
- **Kran Imbal Jasa**: Menghitung dan mendistribusikan bunga simpanan bulanan secara massal ber-jurnal ganda atomik.
- **Pengingat Penagihan WA**: Memindai tagihan H-7 dan H-1 untuk penagihan nirkontak via WhatsApp.

### 5. 🎛️ Pusat Kendali Otomasi Dasbor Dinamis
Panel visual interaktif di halaman utama untuk memantau status kesiapan kelima subsistem cerdas dan menyiarkan pemicuan eksekusi latar belakang dengan animasi respons instan.

---

## 🛡️ Kepatuhan Standar SOP & "Audit-Ready"

Pangkalan kode ini tunduk secara ketat pada kaidah operasional perbankan syariah dan konvensional:
- **Aturan L (Mandatory Audit Logging)**: Setiap aksi yang memodifikasi entitas basis data dibungkus dalam blok `prisma.$transaction` yang sama dengan pencatatan wajib ke tabel `AuditLog`.
- **Aturan F (Auto-Journaling Double-Entry)**: Setiap pergerakan kas secara otomatis membangkitkan pasangan entri Jurnal Debit dan Kredit untuk menjamin keseimbangan neraca keuangan.
- **Standar UI/UX Baku**: Penghapusan total fungsi `alert()` peramban (digantikan oleh komponen `FeedbackModal` bergaya Tabler UI), pewajiban ikon aksi dari `lucide-react`, serta tipografi angka/uang bermode *monospace* rata kanan.
- **Sertifikasi Type-Safe**: Pengujian kompilasi statis mutlak via `npx tsc --noEmit` lolos **100% tanpa galat** (*Zero Compilation Errors*).

---

## 🚀 Panduan Memulai & Menjalankan Peladen

### 1. Prasyarat Sistem
- Node.js v18.17+ atau versi terbaru.
- Basis Data PostgreSQL yang aktif.
- Kunci API Google Gemini (`GOOGLE_AI_API_KEY`) dan Token Webhook Xendit.

### 2. Pemasangan & Konfigurasi
Salin repositori dan instal dependensi:
```bash
git clone https://github.com/USERNAME/auto-koperasi.git
cd auto-koperasi
npm install
```

Salin templat variabel lingkungan dan sesuaikan nilainya:
```bash
cp .env.example .env
```

### 3. Eksekusi Migrasi & Penyemaian (Seeding)
Bangun struktur tabel dan masukkan akun admin serta *Chart of Accounts* (COA) bawaan:
```bash
npx prisma migrate dev
npm run seed
```

### 4. Menjalankan Server Lokal
Mulai sesi pengembangan yang mendukung penyiaran *streaming* obrolan dan antarmuka responsif:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di peramban Anda. Sesi kasir siap digunakan.

---

## 📜 Lisensi & Aturan Kontribusi
Dikembangkan di bawah pengawasan ketat tim Vibe Coding & Advanced Agentic Automation. Seluruh penambahan Server Action atau antarmuka baru diwajibkan melewati verifikasi kompilasi ketat `tsc --noEmit` dan menyertakan pembukuan jejak audit (*audit trail*).
