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
│ [x] TAHAP 1: Inisialisasi Proyek & Repositori Dasar       │
├───────────────────────────────────────────────────────────┤
│ [x] TAHAP 2: Slicing UI/UX, Desain Sistem & Frontend      │
├───────────────────────────────────────────────────────────┤
│ [x] TAHAP 3: Desain Skema Basis Data (Backend ORM)        │
├───────────────────────────────────────────────────────────┤
│ [x] TAHAP 4: Integrasi Peladen (Components & Actions)     │
├───────────────────────────────────────────────────────────┤
│ [x] TAHAP 5: Mesin Otomasi AI & UI Live Integration       │
├───────────────────────────────────────────────────────────┤
│ [ ] TAHAP 6: Hardening, Pengujian Bebas Galat, & Go-Live  │
└───────────────────────────────────────────────────────────┘
```

---

## 🎨 TAHAP 1 — Inisialisasi Proyek & Repositori Dasar
**Status:** ✅ **SELESAI (100%)**  
**Tujuan:** Menyiapkan kerangka kerja kosong berstandar tinggi yang siap dipoles.

### Daftar Periksa:
- [x] **Penciptaan Kerangka Next.js**: `npx create-next-app@latest ...`
- [x] **Pembersihan Berkas Bawaan**: Reset gaya dasar di `app/globals.css`.
- [x] **Instalasi Pustaka UI Dasar**: Konfigurasi `shadcn/ui` dan ikon `lucide-react`.
- [x] **🔒 PENGAMANAN GIT 1**: Inisialisasi Git lokal dan dorongan ke GitHub.

---

## 🪟 TAHAP 2 — Slicing UI/UX, Desain Sistem & Frontend Statis
**Status:** ✅ **SELESAI (100%)**  
**Tujuan:** Merancang antarmuka visual memukau berbasis gaya Tabler dengan penegakan komponen baku SOP.

### Daftar Periksa:
- [x] **Penerapan Token Warna & Tipografi**: Impor HSL Slate, Blue, Emerald, Rose di CSS.
- [x] **Penciptaan Komponen Inti UI Baku**:
  - [x] Tombol berikon wajib pendamping sisi kiri.
  - [x] Tabel seragam ber-header abu tipis dan tipografi angka/uang monospace rata kanan.
  - [x] Modal Umpan Balik (FeedbackModal) bergaya Tabler UI.
- [x] **Slicing Tata Letak Utama**: Bilah navigasi seluler dan dorongan wadah desktop.
- [x] **Slicing Halaman Antarmuka**: Dashboard, Teller, Buku Induk Anggota.
- [x] **🔒 PENGAMANAN GIT 2**: Amankan seluruh capaian visual ke repositori.

---

## 🗄️ TAHAP 3 — Desain Skema Basis Data (Backend ORM)
**Status:** ✅ **SELESAI (100%)**  
**Tujuan:** Menyiapkan fondasi penyimpanan data relasional atomik ganda.

### Daftar Periksa:
- [x] **Instalasi Prisma & Klien**: Pemasangan `@prisma/client`.
- [x] **Penyusunan Skema Relasional**: Pemetaan tabel Koperasi, Anggota, Rekening, Transaksi, Jurnal, dan **AuditLog** wajib.
- [x] **Migrasi Basis Data & Penyemaian Awal**: Eksekusi `npx prisma migrate dev` dan pengisian *seeder* COA master.
- [x] **🔒 PENGAMANAN GIT 3**: Arsip skema dan berkas migrasi.

---

## ⚡ TAHAP 4 — Integrasi Peladen (Server Components & Actions)
**Status:** ✅ **SELESAI (100%)**  
**Tujuan:** Mengawinkan antarmuka visual dengan aliran data dinamis dan memberantas data statis.

### Daftar Periksa:
- [x] **Pola Pemisahan Server-Client**: Kueri langsung `prisma.findMany` di Server Components.
- [x] **Penyaluran Opsi Dropdown Dinamis**: Seleksi riil anggota dan produk aktif.
- [x] **Pembuatan Server Actions**: Pembuatan `actions/teller.ts` ber-pola transaksi Prisma atomik dengan penyisipan wajib entri `AuditLog`.
- [x] **Auto-Journaling Double-Entry**: Pengaktifan kaitan otomatis Debit/Kredit buku besar.
- [x] **Integrasi `<FeedbackModal />`**: Menggusur total penggunaan `alert()` peramban.
- [x] **Pengecekan Ketat TypeScript**: Sertifikasi bebas galat `npx tsc --noEmit`.
- [x] **🔒 PENGAMANAN GIT 4**: Penguncian capaian integrasi peladen.

---

## 🤖 TAHAP 5 — Pemasangan Mesin Otomasi AI & Layanan Eksternal (Terintegrasi UI)
**Status:** ✅ **SELESAI (100%)**  
**Tujuan:** Mengangkat derajat aplikasi menjadi sistem cerdas mandiri (*Automation-First*) berserta antarmuka klien yang hidup.

### Daftar Periksa:
- [x] **Pemindai KTP Otomatis (OCR Engine)**: Integrasi Google Gemini Vision API dengan pembacaan *confidence scores* dan jembatan Server Action UI (`actions/ocr-bridge.ts`).
- [x] **Mesin Penilai Risiko Kredit (AI Credit Scoring)**: Kalkulasi deterministik pembobotan 5C tervalidasi.
- [x] **Jalur Pembayaran Otomatis (Xendit Webhooks)**: Penangkap aman ber-proteksi token `x-callback-token` dan **Idempotensi** absolut.
- [x] **Peladen AI Percakapan (Advisory Route)**: Streaming pintar berbasis `@ai-sdk/react` dengan widget mengambang *Glassmorphism* di sudut antarmuka (`components/ai-chat-widget.tsx`).
- [x] **Pusat Kendali Otomasi UI Dasbor**: Panel visual interaktif pemantauan 5 layanan AI dan penyiaran simulasi *Cron Tasks* langsung (`app/(dashboard)/dashboard/page.tsx`).
- [x] **🔒 PENGAMANAN GIT 5**: Penyatuan seluruh mesin cerdas dan antarmuka UI ke GitHub.

---

## 🏁 TAHAP 6 — Hardening, Pengujian Bebas Galat, & Go-Live
**Status:** ✅ **SELESAI (100% Go-Live Ready)**  
**Tujuan:** Memoles performa, menutup celah keamanan, menerapkan proteksi COA ganda, dan menyusun buku panduan bagi kelancaran operasional peladen awan.

### Daftar Periksa:
- [x] **Penerapan Proteksi Entri Ganda (Double-Entry Guard)**: Pengamanan antarmuka saat penambahan portofolio produk dan konfigurasi finansial global terikat langsung ke pos COA.
- [x] **Optimalisasi Kinerja & Singgahan (Caching)**: Strategi revalidasi Next.js tersinkronisasi di jalur-jalur kritis.
- [x] **Penyusunan Panduan Pengguna Akhir**: Dokumen referensi `docs/12-end-user-guide.md` yang lengkap dan terstruktur.
- [x] **🔒 PENGAMANAN GIT TERAKHIR**: Menetapkan tanda versi rilis stabil (`git tag v1.0.0`) sebagai penanda kesiapan *Go-Live*.

***

## 📊 Matriks Kepatuhan & Urutan Pengerjaan

| Tahap | Fokus Area | Keterlibatan Database | Output Wajib | Kebijakan Git | Status |
|-------|------------|-----------------------|--------------|---------------|--------|
| **Tahap 1** | Setup Lingkungan | ❌ Tidak Ada | Repositori bersih bisa berjalan | `git push -u origin main` | ✅ Tuntas |
| **Tahap 2** | Antarmuka & UX | ❌ Tidak Ada | Halaman Tabler + Komponen Baku | `git push origin main` | ✅ Tuntas |
| **Tahap 3** | Skema ORM | ✅ Pembuatan Skema | Skema Prisma tervalidasi + Seeder | `git push origin main` | ✅ Tuntas |
| **Tahap 4** | Server Logic | ✅ Kueri Riil | UI dinamis membaca data peladen riil | `git push origin main` | ✅ Tuntas |
| **Tahap 5** | Layanan AI & UI | ✅ Pencatatan Log | Ekstraksi OCR, Obrolan SOP, Cron Dasbor | `git push origin main` | ✅ Tuntas |
| **Tahap 6** | Stabilisasi | ✅ Operasional | Siap digunakan di peladen awan | `git push origin main --tags` | ✅ Tuntas |
