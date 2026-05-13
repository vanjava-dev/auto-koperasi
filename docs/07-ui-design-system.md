# 🎨 UI/UX Design System
# Core Koperasi — Panduan Desain Antarmuka

---

## 1. Design Principles

- **Clarity First** — Informasi keuangan harus jelas dan mudah dibaca, hindari ambiguitas
- **Teller-Friendly** — Interface kasir dirancang untuk kecepatan (keyboard shortcut, flow minimal)
- **Trust & Credibility** — Estetika harus memancarkan kepercayaan (financial industry feel)
- **Accessible** — WCAG 2.1 AA compliance, ramah pengguna di berbagai perangkat
- **Data-Dense** — Banyak data perlu ditampilkan, gunakan density yang tepat

---

## 2. Color Palette

### Primary Colors
```css
--color-primary-50:  #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-500: #3B82F6;   /* Main brand blue */
--color-primary-600: #2563EB;   /* Hover state */
--color-primary-700: #1D4ED8;   /* Active/pressed */
--color-primary-900: #1E3A8A;   /* Dark mode primary */
```

### Semantic Colors
```css
/* Success - untuk konfirmasi, saldo positif, lunas */
--color-success-500: #22C55E;
--color-success-100: #DCFCE7;

/* Warning - untuk jatuh tempo, DPK */
--color-warning-500: #F59E0B;
--color-warning-100: #FEF3C7;

/* Danger - untuk NPL, macet, error */
--color-danger-500:  #EF4444;
--color-danger-100:  #FEE2E2;

/* Info - untuk notifikasi informasi */
--color-info-500:    #06B6D4;
--color-info-100:    #CFFAFE;
```

### Neutral Colors (Background & Text)
```css
--color-gray-50:  #F9FAFB;   /* Page background */
--color-gray-100: #F3F4F6;   /* Card/surface */
--color-gray-200: #E5E7EB;   /* Border */
--color-gray-400: #9CA3AF;   /* Placeholder text */
--color-gray-600: #4B5563;   /* Secondary text */
--color-gray-800: #1F2937;   /* Primary text */
--color-gray-950: #030712;   /* Dark mode background */
```

---

## 3. Typography

```css
/* Font Family */
font-family: 'Inter', system-ui, sans-serif;  /* UI & Body */
font-family: 'JetBrains Mono', monospace;     /* Angka / Kode rekening */

/* Scale */
--text-xs:   0.75rem  / 1rem;      /* 12px - Label kecil, badge */
--text-sm:   0.875rem / 1.25rem;   /* 14px - Tabel, form input */
--text-base: 1rem     / 1.5rem;    /* 16px - Body text */
--text-lg:   1.125rem / 1.75rem;   /* 18px - Subheading */
--text-xl:   1.25rem  / 1.75rem;   /* 20px - Section heading */
--text-2xl:  1.5rem   / 2rem;      /* 24px - Page title */
--text-3xl:  1.875rem / 2.25rem;   /* 30px - Dashboard KPI */
```

**Aturan Tipografi:**
- Gunakan `font-tabular-nums` untuk semua angka mata uang agar alignment rapi
- Format Rupiah: `Rp 1.250.000` (bukan `Rp1250000`)
- Tanggal: `15 Jan 2024` atau `15/01/2024` (konsisten dalam satu halaman)

---

## 4. Layout & Spacing

