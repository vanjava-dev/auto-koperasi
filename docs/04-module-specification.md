# 🗺️ Module Specification
# Core Koperasi — Spesifikasi Detail Per Modul

---

## MODUL 1: Keanggotaan (Member Management)

### Alur Proses Pendaftaran Anggota

```
[Calon Anggota] → Isi Form → [Staff Input Data] → Simpan sbg "CALON"
     ↓
[Manager/Pengurus] → Review data → Verifikasi dokumen
     ↓
[Disetujui?]
  → YA  → Status: AKTIF → Buka Rekening Simpanan Pokok + Wajib → Notifikasi
  → TIDAK → Status: DITOLAK → Notifikasi + Alasan penolakan
```

### Aturan Bisnis (Business Rules)
- Setiap anggota harus memiliki **NIK unik** per koperasi
- Nomor anggota di-generate otomatis: `{KODE_KOPERASI}-{TAHUN}-{URUTAN_4_DIGIT}` (contoh: `KSP-2024-0001`)
- Anggota baru **WAJIB** langsung memiliki rekening Simpanan Pokok dan Simpanan Wajib saat diaktivasi
- Anggota dengan pinjaman aktif **TIDAK BISA** langsung dinonaktifkan

### Validasi Form Anggota
| Field | Aturan |
|-------|--------|
| NIK | 16 digit, unique per koperasi |
| Nama Lengkap | Min 3 karakter, max 200 karakter |
| Tanggal Lahir | Usia minimal 17 tahun |
| Telepon | Format Indonesia (08xx, 62xx) |
| Email | Format email valid (opsional) |
| Foto | JPEG/PNG, max 2MB |
| KTP | JPEG/PNG/PDF, max 5MB |

---

## MODUL 2: Simpanan (Savings)

### Jenis Simpanan & Karakteristik

| Jenis | Setor | Tarik | Bunga | Keterangan |
|-------|-------|-------|-------|------------|
| **Pokok** | Sekali saat daftar | Saat keluar | Tidak | Jumlah tetap per anggota |
| **Wajib** | Rutin per bulan | Saat keluar | Tidak | Jumlah ditentukan koperasi |
| **Sukarela** | Kapan saja | Kapan saja | Ya | Fleksibel, seperti tabungan biasa |
| **Deposito** | Sekali | Saat jatuh tempo | Ya | Bunga lebih tinggi, tenor tetap |

### Alur Transaksi Simpanan

**Setoran:**
```
Input Jumlah → Pilih Metode Bayar → Konfirmasi → 
Update Saldo Rekening → Catat Mutasi → Generate Jurnal Otomatis → Cetak Bukti
```

**Penarikan:**
```
Verifikasi Identitas Anggota → Input Jumlah → 
Cek Saldo Mencukupi (min_saldo) → Konfirmasi → 
Update Saldo → Catat Mutasi → Generate Jurnal → Cetak Bukti
```

### Aturan Bisnis Simpanan
- Simpanan Pokok dan Wajib TIDAK bisa ditarik selama masih menjadi anggota aktif
- Saldo Simpanan Sukarela tidak boleh kurang dari `min_saldo` produk yang ditentukan
- Bunga simpanan dihitung dan dikreditkan per akhir bulan/kuartal/tahun (sesuai pengaturan produk)
- Rekening berstatus `DORMANT` jika tidak ada transaksi selama > 12 bulan

### Perhitungan Bunga Simpanan
```
Bunga = Saldo Rata-rata × (Bunga % per tahun / 12)

Saldo Rata-rata = Jumlah(Saldo Harian) / Jumlah Hari Dalam Bulan
```

---

## MODUL 3: Pinjaman (Loan Management)

### Alur Pengajuan Pinjaman (Loan Lifecycle)

```
PENGAJUAN → ANALISIS → [DISETUJUI / DITOLAK] → CAIR → [AKTIF] → LUNAS
                                                              ↓
                                                           MACET
```

**Detail setiap tahap:**

| Tahap | Aktor | Aksi |
|-------|-------|------|
| **PENGAJUAN** | Anggota/Staff | Input data pinjaman, upload dokumen |
| **ANALISIS** | Analis Kredit | Review kemampuan bayar, scoring, cek riwayat |
| **DISETUJUI** | Manager | Tanda tangan persetujuan, tetapkan syarat |
| **DITOLAK** | Manager | Catat alasan penolakan, notifikasi anggota |
| **CAIR** | Kasir/Teller | Proses pencairan (tunai/transfer), potong biaya admin/provisi |
| **AKTIF** | Sistem | Monitor pembayaran angsuran |
| **LUNAS** | Sistem/Kasir | Tandai lunas saat semua angsuran terbayar |
| **MACET** | Manager | Klasifikasikan setelah > 180 hari keterlambatan |

