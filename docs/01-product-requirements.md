# 📋 Product Requirements Document (PRD)
# Core Koperasi — Sistem Informasi Manajemen Koperasi

**Versi:** 1.0.0  
**Tanggal:** 2026-05-11  
**Status:** Draft  
**Owner:** Tim Pengembang Koperasi-AI  

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang
Koperasi sebagai lembaga keuangan berbasis anggota membutuhkan sistem manajemen yang terintegrasi dan andal. Saat ini banyak koperasi masih mengandalkan pencatatan manual atau sistem yang tidak terhubung satu sama lain, sehingga menimbulkan inefisiensi operasional, risiko kesalahan data, dan kesulitan dalam pelaporan keuangan.

### 1.2 Tujuan Produk
Membangun **Core Koperasi** — platform manajemen koperasi berbasis web yang terintegrasi, dengan filosofi **Automation-First**: meminimalisir keterlibatan SDM dalam pekerjaan input data rutin, sehingga staf koperasi dapat fokus pada pekerjaan bernilai tinggi (verifikasi, konsultasi anggota, pengambilan keputusan strategis).

**Tiga Pilar Otomasi:**
| Pilar | Strategi | Dampak |
|-------|----------|--------|
| **Event-Driven Transactions** | Transaksi dipicu webhook payment gateway, bukan input kasir | Eliminasi input manual setoran & angsuran |
| **AI Document Processing** | Data KTP/dokumen diekstrak otomatis via OCR + Gemini Vision | Eliminasi input data anggota manual |
| **Intelligent Automation** | Credit scoring, kolektibilitas, jurnal — semua otomatis | Eliminasi pekerjaan kalkulasi & pencatatan manual |

### 1.3 Visi Produk
> *"Menjadi tulang punggung digital bagi koperasi Indonesia — di mana mesin mengerjakan 90% pekerjaan input data, dan manusia fokus pada keputusan yang benar-benar penting."*

---

## 2. Pengguna (User Personas)

### 2.1 Pengurus Koperasi (Admin)
- **Peran:** Ketua, Bendahara, Sekretaris, Manager
- **Kebutuhan:** Dashboard ringkasan, laporan keuangan, persetujuan pengajuan, manajemen anggota
- **Hak Akses:** Full access berdasarkan role

### 2.2 Petugas / Karyawan (Staff/Teller)
- **Peran:** Kasir, Petugas Lapangan, CS
- **Kebutuhan:** Verifikasi hasil OCR, konfirmasi transaksi anomali, input manual sebagai fallback, cetak bukti transaksi
- **Interaksi Utama:** Chat AI Agent untuk transaksi harian (bukan form manual)
- **Hak Akses:** Terbatas sesuai divisi

### 2.3 Anggota Koperasi (Member)
- **Peran:** Anggota aktif koperasi
- **Kebutuhan:** Cek saldo, riwayat transaksi, pengajuan pinjaman, informasi keanggotaan
- **Hak Akses:** Portal anggota (read-only + pengajuan)

### 2.4 Auditor / Pengawas
- **Peran:** Tim pengawas internal/eksternal
- **Kebutuhan:** Laporan audit, jurnal harian, neraca, buku besar
- **Hak Akses:** Read-only ke laporan keuangan

---

## 3. Fitur Utama (Feature Requirements)

### 3.1 Modul Keanggotaan (WAJIB)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| M-01 | Pendaftaran anggota baru | P1 | Form lengkap + upload KTP/foto |
| M-02 | Verifikasi & aktivasi anggota | P1 | Workflow persetujuan bertingkat |
| M-03 | Profil anggota | P1 | Data lengkap, status, histori |
| M-04 | Pengunduran diri anggota | P2 | Proses closing rekening |
| M-05 | Pencarian & filter anggota | P1 | Multi-filter, export Excel |
| M-06 | Kartu Anggota Digital | P3 | QR Code, cetak PDF |

### 3.2 Modul Simpanan (WAJIB)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| S-01 | Simpanan Pokok | P1 | Satu kali bayar saat mendaftar |
| S-02 | Simpanan Wajib | P1 | Rutin per bulan, auto-debit |
| S-03 | Simpanan Sukarela | P1 | Bisa setor/tarik kapan saja |
| S-04 | Simpanan Berjangka / Deposito | P2 | Tenor & bunga tetap |
| S-05 | Perhitungan Bunga Simpanan | P1 | Otomatis per periode |
| S-06 | Mutasi Rekening Simpanan | P1 | Buku tabungan digital |

### 3.3 Modul Pinjaman (WAJIB)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| P-01 | Pengajuan Pinjaman | P1 | Form + dokumen pendukung |
| P-02 | Analisis Kelayakan (Credit Scoring) | P1 | Otomatis + review manual |
| P-03 | Persetujuan Bertingkat | P1 | Workflow multi-level approval |
| P-04 | Pencairan Pinjaman | P1 | Transfer / tunai, terintegrasi kas |
| P-05 | Jadwal Angsuran | P1 | Flat / Anuitas / Efektif |
| P-06 | Pembayaran Angsuran | P1 | Kasir & payment gateway |
| P-07 | Pelunasan Dipercepat | P2 | Kalkulasi sisa pokok + denda |
| P-08 | Restrukturisasi Pinjaman | P2 | Perpanjangan / perubahan cicilan |
| P-09 | Pinjaman Jatuh Tempo & Kolektibilitas | P1 | Klasifikasi: Lancar, DPK, NPL |
| P-10 | Denda Keterlambatan | P1 | Otomatis hitung & catat |

