# 🚀 Master Playbook & Peta Jalan Pembuatan Koperasi-AI dari Nol (0)
# Panduan Sekuensial: UI/UX (Frontend) Dahulu → Logika Peladen (Backend)

Dokumen ini adalah **Buku Panduan Utama (Master Playbook)** yang dirancang ulang secara sistematis bagi pengembang untuk membangun ulang sistem Core Koperasi dari titik nol mutlak. 

Menggunakan pendekatan **UI/UX & Frontend-First**, kita memastikan seluruh tampilan visual, komponen baku, dan kenyamanan pengguna (*user experience*) matang terlebih dahulu sebelum menyambungkannya ke mesin basis data dan kecerdasan buatan di sisi *backend*.

> [!IMPORTANT]
> **KEBIJAKAN WAJIB VERSION CONTROL (GIT)**: 
> Setiap kali satu sub-tahap atau fase pengerjaan selesai, pengembang **DIWAJIBKAN** melakukan `git add .`, `git commit -m "..."`, dan langsung **PUSH KE GITHUB**. Tidak boleh menumpuk perubahan hingga akhir proyek guna menjaga rekam jejak (*audit trail*) kode.

---

## 🗺️ Gambaran Umum Tahapan Pengerjaan

```
┌───────────────────────────────────────────────────────────┐
│ TAHAP 1: Inisialisasi Proyek & Repositori Dasar           │
├───────────────────────────────────────────────────────────┤
│ TAHAP 2: Slicing UI/UX, Desain Sistem & Frontend Statis   │
├───────────────────────────────────────────────────────────┤
│ TAHAP 3: Desain Skema Basis Data (Backend ORM)            │
├───────────────────────────────────────────────────────────┤
│ TAHAP 4: Integrasi Peladen (Server Components & Actions)  │
├───────────────────────────────────────────────────────────┤
│ TAHAP 5: Pemasangan Mesin Otomasi AI & Layanan Eksternal  │
├───────────────────────────────────────────────────────────┤
│ TAHAP 6: Hardening, Pengujian Bebas Galat, & Go-Live      │
└───────────────────────────────────────────────────────────┘
```

---

## 🎨 TAHAP 1 — Inisialisasi Proyek & Repositori Dasar
**Tujuan:** Menyiapkan kerangka kerja kosong berstandar tinggi yang siap dipoles.

### Langkah-Langkah:
1. **Penciptaan Kerangka Next.js**:
   Jalankan perintah instalasi bersih:
   ```bash
   npx create-next-app@latest koperasi-ai --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
   ```
2. **Pembersihan Berkas Bawaan**:
   Hapus gaya CSS bawaan di `app/globals.css` dan sisakan direktif esensial Tailwind CSS. Kosongkan isi `app/page.tsx` menjadi halaman sederhana.
3. **Instalasi Pustaka UI Dasar**:
   Inisialisasi pustaka `shadcn/ui` dan `lucide-react`:
   ```bash
   npx shadcn@latest init
   ```
4. **🔒 POSPENGAMANAN GIT 1**:
   Inisialisasi repositori Git lokal, tautkan ke repositori GitHub kosong Anda, lakukan komit pertama, dan dorong (*push*):
   ```bash
   git init
   git add .
   git commit -m "chore: inisialisasi proyek Next.js bersih"
   git branch -M main
   git remote add origin https://github.com/USERNAME/koperasi-ai.git
   git push -u origin main
   ```

---

## 🪟 TAHAP 2 — Slicing UI/UX, Desain Sistem & Frontend Statis (Tanpa Database)
**Tujuan:** Merancang antarmuka visual yang memukau, bersih, dan mematuhi seluruh SOP UI/UX modern (Gaya Tabler). Semua data di tahap ini menggunakan data tiruan statis murni untuk menguji tata letak.

### Langkah-Langkah:
1. **Penerapan Token Warna & Tipografi (`docs/07-ui-design-system.md`)**:
   Tanamkan variabel warna HSL kustom untuk tema **Slate** (Netral), **Blue** (Aksi), **Emerald** (Sukses), dan **Rose** (Bahaya) ke dalam *file* CSS utama.
2. **Penciptaan Komponen Inti UI Baku (`docs/09-ui-ux-standardization-sop.md`)**:
   - **Tombol Berikon**: Modifikasi komponen `@/components/ui/button` agar mewajibkan prop atau penyisipan ikon `lucide-react` di kiri teks (`mr-2 h-4 w-4`).
   - **Tabel Seragam**: Buat pembungkus tata letak tabel dengan *header* seragam (`bg-slate-50/70 text-xs uppercase font-bold`), baris tipis (`divide-y`), perataan kanan khusus kolom uang/angka bermode *monospace*, dan sisipkan blok *Pagination* standar di bawahnya.
   - **Modal Umpan Balik (Tabler Style)**: Bangun komponen global `<FeedbackModal />` berlatar belakang ikon raksasa semitransparan di tengah atas untuk kelak menggantikan semua fungsi `alert()`.