### Metode Perhitungan Angsuran

#### A. Metode FLAT
```
Angsuran Pokok  = Jumlah Pinjaman / Tenor
Angsuran Bunga  = Jumlah Pinjaman × (Bunga%/12)
Total Angsuran  = Angsuran Pokok + Angsuran Bunga  ← TETAP setiap bulan
```

#### B. Metode EFEKTIF (Declining Balance)
```
Angsuran Pokok  = Jumlah Pinjaman / Tenor            ← TETAP
Angsuran Bunga  = Saldo Pokok × (Bunga%/12)          ← MENURUN setiap bulan
Total Angsuran  = Angsuran Pokok + Angsuran Bunga    ← MENURUN
```

#### C. Metode ANUITAS
```
Angsuran = P × [i(1+i)^n] / [(1+i)^n - 1]
  P = Pokok pinjaman
  i = Bunga per bulan (%)
  n = Tenor (bulan)
Total Angsuran TETAP, komposisi pokok meningkat, bunga menurun
```

### Perhitungan Denda Keterlambatan
```
Denda = Sisa Angsuran Tertunggak × Denda%/Hari × Jumlah Hari Keterlambatan

Contoh: Rp 1.000.000 × 0.1% × 5 hari = Rp 5.000
```

### Kolektibilitas Pinjaman (Sesuai OJK)
| Kelas | Keterlambatan | Perlakuan |
|-------|--------------|-----------|
| **LANCAR** | 0 hari | Normal |
| **DPK** | 1 – 90 hari | Dalam Perhatian Khusus |
| **KURANG LANCAR** | 91 – 120 hari | Perlu restrukturisasi |
| **DIRAGUKAN** | 121 – 180 hari | Intensif penagihan |
| **MACET** | > 180 hari | Penghapusbukuan / lelang jaminan |

### Aturan Bisnis Pinjaman
- Anggota dengan status bukan `AKTIF` tidak bisa mengajukan pinjaman
- Anggota dengan pinjaman `MACET` tidak bisa mengajukan pinjaman baru
- Maksimal pinjaman aktif: **2 pinjaman** per anggota (konfigurabel)
- Pelunasan dipercepat: sisa pokok + bunga berjalan + denda (jika ada), **tanpa penalti tambahan** (konfigurabel)
- Kolektibilitas otomatis diperbarui oleh sistem setiap tengah malam (Cron Job)

---

## MODUL 4: Akuntansi (Accounting)

### Chart of Accounts (CoA) Standar Koperasi

```
1. ASET
   1.1 Aset Lancar
       1.1.1 Kas
       1.1.2 Bank
       1.1.3 Piutang Anggota (Outstanding Pinjaman)
       1.1.4 Piutang Bunga
       1.1.5 Piutang Denda
   1.2 Aset Tidak Lancar
       1.2.1 Aset Tetap
       1.2.2 Akumulasi Penyusutan

2. KEWAJIBAN
   2.1 Kewajiban Jangka Pendek
       2.1.1 Simpanan Anggota (Sukarela)
       2.1.2 Simpanan Berjangka (Deposito)
       2.1.3 Utang Bunga Simpanan
   2.2 Kewajiban Jangka Panjang
       2.2.1 Modal Pinjaman Luar

3. EKUITAS
   3.1 Simpanan Pokok
   3.2 Simpanan Wajib
   3.3 Cadangan Koperasi
   3.4 SHU Belum Dibagi

4. PENDAPATAN
   4.1 Pendapatan Bunga Pinjaman
   4.2 Pendapatan Administrasi
   4.3 Pendapatan Provisi
   4.4 Pendapatan Denda

5. BEBAN
   5.1 Beban Bunga Simpanan
   5.2 Beban Operasional
   5.3 Beban Gaji
   5.4 Beban Penyusutan
```

### Jurnal Otomatis per Transaksi

**Setoran Simpanan Sukarela (Tunai):**
```
DEBIT  1.1.1 Kas                    Rp 500.000
KREDIT 2.1.1 Simpanan Sukarela      Rp 500.000
```

**Pencairan Pinjaman:**
```
DEBIT  1.1.3 Piutang Anggota        Rp 10.000.000
KREDIT 1.1.1 Kas                    Rp 9.800.000   (setelah potong biaya)
KREDIT 4.2   Pendapatan Administrasi Rp   200.000
```

