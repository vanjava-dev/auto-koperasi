# 🗄️ Database Schema Design
# Core Koperasi — Entity Relationship & Data Model

**Versi:** 1.0.0  
**Database:** PostgreSQL  
**ORM:** Prisma  

---

## 1. Prinsip Desain Database

- **Multi-tenant:** Setiap tabel utama memiliki kolom `koperasi_id` untuk isolasi data antar koperasi
- **Soft Delete:** Gunakan kolom `deleted_at` (timestamp) untuk semua entitas penting, jangan `DELETE` fisik
- **Audit Trail:** Kolom `created_by`, `updated_by` di setiap tabel transaksi
- **UUID:** Gunakan UUID v4 sebagai primary key untuk semua tabel (mencegah enumeration attack)
- **Timestamps:** Semua tabel memiliki `created_at` dan `updated_at`

---

## 2. Entity Relationship Diagram (Konseptual)

```
KOPERASI (1) ──── (N) ANGGOTA
ANGGOTA  (1) ──── (N) REKENING_SIMPANAN
ANGGOTA  (1) ──── (N) PINJAMAN
PINJAMAN (1) ──── (N) ANGSURAN_JADWAL
ANGSURAN_JADWAL (1) ── (N) PEMBAYARAN_ANGSURAN
REKENING_SIMPANAN (1) ── (N) MUTASI_SIMPANAN
TRANSAKSI (N) ──── (N) JURNAL_ENTRY
JURNAL   (1) ──── (N) JURNAL_ENTRY
COA      (1) ──── (N) JURNAL_ENTRY
USER     (N) ──── (N) ROLE  (via USER_ROLE)
```

---

## 3. Skema Tabel Lengkap (Prisma Schema)

### 3.1 Entitas Sistem & Administrasi

```prisma
// ─── KOPERASI (Tenant utama) ─────────────────────────────────────────────
model Koperasi {
  id              String    @id @default(uuid())
  kode            String    @unique @db.VarChar(20)    // Kode unik koperasi
  nama            String    @db.VarChar(200)
  no_badan_hukum  String?   @db.VarChar(100)
  alamat          String?   @db.Text
  kota            String?   @db.VarChar(100)
  provinsi        String?   @db.VarChar(100)
  telepon         String?   @db.VarChar(20)
  email           String?   @db.VarChar(100)
  website         String?   @db.VarChar(200)
  logo_url        String?
  jenis           KoperasiJenis  @default(SIMPAN_PINJAM)
  status          StatusAktif    @default(AKTIF)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  anggota         Anggota[]
  users           User[]
  coa             ChartOfAccount[]
  kas_bank        KasBank[]
}

enum KoperasiJenis {
  SIMPAN_PINJAM
  KONSUMEN
  PRODUSEN
  JASA
  SERBA_USAHA
}

// ─── USER & RBAC ────────────────────────────────────────────────────────
model User {
  id              String    @id @default(uuid())
  koperasi_id     String
  nama            String    @db.VarChar(100)
  email           String    @db.VarChar(100)
  password_hash   String
  avatar_url      String?
  last_login_at   DateTime?
  status          StatusAktif @default(AKTIF)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  koperasi        Koperasi  @relation(fields: [koperasi_id], references: [id])
  user_roles      UserRole[]
  audit_logs      AuditLog[]

  @@unique([koperasi_id, email])
}

model Role {
  id              String    @id @default(uuid())
  nama            String    @db.VarChar(50)  // ADMIN, MANAGER, TELLER, ANGGOTA, AUDITOR
  deskripsi       String?
  permissions     Json      // {"modul": ["create","read","update","delete"]}
  created_at      DateTime  @default(now())

  user_roles      UserRole[]
}

model UserRole {
  id              String    @id @default(uuid())
  user_id         String
  role_id         String
  assigned_at     DateTime  @default(now())

  user            User      @relation(fields: [user_id], references: [id])
  role            Role      @relation(fields: [role_id], references: [id])

  @@unique([user_id, role_id])
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────
model AuditLog {
  id              String    @id @default(uuid())
  koperasi_id     String
  user_id         String
  aksi            String    @db.VarChar(50)   // CREATE, UPDATE, DELETE, LOGIN, dll
  modul           String    @db.VarChar(50)   // ANGGOTA, PINJAMAN, SIMPANAN, dll
  referensi_id    String?                     // ID entitas yang diubah
  data_lama       Json?
  data_baru       Json?
  ip_address      String?   @db.VarChar(45)
  user_agent      String?
  created_at      DateTime  @default(now())

  user            User      @relation(fields: [user_id], references: [id])
}
```