### App Shell Layout
```
┌─────────────────────────────────────────────────┐
│  HEADER (64px) — Logo, User Menu, Notifikasi    │
├──────────────┬──────────────────────────────────┤
│  SIDEBAR     │  CONTENT AREA                    │
│  (240px)     │                                  │
│              │  ┌─ Breadcrumb ──────────────┐   │
│  - Dashboard │  │                           │   │
│  - Anggota   │  │  Page Title               │   │
│  - Simpanan  │  │                           │   │
│  - Pinjaman  │  │  Content / Cards / Table  │   │
│  - Keuangan  │  │                           │   │
│  - Laporan   │  └───────────────────────────┘   │
│  - Admin     │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Spacing System (4px base)
```
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
space-10: 40px
space-12: 48px
```

---

## 5. Komponen Kritis

### 5.1 KPI Card (Dashboard)
```
┌─────────────────────────────────┐
│  Total Outstanding Pinjaman     │
│  ──────────────────────────     │
│  Rp 245.750.000                 │  ← font-size: 28px, font-mono
│                                 │
│  ↑ 12.5% dari bulan lalu        │  ← trend indicator
└─────────────────────────────────┘
```

### 5.2 Status Badge (Kolektibilitas)
```
LANCAR      → bg-success-100 text-success-700
DPK         → bg-warning-100 text-warning-700  
KURANG LANCAR → bg-orange-100 text-orange-700
DIRAGUKAN   → bg-danger-100  text-danger-700
MACET       → bg-red-200     text-red-900 font-bold
```

### 5.3 DataTable Standard
- Sticky header saat scroll
- Kolom tanggal dan angka: align kanan
- Kolom teks: align kiri
- Row hover effect
- Loading skeleton (bukan spinner untuk table)
- Empty state illustration + teks yang jelas
- Pagination + info "Menampilkan 1-20 dari 154 data"

### 5.4 Form Transaksi (Mode Kasir)
- Input jumlah: Auto-format ribuan, fokus otomatis
- Shortcut keyboard: `Enter` untuk submit, `Esc` untuk batal
- Konfirmasi double-check sebelum submit transaksi
- Print otomatis setelah transaksi berhasil (opsional)

---

## 6. Halaman Kritis & Wireframe Konsep

### 6.1 Dashboard (/)
```
[KPI Cards Row: Total Anggota | Total Simpanan | Outstanding | NPL Ratio]

[Grafik: Pertumbuhan Anggota 6 Bln]  [Grafik: Pinjaman per Kolektibilitas]

[Tabel: Angsuran Jatuh Tempo Minggu Ini]  [Tabel: Pinjaman Baru Menunggu Persetujuan]
```

### 6.2 Teller Interface (/kasir)
```
[Input: Cari Anggota (No. Anggota / Nama / NIK)]

[Profil Anggota Singkat]  [Tab: Simpanan | Pinjaman]

[Form Transaksi Cepat]    [Riwayat Transaksi Hari Ini]
```

### 6.3 Detail Anggota (/anggota/:id)
```
[Header: Foto | Nama | No. Anggota | Status Badge]

[Tabs: Profil | Simpanan | Pinjaman | Dokumen | Riwayat]
```

### 6.4 Detail Pinjaman (/pinjaman/:id)
```
[Info Pinjaman: No, Jumlah, Status, Kolektibilitas]

[Timeline Status: Pengajuan → Analisis → Disetujui → Cair → Lunas]

[Tabs: Jadwal Angsuran | Riwayat Pembayaran | Dokumen | Jurnal]

[Tombol Aksi sesuai status: Setujui / Tolak / Cair / Bayar]
```

---

## 7. Responsive Breakpoints

```css
sm:  640px   /* Tabel menjadi scroll horizontal */
md:  768px   /* Sidebar bisa collapse */
lg:  1024px  /* Layout penuh, sidebar selalu tampil */
xl:  1280px  /* Wide mode untuk laporan */
2xl: 1536px  /* Large monitor */
```

**Mobile (< 640px):** Hanya Portal Anggota yang perlu full-mobile. Interface kasir/admin minimal harus berfungsi di tablet (768px+).

---

## 8. Loading & Empty States

### Loading Skeleton
```
Gunakan skeleton shimmer untuk:
- Tabel data (rows placeholder)
- KPI card
- Form yang load data (dropdown anggota, dll)

JANGAN gunakan full-page spinner untuk operasi < 2 detik
```

### Empty States
Setiap halaman dengan data list harus memiliki empty state yang informatif:
```
[Ilustrasi SVG relevan]

"Belum ada data pinjaman"
"Mulai dengan mengklik tombol '+ Pinjaman Baru'"

[Tombol CTA]
```

---

## 9. Print Stylesheet

Dokumen yang perlu di-cetak:
- **Bukti Transaksi Simpanan** (A5 atau half-A4)
- **Kuitansi Pembayaran Angsuran** (A5 atau half-A4)
- **Jadwal Angsuran** (A4)
- **Kartu Anggota** (ID Card size: 85.6 × 54mm)
- **Laporan Keuangan** (A4, landscape untuk laporan lebar)

```css
@media print {
  .no-print { display: none !important; }
  body { font-size: 10pt; color: #000; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 4pt; }
}
```
