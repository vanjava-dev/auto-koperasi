# 🤖 AI Automation Engine Specification
# Core Koperasi — Mesin Otomasi Cerdas

**Versi:** 1.0.0  
**Filosofi:** *"Mesin mengerjakan, manusia memverifikasi."*

> Dokumen ini adalah spesifikasi teknis untuk **AI Data Processing Engine** — inti dari strategi minimisasi SDM dalam Core Koperasi. Setiap komponen di sini harus diimplementasi sebagai layanan yang dapat dipanggil (callable service) dari mana saja dalam codebase.

---

## 1. Arsitektur Otomasi

```
INPUT SOURCES                AUTOMATION ENGINE              OUTPUT
─────────────                ─────────────────              ──────
📄 Upload Dokumen    ──►  [1] OCR Service           ──►  Form Pre-filled
📲 Payment Gateway   ──►  [2] Webhook Processor     ──►  Mutasi + Jurnal
💬 Chat Petugas      ──►  [3] Conversational AI     ──►  Transaksi Executed
📊 Data Anggota      ──►  [4] Credit Scoring AI     ──►  Rekomendasi Kredit
⏰ Scheduler         ──►  [5] Background Jobs       ──►  Kolektibilitas Update
                                    │
                                    ▼
                           [6] Auto-Journaling
                                    │
                                    ▼
                              Ledger Updated ✅
                              Audit Log Saved ✅
                              Notification Sent ✅
```

---

## 2. Komponen 1 — OCR Service (Intelligent Document Processing)

**File:** `lib/automation/ocr.ts`  
**Teknologi:** Google Gemini Vision API (atau Google Cloud Vision API)

### Fungsi Utama

```typescript
interface OcrResult {
  success: boolean;
  confidence: number;          // 0.0 - 1.0
  data: Partial<AnggotaData>;  // Data yang berhasil diekstrak
  rawText: string;             // Teks mentah dari dokumen
  warnings: string[];          // Field yang perlu verifikasi manual
}

// Ekstrak data dari foto KTP
async function extractKTP(imageUrl: string): Promise<OcrResult>

// Ekstrak data dari slip gaji
async function extractSlipGaji(imageUrl: string): Promise<OcrResult>

// Ekstrak data dari laporan keuangan usaha
async function extractLaporanUsaha(imageUrl: string): Promise<OcrResult>
```

### Data yang Diekstrak dari KTP

| Field KTP | Dipetakan ke Field DB | Confidence Min |
|-----------|----------------------|----------------|
| NIK (16 digit) | `anggota.nik` | 99% |
| Nama | `anggota.nama_lengkap` | 95% |
| Tempat/Tanggal Lahir | `anggota.tempat_lahir`, `tanggal_lahir` | 90% |
| Jenis Kelamin | `anggota.jenis_kelamin` | 99% |
| Alamat | `anggota.alamat_ktp` | 85% |
| RT/RW, Kel, Kec | Bagian dari `alamat_ktp` | 80% |
| Agama | `anggota.agama` | 90% |
| Pekerjaan | `anggota.pekerjaan` | 75% |

### Alur Kerja OCR di Form Pendaftaran

```
Petugas upload foto KTP
        │
        ▼
OCR Service dipanggil (async, non-blocking)
        │
        ▼
Confidence check per-field:
  ≥ 95% → Auto-fill, field disabled (tidak bisa diubah tanpa unlock)
  75-94% → Auto-fill + highlight kuning (perlu verifikasi)
  < 75%  → Field kosong + warning merah (harus input manual)
        │
        ▼
Petugas review & koreksi jika perlu
        │
        ▼
Submit form → Data tersimpan + confidence score dicatat di DB
```

### Prompt Template untuk Gemini Vision (KTP)

```
Ekstrak informasi dari foto KTP Indonesia ini. 
Kembalikan HANYA objek JSON dengan format berikut, tanpa teks lain:
{
  "nik": "string 16 digit",
  "nama": "string",
  "tempat_lahir": "string",
  "tanggal_lahir": "YYYY-MM-DD",
  "jenis_kelamin": "LAKI_LAKI" | "PEREMPUAN",
  "alamat": "string lengkap",
  "agama": "string",
  "pekerjaan": "string",
  "confidence": { "nik": 0.99, "nama": 0.95, ... }
}
Jika field tidak terbaca, isi dengan null.
```

---

## 3. Komponen 2 — Webhook Processor (Event-Driven Transactions)

**File:** `app/api/webhooks/`  
**Prinsip:** Setiap webhook yang masuk = 1 transaksi otomatis. Zero manual entry.

### 2.1 Xendit Payment Webhook Handler

**Endpoint:** `POST /api/webhooks/xendit`