### 3.2 Modul Keanggotaan

```prisma
// ─── ANGGOTA ──────────────────────────────────────────────────────────────
model Anggota {
  id              String    @id @default(uuid())
  koperasi_id     String
  no_anggota      String    @db.VarChar(20)  // Auto-generate: KOP-2024-0001
  nik             String    @db.VarChar(16)
  nama_lengkap    String    @db.VarChar(200)
  tempat_lahir    String?   @db.VarChar(100)
  tanggal_lahir   DateTime?
  jenis_kelamin   JenisKelamin
  agama           String?   @db.VarChar(20)
  pendidikan      String?   @db.VarChar(50)
  pekerjaan       String?   @db.VarChar(100)
  penghasilan     Decimal?  @db.Decimal(15,2)
  alamat_ktp      String?   @db.Text
  alamat_domisili String?   @db.Text
  kota            String?   @db.VarChar(100)
  provinsi        String?   @db.VarChar(100)
  kode_pos        String?   @db.VarChar(10)
  telepon         String?   @db.VarChar(20)
  email           String?   @db.VarChar(100)
  no_rek_bank     String?   @db.VarChar(30)  // Untuk pencairan pinjaman
  nama_bank       String?   @db.VarChar(50)
  foto_url        String?
  ktp_url         String?
  tgl_bergabung   DateTime  @default(now())
  tgl_keluar      DateTime?
  status          StatusAnggota @default(CALON)
  disetujui_oleh  String?
  disetujui_tgl   DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  koperasi        Koperasi  @relation(fields: [koperasi_id], references: [id])
  simpanan        RekeningSimpanan[]
  pinjaman        Pinjaman[]

  @@unique([koperasi_id, no_anggota])
  @@unique([koperasi_id, nik])
}

enum StatusAnggota {
  CALON         // Baru mendaftar, belum diverifikasi
  AKTIF         // Anggota aktif
  TIDAK_AKTIF   // Sudah tidak aktif
  KELUAR        // Telah resmi keluar
  MENINGGAL
}

enum JenisKelamin {
  LAKI_LAKI
  PEREMPUAN
}
```

### 3.3 Modul Simpanan