3. **Slicing Tata Letak Utama (Dashboard Layout)**:
   Buat kerangka bilah navigasi samping (*Sidebar*) yang dapat dilipat dan bilah atas (*Navbar*) dengan informasi pengguna.
4. **Slicing Halaman Antarmuka Pengguna (UI Mockups)**:
   - Halaman **Dashboard**: Deretan kartu KPI, area grafik pertumbuhan, dan tabel ringkasan.
   - Halaman **Kasir / Teller**: Antarmuka ringkas berfokus pada kecepatan ketukan dengan *input* pencarian di atas.
   - Halaman **Manajemen Anggota**: Tabel data berkolom lengkap beserta formulir registrasi bergaya kartu (*card*).
   - Halaman **Manajemen Simpanan & Pinjaman**: Tampilan kartu portofolio dan rancangan visual modal pengajuan/pembukaan rekening.
5. **🔒 POSPENGAMANAN GIT 2**:
   Simpan seluruh pencapaian visual dan dorong ke peladen repositori:
   ```bash
   git add .
   git commit -m "feat(ui): slicing komponen baku, layout, dan halaman frontend sesuai SOP Tabler"
   git push origin main
   ```

---

## 🗄️ TAHAP 3 — Desain Skema Basis Data (Backend ORM)
**Tujuan:** Menyiapkan fondasi penyimpanan data relasional yang kokoh, mendukung jejak audit, dan pencatatan ganda (*double-entry*).

### Langkah-Langkah:
1. **Instalasi Prisma & Klien**:
   ```bash
   npm install @prisma/client
   npm install prisma --save-dev
   npx prisma init
   ```
2. **Penyusunan Skema Relasional (`schema.prisma`)**:
   Rancang entitas yang saling terhubung sesuai `docs/02-database-schema.md`:
   - `Koperasi`, `User`, `Anggota`
   - `ProdukSimpanan`, `RekeningSimpanan`, `MutasiSimpanan`
   - `ProdukPinjaman`, `Pinjaman`, `JadwalAngsuran`
   - `ChartOfAccount`, `Jurnal`, `JurnalEntry` (Integritas Akuntansi)
3. **Migrasi Basis Data & Penyemaian Awal (Seeding)**:
   Siapkan pangkalan data PostgreSQL, jalankan migrasi pembentukan tabel, dan buat *seeder* (`prisma/seed.ts`) untuk mengisi akun admin utama serta daftar produk master bawaan.
   ```bash
   npx prisma migrate dev --name init_schema_core
   npm run seed
   ```
4. **🔒 POSPENGAMANAN GIT 3**:
   Amankan struktur basis data dan arsip migrasi ke GitHub:
   ```bash
   git add .
   git commit -m "feat(db): pembentukan skema Prisma relasional dan penyemaian data master"
   git push origin main
   ```

---

## ⚡ TAHAP 4 — Integrasi Peladen (Server Components & Actions)
**Tujuan:** Menghidupkan tata letak antarmuka statis dari Tahap 2 dengan menyuntikkan aliran data dinamis dari Prisma (Tahap 3). **Membasmi total** semua data rekaan/tiruan.

### Langkah-Langkah:
1. **Penerapan Pola Pemisahan Server-Client**:
   Ubah halaman utama (`page.tsx`) di tiap modul menjadi *Server Component* asinkron murni yang mengambil data menggunakan `await prisma.model.findMany()`.
2. **Penyaluran Opsi Dropdown Dinamis**:
   Pada modal pembukaan rekening dan pengajuan pinjaman, ambil daftar riil anggota aktif dan produk aktif dari peladen, lalu teruskan sebagai `props` ke komponen klien.
3. **Pembuatan Server Actions**:
   Bangun berkas aksi peladen khusus (misal: `actions/kasir.action.ts` dan `actions/pinjaman.action.ts`) untuk menangani pengiriman formulir dan mutasi saldo yang tervalidasi.
4. **Integrasi `<FeedbackModal />`**:
   Gantikan seluruh pesan galat atau sukses dengan memicu kemunculan modal Tabler UI yang telah disiapkan di Tahap 2, pastikan tidak ada `alert()` peramban yang tersisa.
5. **Pengecekan Ketat TypeScript**:
   Jalankan kompilator untuk memvalidasi tidak ada tipe `any` implisit atau properti skema yang meleset:
   ```bash
   npx tsc --noEmit
   ```
