# Pedoman SOP Standardisasi Tampilan Mobile & Responsif (Mobile-First Optimization)

Ekosistem dashboard **Koperasi-AI** dirancang tidak hanya untuk layar desktop lebar di lingkungan kantor, namun juga harus sangat ramah, cepat, dan fungsional saat diakses melalui perangkat seluler (ponsel pintar dan tablet) oleh pengurus atau petugas lapangan.

Dokumen ini berisi standar baku tata letak responsif yang wajib dipertahankan pada setiap penambahan modul halaman baru.

---

## 📱 1. Arsitektur Layout Utama (Dashboard Container)
Struktur pembungkus teratas (`DashboardLayout`) harus menjamin fleksibilitas lebar area konten dan tidak boleh memotong tabel/formulir ke luar batas pandang.

- **Desktop View (`lg:pl-64`)**: Sidebar dengan lebar 64 bernilai tetap (*fixed*), mendorong area utama ke kanan.
- **Mobile View (`pl-0` / `w-full`)**: Sidebar disembunyikan ke luar layar (`-translate-x-full`), dan area utama mengisi 100% lebar layar.
- **Padding Fleksibel**: Area `<main>` wajib memakai kelas adaptif `p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden`.

---

## 🍔 2. Mekanisme Navigasi Mobile (Floating Navigation Drawer)
Karena sidebar bersembunyi pada mode mobile, pengguna seluler dipandu menggunakan tombol akses mengambang (*Floating Action Button*).

### Implementasi Baku di `Sidebar.tsx`:
- Sebuah tombol melingkar elegan (`w-14 h-14 bg-blue-600 rounded-full shadow-2xl`) disematkan secara presisi pada posisi pojok kanan bawah (`fixed bottom-6 right-6 z-50 lg:hidden`).
- Mengklik tombol ini memicu perubahan state `isOpen` yang menggeser masuk sidebar secara halus (`translate-x-0 transition-transform duration-300`).
- **Backdrop Pengaman**: Muncul lapisan semi-transparan `bg-slate-900/60 backdrop-blur-sm` menutupi area konten belakang. Sentuhan pada backdrop ini akan langsung menutup laci navigasi.
- **Auto-Close Link**: Setiap kali pengguna seluler mengetuk tautan menu (`SidebarLink`), laci navigasi harus otomatis menutup agar antarmuka langsung menyajikan halaman tujuan tanpa intervensi ekstra.

---

## 🗂️ 3. Penanganan Komponen di Layar Sempit (Mobile UI Patterns)

### A. Tabel Data (Data Tables)
Tabel dengan banyak kolom (seperti Jurnal Umum atau Laporan Neraca) berpotensi meluber ke kanan jika dilihat di ponsel vertikal (*portrait*).
- **Aturan Wajib**: Setiap komponen `<Table>` harus selalu dibungkus di dalam wadah yang memiliki properti `overflow-x-auto`.
- **Implementasi Card**:
  ```tsx
  <Card className="border-none shadow-sm overflow-hidden">
    <CardContent className="p-0 overflow-x-auto max-w-full">
      <Table className="min-w-[600px]"> {/* Menjamin kolom tidak saling tergencet */}
        ...
      </Table>
    </CardContent>
  </Card>
  ```
- Pengguna mobile cukup melakukan gestur usap horizontal (*horizontal swipe*) untuk melihat sisa kolom angka di sebelah kanan.

### B. Grid & Kartu Statistik (Metric Cards)
Penyusunan pos-pos keuangan atau statistik atas tidak boleh kaku pada satu baris horisontal.
- Gunakan grid adaptif: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
- Kelas ini memastikan kartu metrik bertumpuk rapi secara vertikal di ponsel, membagi dua di tablet, dan memanjang horizontal di layar monitor.

### C. Formulir & Tombol Aksi (Forms & Actions Header)
- **Header Halaman**: Pada layar mobile, gunakan susunan atas-bawah jika judul dan tombol aksi bersinggungan.
  ```tsx
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-bold">Judul Halaman</h1>
    </div>
    {/* Tombol aksi merentang penuh di mobile */}
    <div className="w-full sm:w-auto">
      <Button className="w-full sm:w-auto">Aksi</Button>
    </div>
  </div>
  ```

---