```typescript
// Alur pemrosesan webhook
async function processXenditWebhook(payload: XenditPayload): Promise<void> {
  // 1. Validasi token keamanan (WAJIB - tolak jika gagal)
  validateWebhookToken(payload.token);

  // 2. Idempotency check (hindari double-processing)
  const existing = await checkExistingTransaction(payload.external_id);
  if (existing) return; // Sudah diproses, skip

  // 3. Identifikasi jenis transaksi berdasarkan external_id prefix
  const type = parseTransactionType(payload.external_id);
  // Contoh: "SMP-{rekening_id}-{timestamp}" → setoran simpanan
  // Contoh: "ANG-{jadwal_id}-{timestamp}"   → pembayaran angsuran

  // 4. Eksekusi transaksi sesuai tipe
  switch (type) {
    case 'SIMPANAN': await processSimpananWebhook(payload); break;
    case 'ANGSURAN': await processAngsuranWebhook(payload); break;
  }

  // 5. Auto-journaling (otomatis dipanggil dalam setiap processor)
  // 6. Kirim notifikasi ke anggota (WhatsApp/Email)
  // 7. Catat audit log (source: 'WEBHOOK_XENDIT')
}
```

### 2.2 Mapping External ID → Transaksi

| Prefix External ID | Jenis | Aksi Otomatis |
|--------------------|-------|---------------|
| `SMP-{id}-{ts}` | Setoran Simpanan | Kredit saldo rekening |
| `ANG-{id}-{ts}` | Bayar Angsuran | Update jadwal + saldo outstanding |
| `CAI-{id}-{ts}` | Pencairan Pinjaman | Konfirmasi cair ke anggota |

### 2.3 Virtual Account Pattern (Simpanan Wajib)

```
Setiap anggota mendapat VA unik per rekening simpanan.
Format VA: {KODE_BANK}{KOPERASI_CODE}{NO_REKENING}
Contoh:    014-KSP01-20240001

Anggota transfer → VA terdeteksi → Webhook masuk → 
Simpanan Wajib otomatis tercatat → Jurnal generate → Notifikasi WA
```

### 2.4 QRIS untuk Kasir (Pembayaran Angsuran di Tempat)

```
Anggota datang ke kasir → Teller generate QRIS dinamis via Xendit API
                          (amount = total_angsuran + denda)
                                    │
                        Anggota scan & bayar via HP
                                    │
                        Xendit callback → Webhook processor
                                    │
                        Angsuran otomatis terbayar → Print kuitansi
```

---

## 4. Komponen 3 — Conversational AI (Natural Language Transactions)

**File:** `app/api/chat/route.ts`  
**SDK:** Vercel AI SDK + Google Gemini  
**Akses:** Hanya untuk petugas yang sudah login (validasi sesi wajib)

### Kapabilitas Tools AI

```typescript
const cooperativeTools = {

  // ── QUERY TOOLS (Read-only) ──────────────────────────
  cariAnggota: tool({
    description: 'Cari anggota berdasarkan nama, NIK, atau nomor anggota',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => searchAnggota(query)
  }),

  cekSaldoSimpanan: tool({
    description: 'Cek saldo simpanan anggota',
    parameters: z.object({ anggota_id: z.string() }),
    execute: async ({ anggota_id }) => getSaldoSimpanan(anggota_id)
  }),

  cekTagihanAngsuran: tool({
    description: 'Cek tagihan angsuran yang harus dibayar',
    parameters: z.object({ anggota_id: z.string() }),
    execute: async ({ anggota_id }) => getTagihanAngsuran(anggota_id)
  }),

  simulasiPinjaman: tool({
    description: 'Hitung simulasi angsuran pinjaman',
    parameters: z.object({
      jumlah: z.number(),
      tenor_bulan: z.number(),
      produk_id: z.string().optional()
    }),
    execute: async (params) => calculateSimulasi(params)
  }),

  laporanKolektibilitas: tool({
    description: 'Laporan kolektibilitas pinjaman koperasi',
    parameters: z.object({ periode: z.string().optional() }),
    execute: async ({ periode }) => getKolektibilitas(periode)
  }),

  // ── ACTION TOOLS (Write — dengan konfirmasi) ─────────
  catatSetoranTunai: tool({
    description: 'Catat setoran simpanan tunai dari anggota di kasir',
    parameters: z.object({
      anggota_id: z.string(),
      rekening_id: z.string(),
      jumlah: z.number(),
      keterangan: z.string().optional()
    }),
    execute: async (params, { userId }) => {
      // Validasi: userId harus punya role TELLER atau ADMIN
      await validateTellerRole(userId);
      return await createSetoranTunai({ ...params, kasir_id: userId });
    }
  }),

  catatPembayaranAngsuranTunai: tool({
    description: 'Catat pembayaran angsuran tunai dari anggota',
    parameters: z.object({
      anggota_id: z.string(),
      jadwal_id: z.string(),
      jumlah_bayar: z.number()
    }),
    execute: async (params, { userId }) => {
      await validateTellerRole(userId);
      return await createPembayaranTunai({ ...params, kasir_id: userId });
    }
  }),
};
```