```prisma
// ─── PRODUK SIMPANAN ───────────────────────────────────────────────────────
model ProdukSimpanan {
  id              String    @id @default(uuid())
  koperasi_id     String
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(100)
  jenis           JenisSimpanan
  bunga_pct       Decimal   @db.Decimal(5,2)   // % per tahun
  min_setoran     Decimal   @db.Decimal(15,2)  @default(0)
  min_saldo       Decimal   @db.Decimal(15,2)  @default(0)
  maks_tarik      Decimal?  @db.Decimal(15,2)  // null = tidak terbatas
  tenor_bulan     Int?      // Untuk deposito
  keterangan      String?   @db.Text
  status          StatusAktif @default(AKTIF)
  coa_id          String?   // Linked to Chart of Accounts for Auto-Journaling
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  rekening        RekeningSimpanan[]
}

enum JenisSimpanan {
  POKOK
  WAJIB
  SUKARELA
  DEPOSITO
  KHUSUS
}

// ─── REKENING SIMPANAN (per-anggota) ──────────────────────────────────────
model RekeningSimpanan {
  id              String    @id @default(uuid())
  koperasi_id     String
  anggota_id      String
  produk_id       String
  no_rekening     String    @db.VarChar(20)
  saldo           Decimal   @db.Decimal(15,2) @default(0)
  tgl_buka        DateTime  @default(now())
  tgl_tutup       DateTime?
  tgl_jatuh_tempo DateTime? // Untuk deposito
  status          StatusRekening @default(AKTIF)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  anggota         Anggota   @relation(fields: [anggota_id], references: [id])
  produk          ProdukSimpanan @relation(fields: [produk_id], references: [id])
  mutasi          MutasiSimpanan[]

  @@unique([koperasi_id, no_rekening])
}

enum StatusRekening { AKTIF TUTUP DORMANT }

// ─── MUTASI SIMPANAN ──────────────────────────────────────────────────────
model MutasiSimpanan {
  id              String    @id @default(uuid())
  rekening_id     String
  tanggal         DateTime
  jenis           JenisMutasi
  jumlah          Decimal   @db.Decimal(15,2)
  saldo_sebelum   Decimal   @db.Decimal(15,2)
  saldo_sesudah   Decimal   @db.Decimal(15,2)
  keterangan      String?   @db.VarChar(500)
  referensi_id    String?   // Linked ke transaksi / pembayaran angsuran
  dibuat_oleh     String
  created_at      DateTime  @default(now())

  rekening        RekeningSimpanan @relation(fields: [rekening_id], references: [id])
}

enum JenisMutasi { KREDIT DEBIT }
```

### 3.4 Modul Pinjaman

