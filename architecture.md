# Project Architecture & Vibe Coding Guidelines

## 1. Project Overview
Aplikasi ini adalah **Core Koperasi** — platform manajemen koperasi generasi berikutnya yang dibangun di atas Next.js App Router dengan filosofi utama **Automation-First**.

### 🤖 Filosofi Utama: Automation-First
> *"Mesin mengerjakan, manusia memverifikasi."*

Setiap fitur yang dibangun HARUS mempertimbangkan apakah proses input data bisa diotomasi. Peran manusia (staf koperasi) digeser dari **Data Entry** (mengetik data) menjadi **Data Reviewer** (memverifikasi & menyetujui hasil kerja mesin).

**Tiga Pilar Otomasi:**
1. **Event-Driven Transactions** — Transaksi keuangan dipicu oleh event eksternal (webhook payment gateway), bukan input manual kasir.
2. **AI Document Processing** — Data anggota/pinjaman diekstrak otomatis dari dokumen (KTP, Slip Gaji) via OCR + Vision AI.
3. **Intelligent Automation** — Credit scoring, klasifikasi kolektibilitas, dan jurnal akuntansi dijalankan otomatis oleh mesin.

Pendekatan teknis: Server-First — maksimalkan Server Components dan Server Actions, gunakan Client Components hanya saat interaktivitas benar-benar dibutuhkan.

## 2. Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode: ON)
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui & Radix UI primitives
- **Database:** PostgreSQL
- **ORM:** Prisma

## 3. Directory Structure
Patuhi struktur berikut untuk menjaga konsistensi:
```
/project-root
 ├── /app                    # Next.js App Router (Pages, Layouts, Loading, Error)
 │    ├── /api               # Route handlers
 │    │    ├── /webhooks     # ⚡ Webhook handlers (Xendit, Bank, dll)
 │    │    └── /chat         # AI Agent endpoint
 │    └── /(routes)          # Folder untuk struktur halaman web
 ├── /components             # Reusable UI components
 │    ├── /ui                # shadcn/ui base components
 │    └── /shared            # Komponen gabungan spesifik proyek
 ├── /lib                    # Utility functions & helpers
 │    ├── /prisma            # Prisma client instance
 │    ├── /automation        # 🤖 AI Automation Engine
 │    │    ├── ocr.ts        # Document OCR & data extraction
 │    │    ├── credit-score.ts # AI Credit Scoring engine
 │    │    ├── journaling.ts # Auto-journaling service
 │    │    └── notification.ts # Notifikasi otomatis
 │    └── /financial         # Kalkulasi keuangan (angsuran, bunga, denda)
 ├── /actions                # Server Actions (validasi + orkestrasi)
 ├── /jobs                   # 🕐 Background Jobs / Cron Tasks
 │    ├── collectibility.ts  # Update kolektibilitas harian
 │    ├── interest.ts        # Hitung bunga simpanan
 │    └── reminder.ts        # Kirim reminder jatuh tempo
 ├── /types                  # Global TypeScript interfaces & types
 ├── /prisma                 # schema.prisma dan database migrations
 └── /docs                   # Dokumen spesifikasi proyek
```

## 4. Core Coding Rules (WAJIB DIIKUTI AGEN AI)

> ⚠️ **ATURAN TERTINGGI:** Sebelum membuat form input manual untuk data transaksi, TANYAKAN dahulu:
> *"Bisakah ini dipicu oleh webhook, OCR, atau proses otomatis?"*
> Jika bisa → otomasi WAJIB diutamakan. Form manual hanya sebagai fallback.

### A. TypeScript & Data Fetching
- JANGAN PERNAH menggunakan tipe `any`. Selalu definisikan `interface` atau `type` dengan jelas untuk setiap props komponen dan balikan fungsi (return type).
- Pengambilan data (Fetching) harus dilakukan di Server Components menggunakan `async/await` langsung ke Prisma, tanpa melewati route API eksternal.

### B. Mutasi Data (Server Actions)
- Semua aksi yang mengubah data (Create, Update, Delete) harus menggunakan Next.js Server Actions yang ditempatkan di folder `/actions`.
- Selalu lakukan validasi input menggunakan library seperti `zod` di dalam Server Action sebelum menyimpan data ke database.
- Gunakan `revalidatePath` atau `revalidateTag` setelah mutasi berhasil untuk memperbarui UI.

### C. Styling & UI
- Gunakan Tailwind CSS untuk semua styling. Jangan membuat file `.css` khusus kecuali untuk konfigurasi global dasar.
- Desain harus responsif (Mobile-First) dan memperhatikan aksesibilitas (aria-labels, keyboard navigation).

### D. Penanganan Error (Error Handling)
- Bungkus operasi database dan Server Actions dalam blok `try/catch`.
- Kembalikan error dalam format objek standar: `{ success: false, error: "Pesan error" }` alih-alih melempar exception mentah ke UI.

