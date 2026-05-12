"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Building2, Phone, CheckCircle2, ShieldCheck, Server } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function CabangPage() {
  const [isOpenModal, setIsOpenModal] = useState(false);

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

  // State Formulir Cabang
  const [formCabang, setFormCabang] = useState({
    kode: "CAB-",
    nama: "",
    alamat: "",
    telepon: "",
    kapasitasServer: "Dedicated Node (Sinkronisasi Otomatis)",
  });

  // Senarai Cabang
  const [cabangList, setCabangList] = useState([
    { id: "BRN-001", kode: "CAB-PUSAT", nama: "Kantor Pusat Operasional", alamat: "Jl. Jend. Sudirman Kav. 45, Jakarta", telepon: "021-5552910", aset: 1250000000, status: "TERKONEKSI", isUtama: true },
    { id: "BRN-002", kode: "CAB-JABAR", nama: "Cabang Pembantu Bandung Raya", alamat: "Jl. Asia Afrika No. 88, Bandung", telepon: "022-4431920", aset: 200200000, status: "TERKONEKSI", isUtama: false },
  ]);

  const handleSimpanCabang = () => {
    if (!formCabang.nama || formCabang.kode === "CAB-") {
      showModal("warning", "Gagal Menyimpan", "Harap masukkan nama kantor dan kode unik cabang.");
      return;
    }

    const newBranch = {
      id: `BRN-00${cabangList.length + 1}`,
      kode: formCabang.kode.toUpperCase(),
      nama: formCabang.nama,
      alamat: formCabang.alamat || "Alamat belum dilengkapi",
      telepon: formCabang.telepon || "-",
      aset: 50000000, // Alokasi awal
      status: "TERKONEKSI",
      isUtama: false,
    };

    setCabangList([...cabangList, newBranch]);
    setIsOpenModal(false);

    showModal(
      "success",
      "Titik Layanan Cabang Berhasil Dibuka",
      `Kantor cabang baru "${newBranch.nama}" (${newBranch.kode}) telah berhasil didaftarkan ke dalam topologi jaringan terpusat. Node peladen mandiri otomatis diinisialisasi untuk sinkronisasi jurnal ganda waktu nyata.`
    );

    // Reset
    setFormCabang({ kode: "CAB-", nama: "", alamat: "", telepon: "", kapasitasServer: "Dedicated Node" });
  };

  const handleSinkronisasiNode = (nama: string) => {
    showModal(
      "success",
      "Sinkronisasi Simpul Berhasil",
      `Perintah penarikan dan pencocokan pangkalan data dari simpul "${nama}" telah selesai dieksekusi. Tidak ditemukan selisih transaksi pembukuan (Balanced).`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen Jaringan Cabang</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengelolaan titik operasional, kantor pembantu, dan sinkronisasi simpul basis data terpusat.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsOpenModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-xs text-white h-9 shadow-md"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Buka Kantor Cabang
        </Button>
      </div>

      {/* ── Tabel Daftar Cabang ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-600" />
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Topologi Jaringan Titik Pelayanan</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200">
            Node Master: Online
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">Kode Jaringan</TableHead>
                <TableHead className="th-standard">Nama Kantor Layanan</TableHead>
                <TableHead className="th-standard">Alamat & Kontak</TableHead>
                <TableHead className="th-standard text-right">Alokasi Aset Kas</TableHead>
                <TableHead className="th-standard text-center">Status Simpul</TableHead>
                <TableHead className="th-standard text-right pr-6">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabangList.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-mono text-xs font-bold text-rose-600">
                    {row.kode}
                    {row.isUtama && (
                      <Badge className="ml-2 bg-slate-900 text-white text-[8px] font-sans px-1 py-0">Pusat</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {row.nama}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <div className="font-medium">{row.alamat}</div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5" /> {row.telepon}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                    Rp {row.aset.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px] font-medium py-0.5 px-2 bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 w-fit mx-auto">
                      <Server className="w-2.5 h-2.5" /> {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSinkronisasiNode(row.nama)}
                      className="text-[10px] text-blue-600 hover:bg-blue-50 font-bold"
                    >
                      Sinkronisasi DB
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Dialog Tambah Cabang ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Pendaftaran Kantor Cabang Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan parameter simpul jaringan dan lokasi operasional fisik pembantu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kode Simpul / Jaringan</label>
              <input
                type="text"
                placeholder="CAB-JATIM"
                value={formCabang.kode}
                onChange={(e) => setFormCabang({ ...formCabang, kode: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Kantor Cabang</label>
              <input
                type="text"
                placeholder="Cabang Pembantu Surabaya..."
                value={formCabang.nama}
                onChange={(e) => setFormCabang({ ...formCabang, nama: e.target.value })}
                className="w-full h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat Fisik</label>
              <textarea
                rows={2}
                placeholder="Jalan, Kota, Provinsi..."
                value={formCabang.alamat}
                onChange={(e) => setFormCabang({ ...formCabang, alamat: e.target.value })}
                className="w-full p-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nomor Telepon Kontak</label>
              <input
                type="text"
                placeholder="031-..."
                value={formCabang.telepon}
                onChange={(e) => setFormCabang({ ...formCabang, telepon: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanCabang} className="bg-rose-600 hover:bg-rose-700 text-xs text-white h-8 font-bold shadow-md">
              Buka Titik Simpul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pemanggilan Global FeedbackModal ── */}
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
