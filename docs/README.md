# 📚 Documentation Index
# Core Koperasi — Indeks Dokumen Proyek

> Dokumen-dokumen ini adalah **sumber kebenaran tunggal (single source of truth)** untuk pengembangan Core Koperasi.
> Setiap developer dan AI Agent WAJIB membaca dan mengikuti panduan yang telah ditetapkan.

---

## 🗂️ Daftar Dokumen

| No | File | Deskripsi | Audience |
|----|------|-----------|----------|
| — | [`architecture.md`](../architecture.md) | Arsitektur teknis, tech stack, aturan coding **Automation-First** | Developer, AI Agent |
| 01 | [`docs/01-product-requirements.md`](01-product-requirements.md) | PRD: kebutuhan produk, fitur, persona pengguna | Semua |
| 02 | [`docs/02-database-schema.md`](02-database-schema.md) | Skema database lengkap (Prisma) | Developer, AI Agent |
| 03 | [`docs/03-api-contract.md`](03-api-contract.md) | Spesifikasi endpoint API & format response | Developer, AI Agent |
| 04 | [`docs/04-module-specification.md`](04-module-specification.md) | Business rules & alur proses per modul | Developer, QA |
| 05 | [`docs/05-development-roadmap.md`](05-development-roadmap.md) | **Master Playbook** — Peta jalan sekuensial pembuatan aplikasi dari 0 (UI/UX Frontend-First → Backend DB) dengan aturan Git Commit & Push per tahap | PM, Developer |
| 06 | [`docs/06-security-compliance.md`](06-security-compliance.md) | Keamanan, RBAC, compliance regulasi | Developer, DevOps |
| 07 | [`docs/07-ui-design-system.md`](07-ui-design-system.md) | Design system, warna, komponen UI | Developer, Designer |
| **08** | [`docs/08-ai-automation-engine.md`](08-ai-automation-engine.md) | **🤖 AI Automation Engine** — OCR, Webhook, Credit Scoring, Chat AI | Developer, AI Agent |
| 09 | [`docs/09-ui-ux-standardization-sop.md`](09-ui-ux-standardization-sop.md) | SOP Standardisasi UI & UX (tombol, modal, tabel, double-entry guard) | Developer, Designer |
| 10 | [`docs/10-mobile-responsive-sop.md`](10-mobile-responsive-sop.md) | SOP Standardisasi Tampilan Mobile & Responsif (Mobile-First) | Developer, QA |
| 11 | [`docs/11-shu-calculation-guidelines.md`](11-shu-calculation-guidelines.md) | SOP Perhitungan & Alokasi Sisa Hasil Usaha (SHU) Real-Time | Pengurus, Pengawas |

---

## 🧭 Panduan untuk AI Agent

Ketika diminta membangun fitur baru, AI Agent harus:

1. **Baca `architecture.md`** → Pahami tech stack, aturan coding, dan **filosofi Automation-First**
2. **Baca `08-ai-automation-engine.md`** → Gunakan komponen otomasi yang sudah didefinisikan (OCR, webhook, credit score, journaling)
3. **Baca `02-database-schema.md`** → Gunakan model Prisma yang sudah didefinisikan
4. **Baca `04-module-specification.md`** → Ikuti business rules yang sudah ditetapkan
5. **Baca `03-api-contract.md`** → Ikuti format response dan endpoint yang sudah disepakati
6. **Baca `06-security-compliance.md`** → Pastikan implementasi aman dan ada audit trail

> ⚠️ **ATURAN TERTINGGI:** Sebelum membuat form input manual, tanyakan dahulu:
> *"Bisakah ini dipicu oleh webhook, OCR, atau proses otomatis?"*
> Jika bisa → otomasi WAJIB diutamakan. Form manual hanya sebagai fallback.

---

