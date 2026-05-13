# Panduan Pengguna Akhir (End-User Guide) — Koperasi-AI Core

Dokumen ini merupakan panduan operasional standar bagi seluruh lapisan pengguna platform **Koperasi-AI Core**, mulai dari Staf Teller, Petugas Pendaftaran Anggota, hingga Manajer dan Pengurus Koperasi.

---

## 1. Modul Pendaftaran Anggota & AI OCR Scanner

Sistem dilengkapi dengan pemindai cerdas bertenaga **Google Gemini AI OCR** untuk mengekstraksi data otentik dari kartu identitas (KTP) secara seketika guna meminimalisasi kesalahan ketik manual (*typo*).

### Langkah-Langkah Pendaftaran:
1. Navigasi ke halaman **Manajemen Anggota** dari bilah menu sisi kiri.
2. Klik tombol **"Tambah Anggota"** di sudut kanan atas.
3. Pada tab **"Pindai KTP (AI OCR)"**, klik tombol pilih berkas atau seret foto KTP ke area yang disediakan.
4. Klik **"Ekstrak Data Identitas"**. AI akan mengolah gambar dan mengisi kolom NIK, Nama Lengkap, Tempat/Tanggal Lahir, serta Alamat secara otomatis.
5. Verifikasi hasil ekstraksi. Jika ada sedikit ketidaktepatan akibat kualitas foto, Anda dapat langsung menyuntingnya di kolom formulir.
6. Masukkan setoran awal Simpanan Pokok (sesuai ketentuan AD/ART) dan klik **"Simpan & Daftarkan"**. Sistem akan otomatis mencetak log penandatanganan dan membukukan entri awal ke jurnal akuntansi.

---

## 2. Modul Transaksi Teller (Setoran & Penarikan Tunai)

Setiap mutasi tunai yang diproses melalui antarmuka kasir dijamin kepatuhannya oleh sistem pembukuan ganda otomatis (**Double-Entry Bookkeeping**).

### Alur Penerimaan Setoran:
1. Buka menu **Teller & Kasir**.
2. Pilih tab **"Setoran Simpanan"**.
3. Pilih rekening tujuan dari menu tarik-turun (*dropdown*). Sistem secara cerdas akan memuat informasi nama anggota, NIK, dan saldo terakhir.
4. Masukkan **Nominal Setoran** (sistem akan menolak jika nominal bernilai nol atau negatif).
5. Tambahkan keterangan (opsional, contoh: *"Setoran wajib bulan Mei"*).
6. Klik **"Proses Setoran"**. Sistem akan menjalankan 4 operasi berantai secara atomik:
   - Memperbarui saldo mutlak rekening simpanan.
   - Mencetak tanda terima mutasi anggota.
   - Menjurnal pos akun Kas di Tangan (Debit) dan Simpanan Anggota (Kredit).
   - Menorehkan rekam jejak persisten ke dalam tabel `AuditLog`.

### Alur Penarikan Simpanan:
1. Pilih tab **"Penarikan Tunai"** di halaman Teller.
2. Pilih rekening simpanan sukarela anggota yang bersangkutan.
3. Masukkan nominal penarikan. **Catatan Penting:** Sistem dilengkapi proteksi likuiditas; jika nominal penarikan melebihi saldo aktif, transaksi akan otomatis dibatalkan disertai modal umpan balik yang ramah.
4. Klik **"Proses Penarikan"**. Akuntansi akan membukukan jurnal pembalik: Simpanan Anggota (Debit) dan Kas di Tangan (Kredit).

---

## 3. Modul Konsultasi Pembiayaan (AI Chat Advisory)

Modul ini dirancang untuk memberikan masukan finansial berbasis parameter dan riwayat kredit kepada calon peminjam.

### Cara Penggunaan:
1. Buka menu **Konsultasi AI** atau klik ikon asisten virtual di bilah atas.
2. Anda dapat memilih mode simulasi untuk menghitung kelayakan pagu pembiayaan berdasarkan penghasilan bulanan dan rasio utang.
3. Ketikkan pertanyaan atau skenario kredit di kolom obrolan. Contoh: *"Berapa cicilan maksimal untuk anggota dengan gaji 5 juta dan tenor 24 bulan?"*
4. Model AI akan memberikan rekomendasi terstruktur, mematuhi parameter margin pembiayaan yang diatur di halaman pengaturan global.

---

## 4. Keamanan & Proteksi Entri Ganda (Double-Entry Guard)

Untuk menjaga akuntabilitas kelas perusahaan, manajer atau pengurus diberikan lapisan pengaman tambahan pada area konfigurasi kritis:

- **Pengelolaan Katalog Produk:** Saat menambahkan atau menyunting produk simpanan/kredit baru, sistem mewajibkan pengguna untuk mengesahkan keterikatan pos **Chart of Accounts (COA)** yang sesuai. Hal ini menutup celah manipulasi jalur akuntansi.
- **Konfigurasi Sistem Global:** Perubahan suku bunga acuan atau margin maksimal dilindungi oleh notifikasi kepatuhan. Setiap pengesahan perubahan akan langsung dikirim ke umpan siaran langsung **Audit Trail** yang tidak dapat diubah atau dihapus (*immutable*).

---

> **Bantuan Teknis:** Jika menemukan kendala konektivitas peladen atau anomali data, silakan unduh salinan basis data melalui tombol **"Cadangkan DB"** di halaman Pengaturan dan teruskan kepada administrator sistem.