### 3.4 Modul Keuangan & Akuntansi (WAJIB)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| K-01 | Manajemen Kas & Bank | P1 | Multi-rekening, pembukuan kas |
| K-02 | Jurnal Umum (General Ledger) | P1 | Double-entry bookkeeping |
| K-03 | Chart of Accounts (CoA) | P1 | Daftar akun standar koperasi |
| K-04 | Laporan Neraca | P1 | Balance Sheet real-time |
| K-05 | Laporan Laba Rugi / SHU | P1 | Perhitungan SHU per periode |
| K-06 | Arus Kas (Cash Flow) | P2 | Laporan arus kas periodik |
| K-07 | Buku Besar | P1 | Per akun, per periode |
| K-08 | Rekonsiliasi Bank | P2 | Cocokkan mutasi bank & buku |

### 3.5 Modul Laporan & Analitik (PENTING)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| L-01 | Dashboard Ringkasan Eksekutif | P1 | KPI utama, grafik tren |
| L-02 | Laporan Pertumbuhan Anggota | P2 | Bulanan, tahunan |
| L-03 | Laporan Portofolio Pinjaman | P1 | Outstanding, kolektibilitas |
| L-04 | Laporan Simpanan | P1 | Total simpanan per produk |
| L-05 | Laporan SHU | P1 | Distribusi per anggota |
| L-06 | Export Laporan | P1 | PDF, Excel, CSV |
| L-07 | Analitik AI (Prediksi NPL) | P3 | Machine Learning scoring |

### 3.6 Modul AI Automation Engine (INTI SISTEM — WAJIB)
> Ini adalah jantung dari keunggulan kompetitif Core Koperasi. Setiap sub-fitur di modul ini mendukung minimisasi SDM.

| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| AI-01 | OCR KTP & Dokumen | P1 | Auto-fill form pendaftaran anggota dari foto KTP |
| AI-02 | OCR Slip Gaji / Laporan Usaha | P2 | Ekstrak data penghasilan untuk credit scoring |
| AI-03 | Webhook Payment Processor | P1 | Setoran & angsuran otomatis via VA/QRIS/Transfer |
| AI-04 | AI Credit Scoring | P1 | Skor kredit otomatis (5C + AI), rekomendasi layak/tidak |
| AI-05 | Auto-Journaling Engine | P1 | Generate jurnal double-entry otomatis setiap transaksi |
| AI-06 | Conversational AI Agent | P1 | Petugas input transaksi via chat natural language |
| AI-07 | Background Job Scheduler | P1 | Update kolektibilitas, hitung bunga, kirim reminder |
| AI-08 | Virtual Account per Anggota | P2 | VA unik per rekening untuk identifikasi otomatis |
| AI-09 | QRIS Dinamis Kasir | P2 | Generate QRIS on-demand, pembayaran dikonfirmasi via webhook |
| AI-10 | AI Anomaly Detection | P3 | Deteksi transaksi mencurigakan / pola tidak wajar |

### 3.7 Modul Administrasi Sistem (WAJIB)
| ID | Fitur | Prioritas | Keterangan |
|----|-------|-----------|------------|
| A-01 | Manajemen Pengguna & Role | P1 | RBAC (Role-Based Access Control) |
| A-02 | Audit Trail / Log Aktivitas | P1 | Setiap aksi tercatat |
| A-03 | Pengaturan Koperasi | P1 | Profil, logo, parameter sistem |
| A-04 | Backup & Restore Data | P2 | Otomatis & manual |
| A-05 | Notifikasi (Email / WhatsApp) | P2 | Jatuh tempo, approval, dll |

---

## 4. Non-Functional Requirements

| Kategori | Persyaratan |
|----------|-------------|
| **Performa** | Response time < 2 detik untuk operasi normal; Webhook diproses < 5 detik |
| **Ketersediaan** | Uptime 99.5% (tidak termasuk maintenance terjadwal) |
| **Otomasi** | ≥ 80% transaksi simpanan & angsuran diproses tanpa input manual kasir |
| **OCR Akurasi** | Field kritikal (NIK, Nama) akurasi ≥ 95% sebelum go-live |
| **Keamanan** | HTTPS wajib, enkripsi data sensitif (AES-256), session timeout |
| **Skalabilitas** | Mendukung hingga 10.000 anggota per instansi |
| **Responsivitas** | Mobile-first, berfungsi baik di tablet kasir |
| **Regulasi** | Sesuai standar akuntansi koperasi Indonesia (PSAK/SAK ETAP) |
| **Backup** | Data di-backup harian, retensi 90 hari |
| **Idempotency** | Webhook diproses tepat 1x meski dikirim berkali-kali |

---

## 5. Batasan (Constraints)

- Aplikasi berjalan berbasis web (tidak memerlukan install di perangkat)
- Multi-tenant architecture untuk mendukung lebih dari satu koperasi
- Bahasa antarmuka: Bahasa Indonesia
- Mendukung browser modern: Chrome, Firefox, Edge (versi 2 tahun terakhir)

---

## 6. Asumsi

- Setiap koperasi adalah entitas terpisah dengan data yang terisolasi
- Pengurus memiliki minimal satu perangkat dengan koneksi internet
- Pembayaran angsuran dapat melalui kasir maupun payment gateway (Xendit)
- Tidak menggantikan sistem akuntansi besar (SAP, dll), dirancang khusus untuk koperasi skala menengah

---

## 7. Out of Scope (Versi 1.0)

- Integrasi core banking perbankan eksternal (SLIK OJK real-time)
- Aplikasi mobile native (iOS/Android)
- Modul payroll karyawan koperasi
- Multi-currency
