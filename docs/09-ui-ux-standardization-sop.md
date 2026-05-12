# Standar Operasional Prosedur (SOP) Antarmuka UI & UX Koperasi-AI

Dokumen ini merupakan pedoman baku (*Single Source of Truth*) dalam pengembangan, pemeliharaan, dan penambahan fitur antarmuka pada ekosistem **Koperasi-AI**. Seluruh pengembang wajib mematuhi panduan ini agar aplikasi tidak melenceng dari pakem visual yang premium, bersih, dan fungsional.

---

## 🎨 1. Sistem Warna & Hierarki Visual (Color Tokens)
Aplikasi memanfaatkan palet warna **Slate** untuk struktur utama dan **Blue/Emerald/Rose** sebagai aksen status keuangan.

- **Primary Brand (Aksi Utama)**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Secondary / Muted (Aksi Sekunder/Batal)**: `variant="outline"` atau `variant="ghost"`
- **Neutral Dark (Header/Tombol Form/Buku Besar)**: `bg-slate-900 hover:bg-slate-800 text-white`
- **Success / Pendapatan / Aktiva**: `text-emerald-600 bg-emerald-50`
- **Danger / Beban / Kewajiban**: `text-rose-600 bg-rose-50`
- **Warning / Proteksi Otentikasi**: `text-amber-600 bg-amber-50`

---

## 🔘 2. Standardisasi Tombol & Ikonografi (Buttons & Icons)
Setiap komponen tombol harus menggunakan komponen dasar dari `@/components/ui/button`.

### Aturan Visual & UX Tombol Baku:
1. **Kewajiban Penggunaan Ikon**: Untuk mencapai standar antarmuka modern yang rapi secara visual, **SETIAP tombol aksi diwajibkan menyertakan ikon** yang relevan dari pustaka `lucide-react`.
   - **Tombol Berteks**: Ikon diletakkan di sebelah kiri teks dengan jarak konsisten (`mr-2 h-4 w-4`). Contoh: `<Plus className="mr-2 h-4 w-4" /> Buka Rekening`.
   - **Tombol Ringkas (Tabel/Aksi Baris)**: Gunakan murni ikon berukuran presisi tanpa teks berlebih untuk menghemat ruang, dipadukan dengan *Tooltip* jika diperlukan. Contoh: `<Eye className="h-4 w-4" />` atau `<Trash2 className="h-4 w-4 text-rose-500" />`.
2. **Umpan Balik Proses (Loading State)**: Saat proses asinkron berlangsung, tombol wajib dalam kondisi `disabled={isSubmitting}` dan ikon utama seketika bertransformasi menjadi ikon putar (`<Loader2 className="mr-2 h-4 w-4 animate-spin" />`).
3. **Penamaan Label**: Gunakan kata kerja aktif yang ringkas dan lugas. Hindari kalimat panjang. Contoh: **"Tambah Petugas"**, **"Simpan Pengaturan"**, **"Cetak Kuitansi"**.

---

## 🪟 3. Standardisasi Modal / Dialog & Umpan Balik (Feedback Modals)
Modal digunakan untuk formulir entri cepat, konfirmasi aksi, atau notifikasi terpusat tanpa memindahkan konteks halaman pengguna. Gunakan pembungkus dari `@/components/ui/dialog`.

### 3.1 Modal Formulir Entri Baku:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Judul Aksi Jelas</DialogTitle>
      <DialogDescription className="text-xs">
        Sub-judul atau instruksi pengisian yang ringkas.
      </DialogDescription>
    </DialogHeader>
    
    {/* Area Konten Form atau Pesan */}
    <div className="py-4">...</div>
    
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Batal</Button>
      <Button className="bg-blue-600">Simpan Data</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.2 Modal Umpan Balik Status (Inspirasi: Tabler UI)