### E. Payment Gateway Integration (Xendit)
- SEMUA interaksi dengan API Xendit (Create Invoice, Create Virtual Account, Disbursement) harus dilakukan di server-side (Server Actions atau Route Handlers `/api`).
- Jangan pernah mengekspos Secret Key ke client-side.
- Buat Route Handler khusus (misalnya `/api/webhooks/xendit`) untuk menerima callback transaksi. Route ini WAJIB memvalidasi token webhook Xendit sebelum melakukan operasi database (Prisma).
- Selalu gunakan `reference_id` yang unik (UUID) untuk setiap transaksi dan pastikan database mengecek idempotensi sebelum memperbarui saldo/status pengguna.

### F. AI Automation Engine (ATURAN BARU — WAJIB)
- **Auto-Journaling:** SETIAP transaksi keuangan (simpanan, pinjaman, pembayaran) HARUS memanggil `lib/automation/journaling.ts` untuk generate jurnal double-entry otomatis. Tidak boleh ada transaksi tanpa jurnal.
- **OCR / Document Extraction:** Upload dokumen (KTP, Slip Gaji, dll) HARUS diproses via `lib/automation/ocr.ts` menggunakan Google Vision API / Gemini Vision sebelum data ditampilkan di form. Tujuannya pre-fill form, bukan ganti manusia sepenuhnya.
- **Webhook-First Transactions:** Transaksi yang bisa dipicu webhook (simpanan via VA, pembayaran angsuran via QRIS) HARUS diimplementasi via `/api/webhooks/` terlebih dahulu. Form manual kasir adalah fallback.
- **AI Credit Scoring:** Setiap pengajuan pinjaman HARUS memanggil `lib/automation/credit-score.ts` untuk menghasilkan skor kredit otomatis. Hasil skor adalah rekomendasi; keputusan final tetap di tangan Manager.
- **Conversational Input:** Agent AI di `/api/chat/route.ts` menggunakan Vercel AI SDK dengan tools yang tervalidasi untuk menerima perintah natural language dari petugas lapangan. Gunakan `streamText` + `tools` untuk eksekusi transaksi via chat.
- Semua aksi AI yang menyentuh data finansial WAJIB mencatat entry di `audit_log` dengan `source: 'AI_AGENT'`.

### G. Version Control & GitHub Workflow
- **Sistem VCS:** Git & GitHub.
- **Branching Strategy:** - `main`: Cabang produksi (Production). Kode di sini harus selalu siap rilis dan stabil.
  - `dev` / `staging`: Cabang untuk pengujian sebelum masuk ke produksi.
  - Cabang fitur/bug: Selalu buat cabang baru dari `main` atau `dev` dengan format penamaan yang deskriptif. Contoh: `feature/ai-agent-integration`, `fix/xendit-webhook-error`, `chore/update-dependencies`.
- **Commit Messages:** WAJIB menggunakan standar **Conventional Commits** agar riwayat proyek mudah dibaca dan diotomatisasi. 
  - Format: `<type>(<scope>): <subject>`
  - Contoh: `feat(payment): add Xendit invoice creation`, `fix(auth): resolve session timeout bug`, `refactor(ui): optimize tailwind classes on dashboard`.
- **Pull Requests (PR):** Setiap penambahan fitur besar harus melalui PR. Jangan langsung melakukan `push` ke cabang `main`.

### H. Environment & Secrets Management
- Semua API Keys (Xendit, AI Provider, Database URL) HARUS didefinisikan di `.env` dan memiliki template di `.env.example`.
- Setiap kali menambahkan variabel environment baru, WAJIB memperbarui file `.env.example` dengan nilai dummy.
- Gunakan skema validasi (misal: paket `t3-env` atau `zod`) untuk memastikan aplikasi tidak bisa proses *build* jika ada variabel environment yang hilang.

### I. Observability & Logging (Pencatatan Error)
- Jangan gunakan sekadar `console.log()` untuk error yang melibatkan pembayaran atau AI.
- Buat standar logging terpusat. Jika terjadi error pada Webhook Xendit, log harus mencatat `reference_id` transaksi dan detail error-nya, lalu disaring agar tidak mencatat data sensitif (seperti nomor kartu/identitas).

### J. Testing Strategy (Pengujian)
- KODE PEMBAYARAN HARUS DIUJI. Setiap mutasi yang melibatkan tabel saldo/transaksi harus memiliki *Unit Test*.
- Gunakan `Vitest` atau `Jest` untuk logika backend, dan `Playwright` untuk E2E (End-to-End) testing di alur *checkout*.