6. **🔒 POSPENGAMANAN GIT 4**:
   Komit hasil pengawinan *frontend* dan *backend* yang sukses berjalan:
   ```bash
   git add .
   git commit -m "feat(integration): koneksi logika server Prisma ke UI dan pemberantasan data statis"
   git push origin main
   ```

---

## 🤖 TAHAP 5 — Pemasangan Mesin Otomasi AI & Layanan Eksternal
**Tujuan:** Mengangkat derajat aplikasi menjadi sistem cerdas mandiri (*Automation-First*).

### Langkah-Langkah:
1. **Pemindai KTP Otomatis (OCR Engine)**:
   Integrasikan Google Gemini Vision API di formulir registrasi anggota. Alur: *Unggah Foto KTP → Ekstraksi JSON → Pengisian Otomatis Kolom Isian*.
2. **Mesin Penilai Risiko Kredit (AI Credit Scoring)**:
   Tanamkan model penilaian berbasis parameter 5C (Character, Capacity, Capital, Collateral, Condition) yang dianalisis oleh AI di dalam modal pengajuan pinjaman.
3. **Jalur Pembayaran Otomatis (Xendit Webhooks)**:
   Siapkan pendengar *webhook* peladen untuk mencatat setoran masuk via Virtual Account atau QRIS secara otomatis tanpa campur tangan manusia.
4. **Otomasi Penjurnalan (Auto-Journaling)**:
   Pasang kaitan (*trigger/hook*) di setiap fungsi transaksi simpanan dan pinjaman agar otomatis memposting entri Debit dan Kredit ganda ke tabel `Jurnal`.
5. **Portal Anggota Android (Mobility-First / PWA / CapacitorJS wrapper)**:
   Bangun rute web mandiri khusus seluler (sesuai SOP `docs/10-mobile-responsive-sop.md` Bagian 5) untuk akses mandiri anggota. Manfaatkan pembungkus PWA (`next-pwa`) untuk instalasi instan via Chrome, atau CapacitorJS untuk merilis berkas `.apk`/`.aab` ke Play Store tanpa menulis skrip Java/Kotlin.
6. **🔒 POSPENGAMANAN GIT 5**:
   Dorong pembaruan ekosistem cerdas ke GitHub:
   ```bash
   git add .
   git commit -m "feat(ai): integrasi OCR KTP, Credit Scoring, Webhook, dan Portal Anggota Android"
   git push origin main
   ```

---

## 🏁 TAHAP 6 — Hardening, Pengujian Bebas Galat, & Go-Live
**Tujuan:** Memoles performa, menutup celah keamanan, dan merilis sistem ke lingkungan produksi peladen awan.

### Langkah-Langkah:
1. **Penerapan Proteksi Entri Ganda (Double-Entry Guard)**:
   Pastikan setiap aksi sensitif menampilkan dialog penegasan keterkaitan akun dengan buku besar (SOP Poin 5).
2. **Optimalisasi Kinerja & Singgahan (Caching)**:
   Terapkan parameter penanda dinamis (`force-dynamic` atau revalidasi rute) agar tidak terjadi masalah data usang (*stale data*) setelah transaksi.
3. **Penyusunan Panduan Pengguna Akhir**:
   Lengkapi berkas bantuan singkat bagi pengurus koperasi.
4. **🔒 POSPENGAMANAN GIT TERAKHIR**:
   Lakukan komit pamungkas penanda versi stabil rilis pertama:
   ```bash
   git add .
   git commit -m "chore: rilis produksi v1.0 stabil dan optimalisasi performa akhir"
   git tag v1.0.0
   git push origin main --tags
   ```

***

## 📊 Matriks Kepatuhan & Urutan Pengerjaan

| Tahap | Fokus Area | Keterlibatan Database | Output Wajib | Kebijakan Git |
|-------|------------|-----------------------|--------------|---------------|
| **Tahap 1** | Setup Lingkungan | ❌ Tidak Ada | Repositori bersih bisa berjalan | `git push -u origin main` |
| **Tahap 2** | Antarmuka & UX | ❌ Tidak Ada | Halaman cantik bergaya Tabler + Komponen Pagination/Tombol Ikon | `git push origin main` |
| **Tahap 3** | Skema ORM | ✅ Pembuatan Skema | Skema Prisma tervalidasi + Seeder | `git push origin main` |
| **Tahap 4** | Server Logic | ✅ Kueri Riil | UI dinamis membaca data peladen riil | `git push origin main` |
| **Tahap 5** | Layanan AI | ✅ Pencatatan Log | Otomasi OCR, Skor Kredit, Jurnal | `git push origin main` |
| **Tahap 6** | Stabilisasi | ✅ Operasional | Siap digunakan di peladen awan | `git push origin main --tags` |