DILARANG MENGGUNAKAN `alert()` PERAMBAN UNTUK NOTIFIKASI APAPUN. Semua status peringatan, sukses, atau galat wajib menggunakan komponen khusus `<FeedbackModal />` dengan estetika premium:
- **Pusat Ikon Visual Raksasa**: Ikon diletakkan di tengah atas dengan latar belakang lingkaran semitransparan yang lembut (Warna: Zamrud untuk Sukses, Amber untuk Peringatan, Mawar untuk Galat).
- **Tipografi Bersih & Terpusat**: `DialogTitle` di tengah (*text-center*) dengan cetak tebal, disertai `DialogDescription` berwarna abu-abu lembut.
- **Tombol Mulus**: Tata letak tombol bawah tanpa bingkai kasar, dengan fokus otomatis jika memungkinkan.

### Aturan UX Modal:
- **Pencegahan Klik Taksengaja**: Modal form entri pembukuan tidak boleh tertutup jika pengguna mengklik area luar (*backdrop*) saat form sedang diisi, kecuali melalui tombol **Batal** atau ikon **X**.
- **Penyelarasan Lebar**: Gunakan `sm:max-w-[425px]` untuk form sederhana/feedback dan `sm:max-w-[600px]` untuk tabel rincian jurnal manual.

---

## 📊 4. Standardisasi Tabel & Penomoran Halaman (Tables & Pagination)
Tabel adalah elemen terpenting dalam meninjau data buku besar, mutasi, dan daftar entitas. Gunakan dari `@/components/ui/table`.

### Aturan UX & Visual Tabel Seragam:
1. **Gaya Visual Seragam**: Seluruh halaman wajib menggunakan gaya tabel identik:
   - Header: `bg-slate-50/70 border-b border-slate-100` dengan teks `text-xs uppercase font-bold text-slate-600 tracking-wider`.
   - Baris (*Rows*): Kelas pembatas tipis `divide-y divide-slate-100` dan latar belakang putih bersih bergantian dengan efek *hover* mulus.
2. **Tipografi Angka / Uang**: Wajib memakai kelas `font-mono text-sm` agar penyusunan angka rata kanan (*right-aligned*) terlihat presisi dan profesional.
3. **Pemisahan Ribuan**: Gunakan fungsi format lokal standar `Number(val).toLocaleString('id-ID')` dengan prefiks mata uang **Rp**.
4. **State Kosong (Empty State)**: Jika `rows.length === 0`, render satu baris dengan `colSpan` penuh bernada *italic* abu-abu:
   ```tsx
   <TableCell colSpan={5} className="py-8 text-center text-slate-400 italic text-xs">
     Data tidak ditemukan atau belum terkonfigurasi.
   </TableCell>
   ```
5. **Aksi Baris (Row Actions)**: Letakkan pada kolom paling kanan dengan perataan teks ke kanan (`text-right`). Gunakan ikon tombol ringkas (*ghost variant*) seperti `<MoreVertical />` atau `<Settings2 />` untuk menghemat ruang kolom.

### 4.2 Standardisasi Komponen Pagination:
Setiap tabel dengan set data besar wajib memiliki blok *Pagination* seragam di bagian bawah tabel:
- **Indikator Rentang**: Menampilkan informasi tekstual ringkas di sisi kiri bawah: *"Menampilkan 1–10 dari 154 entri"*.
- **Tombol Navigasi**: Tombol bernavigasi angka atau tombol ringkas **[Sebelumnya]** dan **[Selanjutnya]** di sisi kanan bawah bergaya *outline* dengan sudut melengkung seragam (`rounded-lg`).

---

## 🔒 5. Keamanan & Integritas Ganda (Double-Entry Guard)
Setiap aksi di UI yang berpotensi memicu perubahan pos neraca keuangan (penambahan produk simpanan/pinjaman, pengubahan parameter bunga) **wajib diberikan notifikasi dialog proteksi** yang menjelaskan keterikatan akun dengan Chart of Accounts (COA) guna menjaga transparansi audit.
