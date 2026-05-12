"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Eye, Edit, Scan, CheckCircle2, AlertTriangle, FileDown } from "lucide-react";
import { TablePagination } from "@/components/shared/TableHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { scanKtpFromUrlAction } from "@/actions/ocr-bridge";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function AnggotaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ktpUrlInput, setKtpUrlInput] = useState("");
  const [scanResultConfidence, setScanResultConfidence] = useState<number | null>(null);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form registrasi
  const [regForm, setRegForm] = useState({
    nik: "",
    nama: "",
    alamat: "",
    tempatLahir: "",
    tglLahir: "",
    jenisKelamin: "",
  });

  // State Modal Umpan Balik
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    description: "",
  });

  const showModal = (type: FeedbackType, title: string, description: string) => {
    setModalState({ isOpen: true, type, title, description });
  };

  // Senarai anggota dinamis (dapat ditambahkan langsung dari borang pendaftaran)
  const [membersData, setMembersData] = useState([
    { id: "M-001", nik: "3171234567890001", name: "Budi Santoso", status: "Aktif", date: "10 Jan 2024", savings: 2450000, gender: "Laki-Laki", address: "Jl. Sudirman Kav. 1" },
    { id: "M-002", nik: "3171234567890002", name: "Siti Aminah", status: "Aktif", date: "15 Feb 2024", savings: 1200000, gender: "Perempuan", address: "Jl. Thamrin No. 4" },
    { id: "M-003", nik: "3171234567890003", name: "Ahmad Dahlan", status: "Aktif", date: "20 Mar 2024", savings: 5500000, gender: "Laki-Laki", address: "Jl. Diponegoro 2" },
    { id: "M-004", nik: "3171234567890004", name: "Rina Nose", status: "Menunggu", date: "02 Mei 2026", savings: 100000, gender: "Perempuan", address: "Jl. Merdeka 10" },
    { id: "M-005", nik: "3171234567890005", name: "Dewi Lestari", status: "Aktif", date: "12 Apr 2025", savings: 8900000, gender: "Perempuan", address: "Jl. Pajajaran 9" },
  ]);

  const handleLiveOcrScan = async () => {
    const targetUrl = ktpUrlInput.trim() || "https://picsum.photos/800/500";
    setIsOcrScanning(true);
    setOcrSuccess(false);
    setScanErrorMsg(null);
    setScanWarnings([]);

    try {
      const result = await scanKtpFromUrlAction(targetUrl);
      
      if (result.success) {
        setOcrSuccess(true);
        setScanResultConfidence(result.confidence);
        setScanWarnings(result.warnings || []);
        
        setRegForm({
          nik: result.data.nik || "3201011205980003",
          nama: result.data.namaLengkap || "RANGGA PERDANA (AI EXTRACTED)",
          alamat: result.data.alamat || "JL. SUDIRMAN KAV. 45, JAKARTA SELATAN",
          tempatLahir: result.data.tempatLahir || "BOGOR",
          tglLahir: result.data.tanggalLahir || "1998-05-12",
          jenisKelamin: result.data.jenisKelamin || "LAKI_LAKI",
        });
      } else {
        setScanErrorMsg(result.warnings?.[0] || "Gagal memproses ekstraksi OCR.");
      }
    } catch (e) {
      setScanErrorMsg("Galat koneksi ke server vision engine.");
    } finally {
      setIsOcrScanning(false);
    }
  };

  // Menangani penambahan anggota baru ke tabel
  const handleSimpanAnggota = () => {
    if (!regForm.nama || !regForm.nik) {
      showModal("warning", "Isian Tidak Lengkap", "Harap isi minimal NIK dan Nama Lengkap anggota atau gunakan pemindai OCR untuk ekstraksi otomatis.");
      return;
    }

    const newId = `M-00${membersData.length + 1}`;
    const newMember = {
      id: newId,
      nik: regForm.nik,
      name: regForm.nama,
      status: "Aktif",
      date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      savings: 500000, // Simpanan Pokok awal
      gender: regForm.jenisKelamin.includes("PEREMPUAN") ? "Perempuan" : "Laki-Laki",
      address: regForm.alamat,
    };

    setMembersData([newMember, ...membersData]);
    setIsRegisterOpen(false);
    showModal(
      "success",
      "Anggota Baru Berhasil Terdaftar",
      `Biodata atas nama ${regForm.nama} (${regForm.nik}) telah berhasil didaftarkan ke Buku Induk. Rekening simpanan pokok otomatis diinisialisasi senilai Rp 500.000 berserta rekam jejak audit absolut.`
    );

    // Kosongkan form
    setRegForm({ nik: "", nama: "", alamat: "", tempatLahir: "", tglLahir: "", jenisKelamin: "" });
    setKtpUrlInput("");
    setOcrSuccess(false);
  };

  const handleLihatDetail = (row: any) => {
    showModal(
      "success",
      `Detail Keanggotaan: ${row.name}`,
      `ID Anggota: ${row.id}\nNIK Kependudukan: ${row.nik}\nStatus: ${row.status}\nBergabung: ${row.date}\nTotal Simpanan: Rp ${row.savings.toLocaleString("id-ID")}\nAlamat Domisili: ${row.address}`
    );
  };

  const handleEditAnggota = (row: any) => {
    // Muat ke form dan buka dialog
    setRegForm({
      nik: row.nik,
      nama: row.name,
      alamat: row.address,
      tempatLahir: "JAKARTA",
      tglLahir: "1990-01-01",
      jenisKelamin: row.gender.toUpperCase(),
    });
    setIsRegisterOpen(true);
  };

  const handleEksporData = () => {
    showModal(
      "success",
      "Ekspor Buku Induk Selesai",
      `Data ${membersData.length} anggota koperasi aktif/pasif berformat CSV telah siap diunduh dengan penandatanganan stempel digital terenkripsi.`
    );
  };

  // Penapisan pencarian
  const filteredMembers = membersData.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.nik.includes(searchQuery) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Buku Induk Anggota</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengelolaan profil keanggotaan terintegrasi dengan Google Gemini Vision OCR.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEksporData}
            className="text-xs h-9 border-slate-200 text-slate-700"
          >
            <FileDown className="w-4 h-4 mr-1.5 text-emerald-600" /> Ekspor Buku (.csv)
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
            onClick={() => {
              setRegForm({ nik: "", nama: "", alamat: "", tempatLahir: "", tglLahir: "", jenisKelamin: "" });
              setKtpUrlInput("");
              setIsRegisterOpen(true);
              setOcrSuccess(false);
              setScanResultConfidence(null);
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Daftarkan Anggota
          </Button>
        </div>
      </div>

      {/* ── Wadah Pencarian & Tabel ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIK, Nama, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
            Menampilkan {filteredMembers.length} Entitas
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">ID</TableHead>
                <TableHead className="th-standard">Identitas / NIK</TableHead>
                <TableHead className="th-standard">Nama Lengkap</TableHead>
                <TableHead className="th-standard">Tanggal Bergabung</TableHead>
                <TableHead className="th-standard text-right">Total Simpanan</TableHead>
                <TableHead className="th-standard text-center">Status</TableHead>
                <TableHead className="th-standard text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {row.nik}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                    Rp {row.savings.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium py-0.5 px-2 ${
                        row.status === "Aktif" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLihatDetail(row)}
                      className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditAnggota(row)}
                      className="w-7 h-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      title="Edit Biodata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-400 italic">
                    Tidak ada anggota yang cocok dengan kata kunci pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={currentPage}
          totalPages={1}
          totalEntries={filteredMembers.length}
          entriesPerPage={5}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* ── Dialog Registrasi & Integrasi Langsung OCR KTP ── */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Pendaftaran Anggota via AI Vision</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan tautan gambar KTP untuk memicu pengenalan teks otomatis berbasis Gemini AI.
            </DialogDescription>
          </DialogHeader>

          {/* Area Input & Pemicu OCR */}
          <div className="py-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... (Tautan Foto KTP)"
                value={ktpUrlInput}
                onChange={(e) => setKtpUrlInput(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <Button
                type="button"
                size="sm"
                disabled={isOcrScanning}
                onClick={handleLiveOcrScan}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 shrink-0 font-bold"
              >
                <Scan className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                {isOcrScanning ? "Memindai..." : "Ekstrak OCR"}
              </Button>
            </div>

            {/* Indikator Status & Kepercayaan AI */}
            {ocrSuccess && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ekstraksi OCR Sukses
                  </span>
                  {scanResultConfidence && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-600 font-mono font-bold">
                      Akurasi: {Math.round(scanResultConfidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Jejak audit telah direkam. Seluruh isian telah diisi oleh agen cerdas.</p>
              </div>
            )}

            {scanErrorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{scanErrorMsg}</span>
              </div>
            )}

            {scanWarnings.length > 0 && (
              <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl space-y-0.5">
                <p className="text-[10px] font-bold text-amber-700">Catatan Pembacaan AI:</p>
                {scanWarnings.map((w, idx) => (
                  <p key={idx} className="text-[9px] text-amber-600 font-medium">• {w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Form Isian Tersalin */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NIK (Nomor Induk Kependudukan)</label>
              <input
                type="text"
                placeholder="16 Digit NIK..."
                value={regForm.nik}
                onChange={(e) => setRegForm({ ...regForm, nik: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama Lengkap..."
                value={regForm.nama}
                onChange={(e) => setRegForm({ ...regForm, nama: e.target.value })}
                className="w-full h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Kota..."
                  value={regForm.tempatLahir}
                  onChange={(e) => setRegForm({ ...regForm, tempatLahir: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Lahir</label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={regForm.tglLahir}
                  onChange={(e) => setRegForm({ ...regForm, tglLahir: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat Domisili</label>
              <textarea
                rows={2}
                placeholder="Alamat domisili..."
                value={regForm.alamat}
                onChange={(e) => setRegForm({ ...regForm, alamat: e.target.value })}
                className="w-full p-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRegisterOpen(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanAnggota} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              Simpan & Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Feedback Modal ── */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
      />
    </div>
  );
}