**Pembayaran Angsuran:**
```
DEBIT  1.1.1 Kas                    Rp 933.333
KREDIT 1.1.3 Piutang Anggota        Rp 833.333   (pokok)
KREDIT 4.1   Pendapatan Bunga       Rp 100.000   (bunga)
```

**Bunga Simpanan (Beban):**
```
DEBIT  5.1   Beban Bunga Simpanan   Rp 25.000
KREDIT 2.1.3 Utang Bunga Simpanan   Rp 25.000
```

### Aturan Jurnal
- Setiap transaksi HARUS menghasilkan jurnal double-entry yang seimbang (Debit = Kredit)
- Jurnal otomatis tidak memerlukan approval, jurnal manual WAJIB di-review dan di-posting oleh Manager/Bendahara
- Jurnal yang sudah diposting TIDAK BISA dihapus, hanya bisa dibalik (Reverse Entry)

---

## MODUL 5: Laporan & Analitik

### Dashboard KPI Utama
| Metrik | Formula | Periode |
|--------|---------|---------|
| Total Anggota Aktif | COUNT(anggota WHERE status=AKTIF) | Real-time |
| Anggota Baru | COUNT(anggota WHERE tgl_bergabung bulan ini) | Bulanan |
| Total Outstanding Pinjaman | SUM(pinjaman.saldo_pokok WHERE status=CAIR) | Real-time |
| Total Simpanan | SUM(rekening_simpanan.saldo) | Real-time |
| Rasio NPL | SUM(saldo_pokok WHERE kolektibilitas IN [MACET]) / Total Outstanding × 100% | Real-time |
| Pendapatan Bunga Bulan Ini | SUM(jurnal_entry WHERE coa=BUNGA_PINJAMAN bulan ini) | Bulanan |
| Pinjaman Jatuh Tempo Minggu Ini | COUNT(jadwal_angsuran WHERE tgl_jatuh_tempo 7 hari ke depan) | Mingguan |

### Laporan SHU (Sisa Hasil Usaha)
```
SHU = Total Pendapatan - Total Beban

Distribusi SHU:
  - Dana Cadangan          : 25% dari SHU
  - SHU untuk Anggota      : 40% dari SHU (dibagi berdasarkan partisipasi)
  - Dana Pengurus          : 10% dari SHU
  - Dana Pendidikan        : 10% dari SHU
  - Dana Sosial            : 5%  dari SHU
  - Dana Pembangunan Daerah: 10% dari SHU

Partisipasi Anggota (untuk pembagian SHU):
  - Berdasarkan jumlah simpanan wajib
  - Berdasarkan volume pinjaman yang pernah diambil
```

---

## MODUL 6: Notifikasi

### Trigger Notifikasi Otomatis
| Event | Penerima | Channel | Waktu |
|-------|----------|---------|-------|
| Anggota baru mendaftar | Manager | Email | Saat daftar |
| Anggota diaktivasi | Anggota | Email + WA | Saat aktivasi |
| Pengajuan pinjaman masuk | Manager | Email | Saat submit |
| Pinjaman disetujui/ditolak | Anggota | Email + WA | Saat keputusan |
| H-7 jatuh tempo angsuran | Anggota | WA | 7 hari sebelum |
| H-1 jatuh tempo angsuran | Anggota | WA | 1 hari sebelum |
| Angsuran terlambat | Anggota + Teller | Email + WA | H+1 setelah jatuh tempo |
| Angsuran diterima | Anggota | WA | Saat pembayaran |
| Simpanan berhasil | Anggota | WA | Saat transaksi |

---

## MODUL 7: AI Agent (Asisten Koperasi)

### Kapabilitas AI Agent
AI Agent terintegrasi yang dapat menjawab pertanyaan dan menjalankan analisis data koperasi.

**Contoh Pertanyaan:**
- "Tampilkan anggota dengan NPL tertinggi bulan ini"
- "Berapa total outstanding pinjaman per kolektibilitas?"
- "Siapa saja anggota yang belum bayar angsuran minggu lalu?"
- "Hitung simulasi pinjaman Rp 15 juta tenor 24 bulan metode flat"
- "Tampilkan pertumbuhan anggota 6 bulan terakhir"

### Batasan AI Agent
- Tidak bisa melakukan mutasi/transaksi secara langsung
- Hanya akses data koperasi yang sedang login
- Setiap query data harus melalui tools yang tervalidasi
- Audit log dicatat untuk setiap sesi percakapan AI
