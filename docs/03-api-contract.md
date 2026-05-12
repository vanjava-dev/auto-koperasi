# 🔌 API Contract & Endpoint Specification
# Core Koperasi — RESTful API & Server Actions Reference

**Versi:** 1.0.0  
**Base URL:** `/api/v1`  
**Auth:** Bearer Token (JWT) — header `Authorization: Bearer <token>`  
**Format Response:** JSON  

---

## 1. Konvensi Umum

### 1.1 Format Response Sukses
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 1.2 Format Response Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "NIK sudah terdaftar dalam sistem",
    "fields": {
      "nik": ["NIK sudah digunakan"]
    }
  }
}
```

### 1.3 Kode Error Standar
| Kode | HTTP Status | Keterangan |
|------|-------------|------------|
| `AUTH_REQUIRED` | 401 | Token tidak ada atau tidak valid |
| `FORBIDDEN` | 403 | Tidak punya izin untuk aksi ini |
| `NOT_FOUND` | 404 | Data tidak ditemukan |
| `VALIDATION_ERROR` | 422 | Input tidak valid |
| `CONFLICT` | 409 | Data duplikat |
| `INTERNAL_ERROR` | 500 | Error server |

### 1.4 Query Params Umum (untuk list endpoint)
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `page` | int | 1 | Halaman data |
| `limit` | int | 20 | Jumlah per halaman (max: 100) |
| `search` | string | — | Pencarian teks |
| `sort` | string | `created_at` | Kolom untuk sorting |
| `order` | string | `desc` | `asc` atau `desc` |

---

## 2. Authentication Endpoints

```
POST   /api/auth/login           → Login, mendapatkan JWT token
POST   /api/auth/logout          → Invalidasi token
POST   /api/auth/refresh         → Refresh access token
GET    /api/auth/me              → Profil user yang sedang login
PUT    /api/auth/change-password → Ganti password
```

### POST /api/auth/login
**Request Body:**
```json
{
  "email": "teller@ksp-harapan.co.id",
  "password": "rahasia123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "nama": "Budi Santoso",
      "email": "teller@ksp-harapan.co.id",
      "roles": ["TELLER"],
      "koperasi": { "id": "uuid", "nama": "KSP Harapan Artha" }
    }
  }
}
```

---

## 3. Anggota Endpoints

```
GET    /api/anggota              → List anggota (paginasi + filter)
POST   /api/anggota              → Daftarkan anggota baru
GET    /api/anggota/:id          → Detail anggota
PUT    /api/anggota/:id          → Update data anggota
DELETE /api/anggota/:id          → Soft delete anggota

POST   /api/anggota/:id/aktivasi → Setujui/aktivasi anggota
GET    /api/anggota/:id/simpanan → Semua rekening simpanan anggota
GET    /api/anggota/:id/pinjaman → Semua pinjaman anggota
GET    /api/anggota/:id/ringkasan → Ringkasan keuangan anggota
```

### GET /api/anggota (Query Params Tambahan)
| Param | Keterangan |
|-------|------------|
| `status` | `AKTIF`, `CALON`, `TIDAK_AKTIF`, `KELUAR` |
| `tgl_dari` | Tanggal bergabung (dari) |
| `tgl_sampai` | Tanggal bergabung (sampai) |

### POST /api/anggota
**Request Body:**
```json
{
  "nik": "3171234567890001",
  "nama_lengkap": "Siti Rahayu",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "1990-05-15",
  "jenis_kelamin": "PEREMPUAN",
  "pekerjaan": "Wirausaha",
  "penghasilan": 5000000,
  "telepon": "081234567890",
  "email": "siti@email.com",
  "alamat_ktp": "Jl. Mawar No. 12, Jakarta Selatan",
  "alamat_domisili": "Jl. Mawar No. 12, Jakarta Selatan"
}
```

---

## 4. Simpanan Endpoints

```
GET    /api/produk-simpanan          → List produk simpanan
POST   /api/produk-simpanan          → Buat produk simpanan baru
GET    /api/produk-simpanan/:id      → Detail produk simpanan
PUT    /api/produk-simpanan/:id      → Update produk simpanan

GET    /api/simpanan                 → List semua rekening simpanan
POST   /api/simpanan                 → Buka rekening simpanan baru
GET    /api/simpanan/:id             → Detail rekening simpanan
GET    /api/simpanan/:id/mutasi      → Mutasi/riwayat rekening

POST   /api/simpanan/:id/setor       → Transaksi setoran
POST   /api/simpanan/:id/tarik       → Transaksi penarikan
POST   /api/simpanan/:id/tutup       → Tutup rekening simpanan
```

### POST /api/simpanan/:id/setor
**Request Body:**
```json
{
  "jumlah": 500000,
  "tanggal": "2024-01-15",
  "keterangan": "Setoran simpanan sukarela",
  "metode_bayar": "TUNAI"
}
```

---

## 5. Pinjaman Endpoints

```
GET    /api/produk-pinjaman          → List produk pinjaman
POST   /api/produk-pinjaman          → Buat produk pinjaman baru

GET    /api/pinjaman                 → List semua pinjaman
POST   /api/pinjaman                 → Pengajuan pinjaman baru
GET    /api/pinjaman/:id             → Detail pinjaman
PUT    /api/pinjaman/:id             → Update pinjaman (jika masih pengajuan)

POST   /api/pinjaman/:id/analisis    → Submit hasil analisis kredit
POST   /api/pinjaman/:id/setujui     → Setujui pinjaman
POST   /api/pinjaman/:id/tolak       → Tolak pinjaman
POST   /api/pinjaman/:id/cair        → Cairkan pinjaman