### Contoh Skenario Percakapan

**Skenario 1: Setoran via Chat**
```
Petugas: "Ibu Siti Rahayu bayar simpanan sukarela 200 ribu tunai"

AI:      [Memanggil tool: cariAnggota("Siti Rahayu")]
         → Ditemukan: Siti Rahayu (KSP-2024-0023)

         "Saya temukan Siti Rahayu (No. Anggota: KSP-2024-0023).
          Konfirmasi setoran Simpanan Sukarela Rp 200.000 tunai?
          Ketik 'ya' untuk proses."

Petugas: "ya"

AI:      [Memanggil tool: catatSetoranTunai({...})]
         → Transaksi berhasil. Jurnal ter-generate. Notifikasi WA terkirim.

         "✅ Setoran berhasil!
          Saldo Simpanan Sukarela Siti Rahayu: Rp 2.200.000
          No. Transaksi: TRX-20240115-004821
          Bukti sudah dikirim via WhatsApp ke 0812-xxx-xxxx"
```

**Skenario 2: Laporan via Chat**
```
Manager: "Berapa total NPL koperasi bulan ini?"

AI:      [Memanggil tool: laporanKolektibilitas({periode: "2024-01"})]

         "📊 Laporan Kolektibilitas Januari 2024:
          • Lancar:        Rp 180.250.000 (73.2%)
          • DPK:           Rp  42.500.000 (17.3%)
          • Kurang Lancar: Rp  15.000.000 (6.1%)
          • Macet:          Rp   8.250.000 (3.4%) ← NPL
          
          Rasio NPL: 3.4% (batas aman < 5%)
          Status: ✅ Dalam batas normal"
```

---

## 5. Komponen 4 — AI Credit Scoring Engine

**File:** `lib/automation/credit-score.ts`

### Model Penilaian (5C + AI Enhancement)

```
SKOR KREDIT = Weighted Score dari:

┌─────────────────────────────────────────────────────────┐
│  FAKTOR              │  BOBOT │  DATA SUMBER            │
├─────────────────────┼────────┼─────────────────────────┤
│ Character (Karakter) │  20%  │ Riwayat pinjaman, kolektibilitas lama │
│ Capacity (Kapasitas) │  30%  │ Penghasilan vs. total kewajiban       │
│ Capital (Modal)      │  20%  │ Total simpanan, aset yang dilaporkan  │
│ Collateral (Jaminan) │  15%  │ Nilai & jenis jaminan yang disertakan │
│ Condition (Kondisi)  │  10%  │ Tujuan pinjaman, kondisi ekonomi      │
│ AI Risk Factor       │   5%  │ Pola transaksi simpanan (anomali)     │
└─────────────────────┴────────┴─────────────────────────┘
```

### Output Credit Score

```typescript
interface CreditScoreResult {
  score: number;           // 300 - 850 (mirip SLIK/BI Checking)
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  recommendation: 'SETUJUI' | 'PERTIMBANGKAN' | 'TOLAK';
  max_pinjaman: number;    // Rekomendasi maksimal pinjaman yang layak
  reasons: string[];       // Alasan (positif & negatif)
  risk_flags: string[];    // Flag risiko khusus (jika ada)
  detail: {
    character: number;     // Sub-skor per faktor
    capacity: number;
    capital: number;
    collateral: number;
    condition: number;
    ai_risk: number;
  }
}
```

### Kriteria Otomatis

| Grade | Skor | Rekomendasi | Tindak Lanjut |
|-------|------|-------------|---------------|
| A | 750-850 | SETUJUI | Auto-approve untuk pinjaman ≤ Rp 5 juta (konfigurabel) |
| B | 650-749 | SETUJUI | Perlu tanda tangan Manager |
| C | 550-649 | PERTIMBANGKAN | Review mendalam + jaminan tambahan |
| D | 400-549 | TOLAK | Tolak otomatis, notifikasi alasan |
| E | 300-399 | TOLAK | Blacklist sementara |

---

## 6. Komponen 5 — Background Jobs (Cron Automation)

**File:** `jobs/`  
**Engine:** Inngest (recommended) atau Vercel Cron Jobs

### Jadwal Job Otomatis