```prisma
// ─── PRODUK PINJAMAN ──────────────────────────────────────────────────────
model ProdukPinjaman {
  id              String    @id @default(uuid())
  koperasi_id     String
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(100)
  jenis           JenisPinjaman
  bunga_pct       Decimal   @db.Decimal(5,2)
  metode_bunga    MetodeBunga @default(FLAT)
  maks_pinjaman   Decimal   @db.Decimal(15,2)
  min_pinjaman    Decimal   @db.Decimal(15,2)
  maks_tenor_bln  Int
  min_tenor_bln   Int       @default(1)
  provisi_pct     Decimal   @db.Decimal(5,2) @default(0)
  administrasi    Decimal   @db.Decimal(15,2) @default(0)
  denda_hari_pct  Decimal   @db.Decimal(8,5) @default(0) // Denda per hari keterlambatan
  keterangan      String?   @db.Text
  status          StatusAktif @default(AKTIF)
  coa_id          String?   // Linked to Chart of Accounts for Auto-Journaling
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  pinjaman        Pinjaman[]
}

enum JenisPinjaman { UMUM USAHA DARURAT PERUMAHAN PENDIDIKAN }
enum MetodeBunga  { FLAT EFEKTIF ANUITAS }

// ─── PINJAMAN ─────────────────────────────────────────────────────────────
model Pinjaman {
  id              String    @id @default(uuid())
  koperasi_id     String
  anggota_id      String
  produk_id       String
  no_pinjaman     String    @db.VarChar(25)   // Auto: PIN-2024-00001
  tgl_pengajuan   DateTime  @default(now())
  tgl_disetujui   DateTime?
  tgl_cair        DateTime?
  tgl_lunas       DateTime?
  jumlah_pinjaman Decimal   @db.Decimal(15,2)
  jumlah_cair     Decimal?  @db.Decimal(15,2) // Setelah potong biaya
  tenor_bulan     Int
  bunga_pct       Decimal   @db.Decimal(5,2)
  metode_bunga    MetodeBunga
  total_bunga     Decimal   @db.Decimal(15,2) @default(0)
  total_kewajiban Decimal   @db.Decimal(15,2) @default(0)
  angsuran_pokok  Decimal   @db.Decimal(15,2) @default(0)
  angsuran_bunga  Decimal   @db.Decimal(15,2) @default(0)
  saldo_pokok     Decimal   @db.Decimal(15,2) @default(0) // Outstanding
  tujuan          String?   @db.Text
  jaminan         String?   @db.Text
  kolektibilitas  Kolektibilitas @default(LANCAR)
  status          StatusPinjaman @default(PENGAJUAN)
  disetujui_oleh  String?
  dicairkan_oleh  String?
  catatan         String?   @db.Text
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  anggota         Anggota   @relation(fields: [anggota_id], references: [id])
  produk          ProdukPinjaman @relation(fields: [produk_id], references: [id])
  jadwal          JadwalAngsuran[]
  dokumen         DokumenPinjaman[]

  @@unique([koperasi_id, no_pinjaman])
}

enum StatusPinjaman {
  PENGAJUAN
  ANALISIS
  DISETUJUI
  DITOLAK
  CAIR
  LUNAS
  MACET
}

enum Kolektibilitas {
  LANCAR          // 0 hari terlambat
  DPK             // 1-90 hari (Dalam Perhatian Khusus)
  KURANG_LANCAR   // 91-120 hari
  DIRAGUKAN       // 121-180 hari
  MACET           // > 180 hari
}

// ─── JADWAL ANGSURAN ──────────────────────────────────────────────────────
model JadwalAngsuran {
  id              String    @id @default(uuid())
  pinjaman_id     String
  ke              Int       // Angsuran ke-1, ke-2, dst
  tgl_jatuh_tempo DateTime
  tgl_bayar       DateTime?
  pokok           Decimal   @db.Decimal(15,2)
  bunga           Decimal   @db.Decimal(15,2)
  total           Decimal   @db.Decimal(15,2)
  saldo_akhir     Decimal   @db.Decimal(15,2)  // Sisa pokok setelah angsuran ini
  denda           Decimal   @db.Decimal(15,2)  @default(0)
  status          StatusAngsuran @default(BELUM_BAYAR)

  pinjaman        Pinjaman  @relation(fields: [pinjaman_id], references: [id])
  pembayaran      PembayaranAngsuran[]
}

enum StatusAngsuran { BELUM_BAYAR SEBAGIAN LUNAS LEWAT_JATUH_TEMPO }

// ─── PEMBAYARAN ANGSURAN ──────────────────────────────────────────────────
model PembayaranAngsuran {
  id              String    @id @default(uuid())
  jadwal_id       String
  tanggal         DateTime  @default(now())
  pokok_bayar     Decimal   @db.Decimal(15,2)
  bunga_bayar     Decimal   @db.Decimal(15,2)
  denda_bayar     Decimal   @db.Decimal(15,2) @default(0)
  total_bayar     Decimal   @db.Decimal(15,2)
  metode_bayar    MetodePembayaran
  referensi_ext   String?   @db.VarChar(100)  // No. referensi payment gateway
  kasir_id        String
  keterangan      String?
  created_at      DateTime  @default(now())

  jadwal          JadwalAngsuran @relation(fields: [jadwal_id], references: [id])
}

enum MetodePembayaran { TUNAI TRANSFER VIRTUAL_ACCOUNT QRIS AUTO_DEBIT }
```

### 3.5 Modul Akuntansi