### K. Kepatuhan Mutlak Antarmuka UI/UX & Mobile (WAJIB BAGI AI AGENT)
Ketika diminta membangun atau memodifikasi antarmuka visual/komponen, AI Agent **WAJIB SECARA KETAT** mengacu pada dua dokumen pedoman baku berikut tanpa kecuali:
1. **Patuhi `docs/09-ui-ux-standardization-sop.md`**:
   - **Larangan `alert()`**: Haram menggunakan `alert()` peramban untuk notifikasi apapun. Wajib memanggil komponen `<FeedbackModal />` bergaya Tabler UI.
   - **Tombol Berikon**: Setiap tombol aksi wajib menggunakan pendamping ikon dari `lucide-react` di sisi kiri teks (`mr-2 h-4 w-4`). Tombol aksi baris tabel wajib berdesain minimalis berbasis murni ikon.
   - **Standar Tabel**: Wajib memakai kelas header seragam (`bg-slate-50/70`), tipografi uang/angka rata kanan berbasis *monospace* (`font-mono text-sm`), penyematan *empty state*, dan blok *Pagination* standar di bagian bawah.
2. **Patuhi `docs/10-mobile-responsive-sop.md`**:
   - Komponen tabel dengan banyak kolom wajib dibungkus wadah `overflow-x-auto` berbasis usap horizontal (*horizontal swipe*).
   - Area ketuk tombol seluler minimal setinggi `40px` untuk kenyamanan mobilitas.
   - Pahami bahwa Koperasi-AI memiliki subsistem Portal Anggota Android berbasis PWA/CapacitorJS di mana AI Agent bertugas merakit 95% otomatisasi konfigurasinya.

### L. Mandatory Audit Logging — Wajib Audit Log (ATURAN KERAS)

> ⚠️ **ATURAN MUTLAK TIDAK DAPAT DIKECUALIKAN:** Setiap operasi yang mengubah, membuat, atau menghapus data **HARUS** menyisipkan satu entri ke dalam tabel `audit_log` dalam transaksi basis data yang sama. **Tidak ada pengecualian.**

**Cakupan wajib — semua aksi berikut WAJIB dicatat:**

| Kategori | Aksi yang Dicatat |
|---|---|
| **Otentikasi** | Login berhasil, Login gagal, Logout, Perubahan kata sandi |
| **Keanggotaan** | Pendaftaran, Verifikasi, Perubahan status, Update profil |
| **Transaksi Simpanan** | Setiap setoran & penarikan (manual maupun via webhook) |
| **Transaksi Pinjaman** | Pengajuan, Persetujuan, Penolakan, Pencairan, Pembayaran angsuran |
| **Jurnal Akuntansi** | Setiap pembuatan & koreksi entri jurnal |
| **Produk & Konfigurasi** | Create/Update/Delete produk simpanan & pinjaman |
| **Ekspor Data** | Setiap export laporan ke PDF/Excel |
| **Aksi AI Agent** | Setiap tindakan otonom yang menyentuh data finansial |

**Pola implementasi wajib di setiap Server Action:**

```typescript
// ✅ BENAR — Audit log disisipkan dalam satu transaksi Prisma yang atomik
await prisma.$transaction([
  // 1. Operasi utama terlebih dahulu
  prisma.mutasiSimpanan.create({ data: { ... } }),

  // 2. Audit log wajib dalam blok transaksi yang sama
  prisma.auditLog.create({
    data: {
      userId: session.user.id,          // ID petugas / null jika sistem
      source: "TELLER",                 // "TELLER" | "WEBHOOK" | "AI_AGENT" | "SYSTEM"
      action: "SETORAN_SIMPANAN",       // Nama aksi dalam UPPER_SNAKE_CASE
      entityType: "REKENING_SIMPANAN",  // Nama entitas yang terpengaruh
      entityId: rekening.id,            // ID entitas yang diubah
      details: JSON.stringify({         // Payload sebelum & sesudah perubahan
        nominalSebelum: rekening.saldo,
        nominalSesudah: saldoBaru,
        keterangan: input.keterangan,
      }),
    },
  }),
]);

// ❌ SALAH — Transaksi tanpa audit log. Kode ini DILARANG.
await prisma.mutasiSimpanan.create({ data: { ... } });
```

**Properti wajib pada setiap entri `audit_log`:**

| Properti | Tipe | Keterangan |
|---|---|---|
| `userId` | `String?` | ID pengguna yang melakukan aksi. `null` jika dipicu sistem otomatis. |
| `source` | `String` | `"TELLER"`, `"WEBHOOK"`, `"AI_AGENT"`, `"CRON"`, atau `"SYSTEM"`. |
| `action` | `String` | Nama aksi dalam format `UPPER_SNAKE_CASE`. Contoh: `SETORAN_SIMPANAN`. |
| `entityType` | `String` | Nama entitas terpengaruh. Contoh: `ANGGOTA`, `PINJAMAN`, `JURNAL`. |
| `entityId` | `String` | UUID entitas yang dimodifikasi. |
| `details` | `String (JSON)` | Snapshot data relevan (sebelum & sesudah). **Jangan simpan password, token, atau secret.** |