GET    /api/pinjaman/:id/jadwal      → Jadwal angsuran
POST   /api/pinjaman/:id/bayar       → Bayar angsuran
POST   /api/pinjaman/:id/lunasi      → Pelunasan dipercepat

GET    /api/pinjaman/jatuh-tempo     → Daftar pinjaman yang akan/sudah jatuh tempo
GET    /api/pinjaman/kolektibilitas  → Rangkuman kolektibilitas
```

### POST /api/pinjaman (Pengajuan)
**Request Body:**
```json
{
  "anggota_id": "uuid-anggota",
  "produk_id": "uuid-produk-pinjaman",
  "jumlah_pinjaman": 10000000,
  "tenor_bulan": 12,
  "tujuan": "Modal usaha warung makan",
  "jaminan": "BPKB Motor Honda Vario 2020"
}
```

### POST /api/pinjaman/:id/bayar (Pembayaran Angsuran)
**Request Body:**
```json
{
  "jadwal_id": "uuid-jadwal",
  "total_bayar": 950000,
  "metode_bayar": "TUNAI",
  "keterangan": "Pembayaran angsuran ke-3"
}
```

### GET /api/pinjaman/:id/simulasi (Simulasi Angsuran — Server Action)
**Query Params:**
```
jumlah=10000000&tenor=12&produk_id=uuid
```
**Response:**
```json
{
  "success": true,
  "data": {
    "jumlah_pinjaman": 10000000,
    "bunga_pct": 12,
    "metode_bunga": "FLAT",
    "tenor_bulan": 12,
    "angsuran_pokok": 833333,
    "angsuran_bunga": 100000,
    "total_angsuran": 933333,
    "total_bayar": 11200000,
    "total_bunga": 1200000,
    "jadwal": [
      { "ke": 1, "tgl_jatuh_tempo": "2024-02-15", "pokok": 833333, "bunga": 100000, "total": 933333, "saldo_akhir": 9166667 }
    ]
  }
}
```

---

## 6. Keuangan & Akuntansi Endpoints

```
GET    /api/coa                   → List Chart of Accounts
POST   /api/coa                   → Tambah akun baru
GET    /api/coa/:id               → Detail akun
PUT    /api/coa/:id               → Update akun

GET    /api/jurnal                → List jurnal umum
POST   /api/jurnal                → Buat jurnal manual
GET    /api/jurnal/:id            → Detail jurnal + entries
POST   /api/jurnal/:id/posting    → Posting jurnal

GET    /api/kas-bank              → List kas & rekening bank
POST   /api/kas-bank              → Tambah kas/rekening bank
GET    /api/kas-bank/:id/mutasi   → Mutasi kas/bank
```

---

## 7. Laporan Endpoints

```
GET    /api/laporan/dashboard            → Ringkasan eksekutif (KPI)
GET    /api/laporan/neraca               → Neraca (Balance Sheet)
GET    /api/laporan/laba-rugi            → Laporan Laba Rugi / SHU
GET    /api/laporan/arus-kas             → Laporan Arus Kas
GET    /api/laporan/buku-besar           → Buku Besar per akun
GET    /api/laporan/simpanan             → Laporan simpanan per produk/anggota
GET    /api/laporan/pinjaman-outstanding → Outstanding pinjaman
GET    /api/laporan/kolektibilitas       → Portofolio per kolektibilitas
GET    /api/laporan/shu                  → Perhitungan SHU per anggota

POST   /api/laporan/export               → Export laporan ke PDF/Excel
```

**Query Params Laporan:**
| Param | Keterangan |
|-------|------------|
| `periode_dari` | Tanggal awal (YYYY-MM-DD) |
| `periode_sampai` | Tanggal akhir (YYYY-MM-DD) |
| `format` | `json`, `pdf`, `xlsx`, `csv` |

---

## 8. Administrasi Endpoints

```
GET    /api/users                 → List pengguna sistem
POST   /api/users                 → Tambah pengguna
GET    /api/users/:id             → Detail pengguna
PUT    /api/users/:id             → Update pengguna
DELETE /api/users/:id             → Nonaktifkan pengguna

GET    /api/roles                 → List role
POST   /api/roles                 → Buat role baru
PUT    /api/roles/:id/permissions → Update permissions role

GET    /api/audit-log             → Log aktivitas sistem
GET    /api/koperasi/settings     → Pengaturan koperasi
PUT    /api/koperasi/settings     → Update pengaturan
```

---

## 9. Webhook Endpoints (Payment Gateway)

```
POST   /api/webhooks/xendit/invoice   → Callback invoice Xendit
POST   /api/webhooks/xendit/va        → Callback Virtual Account Xendit
```

> ⚠️ **PENTING:** Semua webhook WAJIB memvalidasi `X-CALLBACK-TOKEN` dari Xendit sebelum memproses data. Log semua callback masuk termasuk yang gagal validasi.

---

## 10. AI Agent Endpoint

```
POST   /api/chat        → Stream percakapan dengan AI Agent koperasi
```

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Berapa total pinjaman outstanding bulan ini?" }
  ]
}
```

**AI Tools yang Tersedia:**
- `getOutstandingLoan` — Ambil total pinjaman outstanding
- `getMemberInfo` — Cari data anggota
- `getLoanStatus` — Cek status pinjaman
- `getCollectibilityReport` — Laporan kolektibilitas
- `calculateLoanSimulation` — Simulasi pinjaman