```prisma
// ─── CHART OF ACCOUNTS ────────────────────────────────────────────────────
model ChartOfAccount {
  id              String    @id @default(uuid())
  koperasi_id     String
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(200)
  jenis           JenisAkun
  kelompok        String?   @db.VarChar(100)
  parent_id       String?
  level           Int       @default(1)
  posisi_normal   PosisiNormal  // DEBIT atau KREDIT
  bisa_diposting  Boolean   @default(true)  // False jika akun induk
  status          StatusAktif @default(AKTIF)
  created_at      DateTime  @default(now())

  koperasi        Koperasi  @relation(fields: [koperasi_id], references: [id])
  parent          ChartOfAccount? @relation("CoaHierarki", fields: [parent_id], references: [id])
  children        ChartOfAccount[] @relation("CoaHierarki")
  jurnal_entry    JurnalEntry[]

  @@unique([koperasi_id, kode])
}

enum JenisAkun {
  ASET
  KEWAJIBAN
  EKUITAS
  PENDAPATAN
  BEBAN
}

enum PosisiNormal { DEBIT KREDIT }

// ─── JURNAL ───────────────────────────────────────────────────────────────
model Jurnal {
  id              String    @id @default(uuid())
  koperasi_id     String
  no_jurnal       String    @db.VarChar(25)
  tanggal         DateTime
  keterangan      String    @db.VarChar(500)
  referensi       String?   @db.VarChar(100)  // No. transaksi asal
  modul_asal      String?   @db.VarChar(50)   // SIMPANAN, PINJAMAN, KAS, dll
  dibuat_oleh     String
  diposting       Boolean   @default(false)
  diposting_oleh  String?
  diposting_tgl   DateTime?
  created_at      DateTime  @default(now())

  entries         JurnalEntry[]

  @@unique([koperasi_id, no_jurnal])
}

model JurnalEntry {
  id              String    @id @default(uuid())
  jurnal_id       String
  coa_id          String
  posisi          PosisiNormal
  jumlah          Decimal   @db.Decimal(15,2)
  keterangan      String?   @db.VarChar(300)

  jurnal          Jurnal    @relation(fields: [jurnal_id], references: [id])
  coa             ChartOfAccount @relation(fields: [coa_id], references: [id])
}

// ─── KAS & BANK ───────────────────────────────────────────────────────────
model KasBank {
  id              String    @id @default(uuid())
  koperasi_id     String
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(100)   // Kas Utama, BRI 1234, dll
  jenis           JenisKasBank
  no_rekening     String?   @db.VarChar(30)
  nama_bank       String?   @db.VarChar(50)
  coa_id          String?
  saldo_awal      Decimal   @db.Decimal(15,2) @default(0)
  saldo           Decimal   @db.Decimal(15,2) @default(0)
  status          StatusAktif @default(AKTIF)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  koperasi        Koperasi  @relation(fields: [koperasi_id], references: [id])
}

enum JenisKasBank { KAS BANK }
```

---

## 4. Enum Global

```prisma
enum StatusAktif { AKTIF TIDAK_AKTIF }
```

---

## 5. Indeks Database (Rekomendasi)

```sql
-- Optimasi query yang sering digunakan
CREATE INDEX idx_anggota_koperasi   ON anggota(koperasi_id, status);
CREATE INDEX idx_anggota_nik        ON anggota(koperasi_id, nik);
CREATE INDEX idx_pinjaman_anggota   ON pinjaman(anggota_id, status);
CREATE INDEX idx_pinjaman_status    ON pinjaman(koperasi_id, status, kolektibilitas);
CREATE INDEX idx_jadwal_jatuh_tempo ON jadwal_angsuran(tgl_jatuh_tempo, status);
CREATE INDEX idx_mutasi_rekening    ON mutasi_simpanan(rekening_id, tanggal);
CREATE INDEX idx_jurnal_tanggal     ON jurnal(koperasi_id, tanggal);
CREATE INDEX idx_audit_log          ON audit_log(koperasi_id, user_id, created_at);
```

---

## 6. Strategi Migrasi Database

1. **Fase 1** – Tabel inti: `koperasi`, `user`, `role`, `anggota`
2. **Fase 2** – Simpanan: `produk_simpanan`, `rekening_simpanan`, `mutasi_simpanan`
3. **Fase 3** – Pinjaman: `produk_pinjaman`, `pinjaman`, `jadwal_angsuran`, `pembayaran_angsuran`
4. **Fase 4** – Akuntansi: `chart_of_account`, `jurnal`, `jurnal_entry`, `kas_bank`
5. **Fase 5** – Seeder: Data awal COA standar koperasi, role default, produk simpanan dasar