| Job | Jadwal | Fungsi |
|-----|--------|--------|
| `collectibility.ts` | Setiap hari 00:05 WIB | Update kolektibilitas semua pinjaman aktif berdasarkan hari keterlambatan |
| `interest.ts` | Akhir bulan (tgl 28, 00:30 WIB) | Hitung & kredit bunga simpanan ke rekening |
| `reminder.ts` | Setiap hari 08:00 WIB | Kirim WhatsApp reminder jatuh tempo H-7 dan H-1 |
| `overdue-notice.ts` | Setiap hari 09:00 WIB | Kirim peringatan via WA untuk angsuran yang H+1 melewati jatuh tempo |
| `shu-calculation.ts` | Akhir tahun (31 Des, 01:00 WIB) | Hitung SHU tahunan per anggota |

### Contoh: Collectibility Job

```typescript
// jobs/collectibility.ts
export async function updateCollectibility() {
  const today = new Date();

  // Ambil semua jadwal angsuran yang belum lunas
  const overdueSchedules = await prisma.jadwalAngsuran.findMany({
    where: {
      status: { not: 'LUNAS' },
      tgl_jatuh_tempo: { lt: today }
    },
    include: { pinjaman: true }
  });

  for (const schedule of overdueSchedules) {
    const daysLate = differenceInDays(today, schedule.tgl_jatuh_tempo);
    const newKolektibilitas = calculateKolektibilitas(daysLate);

    // Update kolektibilitas pinjaman jika berubah
    if (schedule.pinjaman.kolektibilitas !== newKolektibilitas) {
      await prisma.pinjaman.update({
        where: { id: schedule.pinjaman.id },
        data: { kolektibilitas: newKolektibilitas }
      });

      // Audit log
      await createAuditLog({
        aksi: 'AUTO_UPDATE',
        modul: 'PINJAMAN',
        referensi_id: schedule.pinjaman.id,
        data_lama: { kolektibilitas: schedule.pinjaman.kolektibilitas },
        data_baru: { kolektibilitas: newKolektibilitas },
        source: 'CRON_JOB'
      });
    }
  }
}
```

---

## 7. Komponen 6 — Auto-Journaling Service

**File:** `lib/automation/journaling.ts`  
**Prinsip:** Setiap transaksi keuangan = 1 fungsi auto-journal yang dipanggil otomatis.

### Interface

```typescript
type JournalTrigger =
  | 'SETORAN_SIMPANAN'
  | 'PENARIKAN_SIMPANAN'
  | 'PENCAIRAN_PINJAMAN'
  | 'PEMBAYARAN_ANGSURAN'
  | 'BUNGA_SIMPANAN'
  | 'DENDA_ANGSURAN';

async function autoJournal(
  trigger: JournalTrigger,
  payload: JournalPayload,
  tx: PrismaTransactionClient  // Selalu di dalam Prisma transaction
): Promise<Jurnal>
```

### Aturan Penting Auto-Journaling

1. Auto-journal **HARUS** dipanggil di dalam `prisma.$transaction()` yang sama dengan transaksi utama. Jika transaksi dibatalkan, jurnal ikut dibatalkan (atomik).
2. Jurnal yang di-generate otomatis memiliki flag `auto_generated: true` dan tidak perlu di-posting manual.
3. Jika auto-journal gagal, seluruh transaksi harus di-rollback dan error di-log ke sistem monitoring.

---

## 8. Decision Matrix: Otomasi vs. Manual

Gunakan tabel ini setiap kali merancang fitur baru:

| Proses | Strategi | Fallback |
|--------|----------|----------|
| Input data KTP anggota | OCR otomatis | Input manual jika confidence < 75% |
| Setoran simpanan via bank | Webhook Xendit | Form kasir manual |
| Bayar angsuran via QRIS | Webhook Xendit | Form kasir manual |
| Pencairan pinjaman | Otomatis via Xendit Disbursement API | Transfer manual + konfirmasi teller |
| Scoring kredit | AI auto-scoring | Input manual analis |
| Jurnal akuntansi | Auto-journaling | Jurnal manual oleh Bendahara (audit) |
| Update kolektibilitas | Cron job harian | Update manual oleh Manager |
| Notifikasi jatuh tempo | Cron job otomatis | — |
| Laporan keuangan | Generate otomatis | — |
| Persetujuan pinjaman | Human-in-the-loop (review rekomendasi AI) | — |

---

## 9. Tech Stack Automation Engine

| Kebutuhan | Teknologi | Alasan |
|-----------|-----------|--------|
| OCR / Vision | Google Gemini Vision API | Terintegrasi dengan AI ecosystem |
| AI Agent | Vercel AI SDK + Gemini | Streaming native di Next.js |
| Payment Webhook | Xendit | Payment gateway lokal terpercaya |
| Background Jobs | Inngest | Serverless-friendly, retry otomatis |
| WhatsApp | Fonnte / WA Business Cloud API | Terpercaya, biaya terjangkau |
| Queue / Event Bus | Inngest Events | Reliable delivery, dead-letter queue |
| Monitoring | Sentry + custom logging | Error tracking otomatis |
