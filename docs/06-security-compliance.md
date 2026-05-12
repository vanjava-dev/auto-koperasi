# 🔐 Security & Compliance Guide
# Core Koperasi — Panduan Keamanan & Kepatuhan

---

## 1. Prinsip Keamanan Dasar

### 1.1 Authentication & Session
- Gunakan **JWT** (access token 1 jam, refresh token 7 hari)
- Simpan refresh token di **HttpOnly Cookie** (bukan localStorage)
- Session timeout otomatis setelah 30 menit inaktif
- Multi-device session management (bisa lihat & paksa logout sesi lain)
- Implementasi **rate limiting** pada endpoint login: maks 5 percobaan gagal → lock 15 menit

### 1.2 Authorization (RBAC)
Setiap endpoint dan Server Action WAJIB memvalidasi izin berdasarkan role:

```typescript
// Contoh guard middleware
export async function checkPermission(
  user: User,
  modul: string,
  aksi: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  const permissions = user.roles.flatMap(r => r.permissions[modul] ?? []);
  return permissions.includes(aksi);
}
```

**Matriks Izin Default:**

| Modul | Admin | Manager | Teller | Auditor | Anggota |
|-------|-------|---------|--------|---------|---------|
| Keanggotaan | CRUD | CRUD | R | R | R (sendiri) |
| Simpanan | CRUD | CRUD | CR | R | R (sendiri) |
| Pinjaman | CRUD | CRUD | CR | R | R (sendiri) |
| Akuntansi | CRUD | RU | — | R | — |
| Laporan | CRUD | R | — | R | — |
| Pengguna | CRUD | R | — | — | — |
| Pengaturan | CRUD | R | — | — | — |

*C=Create, R=Read, U=Update, D=Delete*

---

## 2. Keamanan Data

### 2.1 Enkripsi
- **Data at rest:** Database di-encrypt (PostgreSQL Transparent Data Encryption)
- **Data in transit:** HTTPS wajib (TLS 1.2+), redirect HTTP → HTTPS
- **Password:** Hash menggunakan **bcrypt** (cost factor 12)
- **Data sensitif:** NIK, No. HP di-mask pada tampilan (kecuali yang berwenang)

### 2.2 Validasi Input
- Semua input WAJIB divalidasi menggunakan **Zod** di Server Actions
- Sanitasi HTML input untuk mencegah XSS
- Parameterized query via Prisma (bukan raw SQL dengan interpolasi string)

### 2.3 Upload File
- Validasi MIME type di server (bukan hanya extension)
- Scan file dengan antivirus sebelum disimpan (opsional untuk fase awal)
- Batasi ukuran: Foto max 2MB, Dokumen max 10MB
- Simpan di storage eksternal (Supabase/S3), bukan di server aplikasi
- Generate signed URL dengan expiry untuk akses file

---

## 3. Audit & Compliance

### 3.1 Audit Trail
Setiap aksi berikut WAJIB dicatat di `audit_log`:
- Login / Logout / Login gagal
- Create, Update, Delete data anggota
- Semua transaksi simpanan dan pinjaman
- Persetujuan / penolakan pinjaman
- Perubahan data keuangan (jurnal, koreksi)
- Perubahan pengaturan sistem
- Export data / laporan

Format log:
```json
{
  "user_id": "uuid",
  "aksi": "UPDATE",
  "modul": "PINJAMAN",
  "referensi_id": "uuid-pinjaman",
  "data_lama": { "status": "DISETUJUI" },
  "data_baru": { "status": "CAIR" },
  "ip_address": "192.168.1.1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3.2 Retensi Data
- Data transaksi: **minimum 10 tahun** (sesuai regulasi keuangan Indonesia)
- Audit log: **5 tahun**
- Soft delete untuk semua entitas (tidak pernah hapus fisik dari production)
- Backup harian, retensi backup 90 hari

### 3.3 Kepatuhan Regulasi
- Laporan keuangan sesuai **SAK ETAP** (Standar Akuntansi Keuangan Entitas Tanpa Akuntabilitas Publik)
- Klasifikasi kolektibilitas sesuai standar **OJK** (Otoritas Jasa Keuangan)
- Perlindungan data pribadi anggota sesuai **UU PDP** (Perlindungan Data Pribadi) No. 27 Tahun 2022

---

## 4. Keamanan Infrastruktur

### 4.1 Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="minimum-32-karakter-random-string"
JWT_REFRESH_SECRET="minimum-32-karakter-berbeda"

# Xendit
XENDIT_SECRET_KEY="xnd_production_..."
XENDIT_WEBHOOK_TOKEN="..."

# AI
GOOGLE_AI_API_KEY="..."

# Storage
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."  # JANGAN ekspos ke client!

# Notification
WHATSAPP_API_KEY="..."
RESEND_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="https://app.koperasi.id"  # Hanya ini yang boleh NEXT_PUBLIC_
```

### 4.2 Headers Keamanan (Next.js)
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com;"
  }
];
```

---

## 5. Disaster Recovery

### 5.1 Backup Strategy
| Jenis | Frekuensi | Retensi | Lokasi |
|-------|-----------|---------|--------|
| Full backup | Harian (02:00 WIB) | 90 hari | Cloud Storage terenkripsi |
| Incremental | Per 6 jam | 7 hari | Cloud Storage |
| Transaction log | Kontinu | 7 hari | Cloud Storage |

### 5.2 RTO & RPO
- **RPO (Recovery Point Objective):** Maksimal kehilangan data 6 jam
- **RTO (Recovery Time Objective):** Sistem kembali normal dalam 4 jam

### 5.3 Prosedur Restore
1. Notifikasi admin sistem
2. Identifikasi titik restore yang aman
3. Restore database dari backup
4. Verifikasi integritas data
5. Uji transaksi sampel
6. Notifikasi pengguna
