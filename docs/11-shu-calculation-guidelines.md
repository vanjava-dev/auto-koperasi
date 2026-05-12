# SOP Perhitungan & Alokasi Sisa Hasil Usaha (SHU) Real-Time

Sisa Hasil Usaha (SHU) merupakan representasi laba bersih koperasi yang dibagikan secara proporsional kepada para anggota, pengurus, dan cadangan aset instansi sesuai amanat Undang-Undang Perkoperasian dan Anggaran Dasar/Anggaran Rumah Tangga (AD/ART).

Pada ekosistem **Koperasi-AI**, kalkulasi SHU dihitung dan diestimasi secara **otomatis dan seketika (*real-time*)** berbasis agregasi pos-pos pembukuan ganda (*Double-Entry*).

---

## 📈 1. Rumus Utama Pembentukan Laba Bersih (SHU Berjalan)
Setiap transaksi jurnal (mutasi kasir, setoran, potongan provisi pinjaman, pembayaran beban utilitas) akan menghasilkan ekuilibrium mutasi di tabel `JurnalEntry`.

$$\text{SHU Berjalan} = \sum \text{Total Pendapatan Operasional} - \sum \text{Total Beban Operasional}$$

### A. Komponen Pembentuk Pendapatan (Pos KREDIT):
- **Jasa Pinjaman / Margin Kredit**: Dihasilkan dari realisasi angsuran bunga/jasa piutang anggota.
- **Biaya Administrasi & Provisi**: Dipungut di muka saat pencairan pinjaman baru.
- **Pendapatan Bank / Investasi**: Bunga atas penempatan kas koperasi di bank konvensional/syariah.

### B. Komponen Pengurang (Beban - Pos DEBIT):
- **Beban Bunga / Jasa Simpanan**: Imbal hasil yang wajib dibayarkan kepada pemilik rekening Simpanan Berjangka / Sukarela.
- **Beban Gaji & Operasional Kantor**: Honorarium pengurus, biaya sewa, listrik, dan penyusutan aset.

---

## 🍰 2. Parameter Persentase Alokasi Pembagian SHU (AD/ART Baku)
Ketika periode pembukuan tahunan ditutup (*Year-End Closing*), total akumulasi SHU akan dipecah ke dalam akun-akun penampung kewajiban sebelum didistribusikan ke dompet anggota. 

Berikut adalah parameter persentase alokasi baku yang terprogram pada *engine* Koperasi-AI:

| Pos Alokasi SHU | Persentase (%) | Deskripsi & Tujuan |
| :--- | :---: | :--- |
| **Cadangan Koperasi** | **40%** | Ditahan sebagai penguat modal sendiri (*Equity*) untuk ekspansi usaha dan mitigasi risiko kerugian. |
| **Jasa Anggota** | **40%** | Dibagi kembali kepada anggota aktif berdasarkan bobot partisipasi transaksi (Simpanan & Pinjaman). |
| **Dana Pengurus & Pengawas** | **10%** | Insentif kinerja tahunan bagi jajaran pengurus operasional dan pengawas. |
| **Dana Pendidikan & Sosial** | **10%** | Alokasi pembiayaan pelatihan anggota serta tanggung jawab sosial lingkungan (CSR). |
| **Total Pembagian** | **100%** | *Wajib mencapai persis 100% tanpa sisa pembulatan.* |

---

## 🤝 3. Algoritma Perhitungan Rinci "Jasa Anggota" (40% Bagian)
Porsi **Jasa Anggota** tidak dibagikan rata, melainkan mematuhi asas keadilan distributif (*Distributive Justice*) yang diukur dari dua variabel aktivitas:

1. **Jasa Usaha (Jasa Pinjaman)**: Proporsi imbalan bagi anggota yang rajin meminjam dan tertib mengangsur.
   $$\text{Jasa Pinjaman Anggota } X = \left( \frac{\text{Total Bunga yang Dibayar Anggota } X}{\text{Total Pendapatan Bunga Koperasi}} \right) \times \text{Alokasi Jasa Usaha}$$

2. **Jasa Modal (Jasa Simpanan)**: Imbalan bagi anggota yang menempatkan saldo simpanan (Pokok, Wajib, Sukarela) di koperasi.
   $$\text{Jasa Modal Anggota } X = \left( \frac{\text{Rata-rata Saldo Simpanan Anggota } X}{\text{Total Simpanan Seluruh Anggota}} \right) \times \text{Alokasi Jasa Modal}$$

---

## 🖥️ 4. Implementasi Teknis & Akses Antarmuka
- **Live Monitoring**: Pengurus dapat memantau pergerakan SHU berjalan kapan saja melalui kartu utama di **Executive Dashboard** (`/dashboard`) dan rincian grafis di halaman **Laporan Laba Rugi** (`/laporan/laba-rugi`).
- **Pencegahan Rekayasa**: Angka SHU bersifat *Read-Only* pada antarmuka pelaporan. Penambahan atau koreksi SHU hanya diizinkan melalui mekanisme **Jurnal Penyesuaian** resmi yang terekam pada *Audit Log* bersertifikat keamanan.