## 🏗️ Arsitektur Sistem (Ringkasan)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORE KOPERASI SYSTEM                         │
│              Filosofi: AUTOMATION-FIRST                          │
├─────────────────────────────────────────────────────────────────┤
│  INPUT LAYER (Minimized Human Entry)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │📄 Upload  │ │📲 Payment│ │💬 Chat   │ │⏰ Scheduler        │ │
│  │  KTP/Dok │ │ Gateway  │ │ Petugas  │ │ (Cron Jobs)        │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘ │
├───────▼─────────────▼────────────▼─────────────────▼────────────┤
│  🤖 AI AUTOMATION ENGINE (lib/automation/ + jobs/)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │OCR       │ │Webhook   │ │Credit    │ │ Auto-Journaling    │ │
│  │Service   │ │Processor │ │Scoring AI│ │ Engine             │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  HUMAN VERIFICATION LAYER (Manager/Teller Review)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │Dashboard │ │Approval  │ │Reports   │ │ Fallback Forms     │ │
│  │ & KPI    │ │Workflow  │ │& Export  │ │ (Manual Input)     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                      │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐│
│  │  PostgreSQL (Prisma) │   │  External Services               ││
│  │  - Multi-tenant      │   │  - Xendit (VA, QRIS, Webhook)    ││
│  │  - Audit Trail       │   │  - Google Gemini (OCR + AI)      ││
│  │  - Soft Delete       │   │  - Fonnte / WA Business API      ││
│  └──────────────────────┘   │  - Supabase (File Storage)       ││
│                             │  - Inngest (Background Jobs)     ││
│                             └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Glosarium Istilah

| Istilah | Definisi |
|---------|----------|
| **Anggota** | Individu yang terdaftar dan aktif dalam koperasi |
| **Simpanan Pokok** | Setoran awal wajib saat mendaftar, tidak bisa ditarik selama aktif |
| **Simpanan Wajib** | Setoran rutin per bulan, tidak bisa ditarik selama aktif |
| **Simpanan Sukarela** | Tabungan bebas, bisa setor dan tarik kapan saja |
| **Outstanding** | Sisa saldo pokok pinjaman yang belum dilunasi |
| **Kolektibilitas** | Klasifikasi kualitas pinjaman berdasarkan keterlambatan pembayaran |
| **NPL** | Non-Performing Loan — pinjaman macet (> 90 hari keterlambatan) |
| **SHU** | Sisa Hasil Usaha — setara "laba" pada koperasi, dibagi ke anggota |
| **DPK** | Dalam Perhatian Khusus — pinjaman terlambat 1-90 hari |
| **CoA** | Chart of Accounts — daftar akun untuk pembukuan |
| **Double-entry** | Sistem pencatatan akuntansi: setiap transaksi = Debit + Kredit |
| **Jurnal** | Catatan akuntansi untuk setiap transaksi keuangan |
| **Tenor** | Jangka waktu pinjaman (dalam bulan) |
| **Angsuran** | Cicilan pembayaran pinjaman per periode |
| **Provisi** | Biaya awal pinjaman, dipotong dari jumlah pencairan |
| **Soft Delete** | Penghapusan logis dengan `deleted_at`, data tetap ada di database |
| **RBAC** | Role-Based Access Control — hak akses berdasarkan peran pengguna |
| **Audit Trail** | Rekaman semua perubahan data untuk keperluan audit |
| **Multi-tenant** | Satu sistem untuk banyak koperasi, data terisolasi |
| **OCR** | Optical Character Recognition — ekstraksi teks/data dari gambar/dokumen |
| **Webhook** | Notifikasi HTTP otomatis dari payment gateway saat transaksi terjadi |
| **Idempotency** | Properti sistem: proses yang sama dijalankan berkali-kali hasilnya tetap sama |
| **Virtual Account (VA)** | Nomor rekening virtual unik untuk identifikasi pembayaran otomatis |
| **QRIS** | QR Code Indonesian Standard — standar QR pembayaran nasional Indonesia |
| **Credit Scoring** | Penilaian kelayakan kredit berdasarkan berbagai faktor risiko |
| **Human-in-the-Loop** | Pola desain: AI memberi rekomendasi, manusia membuat keputusan final |
| **Auto-Journaling** | Jurnal akuntansi dibuat otomatis oleh sistem setiap transaksi terjadi |
| **Automation-First** | Filosofi: utamakan otomasi sebelum form input manual |