## 🚀 4. Uji Kepatuhan Responsif (QA Checklist)
Sebelum melepas kode ke cabang utama (*main branch*), pengembang wajib memvalidasi antarmuka melalui *Device Mode* pada peramban dengan kriteria:
1. **Tidak Ada Scroll Horisontal Liar**: Halaman utama tidak boleh bergoyang ke kiri-kanan akibat elemen berdimensi absolut melampaui `100vw`.
2. **Area Ketuk Aman (Touch Targets)**: Tombol dan tautan seluler harus memiliki tinggi minimal `40px` untuk meminimalkan salah ketuk oleh jari pengguna.
3. **Keterbacaan Teks**: Ukuran font utama pada layar mobile adalah `text-sm` untuk label dan `text-xs` untuk metadata sekunder.

---

## 📱 5. Portal Anggota Khusus Mobile (Android / Member Portal)
Sistem Core Koperasi menyediakan subsistem terpisah berupa **Halaman Portal Anggota** yang didesain secara khusus dan eksklusif untuk konsumsi perangkat seluler, terutama pengguna **Android**. Antarmuka ini dirancang untuk mobilitas tinggi, memungkinkan anggota mandiri melakukan peninjauan saldo, mutasi, dan jadwal angsuran di mana saja.

### 5.1 Standar Desain Antarmuka Portal Anggota (Mobility-First):
- **Tata Letak Satu Tangan (*One-Handed Navigation*)**: Menggunakan bilah navigasi bawah (*Bottom Navigation Bar*) dengan ikon besar untuk tab utama (Beranda, Simpanan, Pembiayaan, Profil).
- **Kartu Identitas Digital**: Menampilkan representasi grafis kartu anggota dengan nomor *barcode* atau QRIS untuk di-scan di meja kasir.
- **Aksi Cepat (*Quick Actions*)**: Tombol bundar raksasa untuk setor/tarik mandiri atau pengajuan pinjaman kilat.

### 5.2 Solusi Pembuatan Aplikasi Android Tanpa Koding Java/Kotlin:
Karena pengembang terbiasa dengan ekosistem web (PHP/Next.js) dan tidak familier dengan pemrograman Android asli (*Native Java/Kotlin*), sistem ini memanfaatkan **teknologi pembungkus (*wrapper*) modern** untuk menyulap kode Next.js menjadi berkas `.apk` atau `.aab` Android siap edar di Play Store:

1. **Progressive Web App (PWA) — Opsi Instan Tanpa Repot**:
   - **Cara Kerja**: Menggunakan pustaka `next-pwa`. Aplikasi Next.js ditambahkan *file* `manifest.json` dan *service worker*.
   - **Pengalaman Pengguna**: Anggota cukup membuka *link* web di Google Chrome Android, lalu muncul *prompt* otomatis **"Install App"**. Setelah diketuk, aplikasi langsung terpasang di layar beranda (*homescreen*) Android lengkap dengan ikon, *splash screen*, dan tampilan penuh tanpa bilah alamat peramban.
2. **CapacitorJS (Pilihan Premium/Standar Industri)**:
   - **Status Biaya & Lisensi**: **100% Gratis dan Open-Source (Lisensi MIT)**. Istilah *"Premium Industri"* merujuk pada kualitas kestabilan setara aplikasi perbankan, bukan berbayar. Tidak ada biaya kompilasi atau rilis ke Play Store.
   - **Cara Kerja**: Diciptakan oleh tim Ionic. Capacitor mengambil hasil ekspor statis HTML/JS/CSS Next.js Anda (folder `out/`), lalu menanamkannya ke dalam cangkang aplikasi Android asli yang ringan (*WebView*).
   - **Kelebihan**: Memberikan Anda akses penuh ke perangkat keras Android seperti **Kamera** (untuk *scan* KTP/QRIS) dan **Notifikasi Push Asli (*Native Push Notifications*)** murni menggunakan skrip JavaScript biasa tanpa menyentuh Android Studio secara rumit.
   - **Pembagian Tugas Pengerjaan (AI vs Manusia)**:
     - **Porsi AI Agent (Antigravity) — 95%**: Asisten AI siap mengambil alih instalasi paket (`@capacitor/core`, `@capacitor/cli`), penulisan skrip otomatisasi di `package.json`, penyusunan `capacitor.config.ts`, penyesuaian rilis ekspor statis Next.js, dan pembentukan awal cangkang Android (`npx cap add android`).
     - **Porsi Pengembang Manusia — 5%**: Pengembang cukup menginstal **Android Studio** (gratis) di OS Windows, menjalankan perintah terminal `npx cap open android`, dan menekan tombol **"Build APK"**. Aplikasi `.apk` siap didistribusikan tanpa koding native manual.
