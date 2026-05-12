"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Percent, Edit, Trash2, Eye, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function ProdukPage() {
  const [activeTab, setActiveTab] = useState<"simpanan" | "pembiayaan">("simpanan");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Produk Baru");
  const [modalMode, setModalMode] = useState<"tambah" | "edit">("tambah");
  const [selectedId, setSelectedId] = useState("");

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

  // State Formulir Produk
  const [formProduk, setFormProduk] = useState({
    kode: "",
    nama: "",
    bungaAtauMargin: "",
    minimalAwal: "",
    keterangan: "",
  });

  // Senarai Produk Simpanan
  const [simpananProducts, setSimpananProducts] = useState([
    { id: "PRD-S01", kode: "SMP-SUKA", nama: "Simpanan Sukarela Fleksibel", tipe: "Sukarela", bunga: 4.5, minAwal: 50000, status: "AKTIF" },
    { id: "PRD-S02", kode: "SMP-DEP3", nama: "Deposito Berjangka 3 Bulan", tipe: "Berjangka", bunga: 6.0, minAwal: 5000000, status: "AKTIF" },
    { id: "PRD-S03", kode: "SMP-DEP6", nama: "Deposito Berjangka 6 Bulan", tipe: "Berjangka", bunga: 6.5, minAwal: 5000000, status: "AKTIF" },
    { id: "PRD-S04", kode: "SMP-DEP12", nama: "Deposito Berjangka 12 Bulan", tipe: "Berjangka", bunga: 7.2, minAwal: 10000000, status: "AKTIF" },
  ]);

  // Senarai Produk Pembiayaan
  const [pembiayaanProducts, setPembiayaanProducts] = useState([
    { id: "PRD-P01", kode: "PEM-MIKRO", nama: "Pembiayaan Mikro Mandiri", margin: 12.0, maxPlafon: 25000000, tenorMax: "24 Bulan", status: "AKTIF" },
    { id: "PRD-P02", kode: "PEM-KEND", nama: "Kredit Kendaraan Bermotor", margin: 14.5, maxPlafon: 50000000, tenorMax: "36 Bulan", status: "AKTIF" },
    { id: "PRD-P03", kode: "PEM-MULTI", nama: "Pembiayaan Multiguna Usaha", margin: 13.0, maxPlafon: 100000000, tenorMax: "48 Bulan", status: "AKTIF" },
    { id: "PRD-P04", kode: "PEM-TANI", nama: "Kredit Tani & Pangan", margin: 10.5, maxPlafon: 15000000, tenorMax: "12 Bulan", status: "PASIF" },
  ]);

  const handleBukaTambah = (jenis: "simpanan" | "pembiayaan") => {
    setActiveTab(jenis);
    setModalMode("tambah");
    setSelectedId("");
    setModalTitle(jenis === "simpanan" ? "Tambah Produk Simpanan" : "Tambah Paket Pembiayaan");
    setFormProduk({
      kode: jenis === "simpanan" ? "SMP-BARU" : "PEM-BARU",
      nama: "",
      bungaAtauMargin: jenis === "simpanan" ? "5.0" : "12.5",
      minimalAwal: jenis === "simpanan" ? "100000" : "20000000",
      keterangan: jenis === "simpanan" ? "Sukarela" : "36 Bulan",
    });
    setIsOpenModal(true);
  };

  const handleBukaEdit = (item: any, isSimpanan: boolean) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setModalTitle(isSimpanan ? "Penyuntingan Produk Simpanan" : "Penyuntingan Paket Pembiayaan");
    setFormProduk({
      kode: item.kode,
      nama: item.nama,
      bungaAtauMargin: isSimpanan ? item.bunga.toString() : item.margin.toString(),
      minimalAwal: isSimpanan ? item.minAwal.toString() : item.maxPlafon.toString(),
      keterangan: isSimpanan ? item.tipe : item.tenorMax,
    });
    setIsOpenModal(true);
  };

  const handleSimpanProduk = () => {
    if (!formProduk.nama || !formProduk.kode) {
      showModal("warning", "Gagal Menyimpan", "Harap lengkapi nama paket dan kode identifikasi produk terlebih dahulu.");
      return;
    }

    if (modalMode === "tambah") {
      if (activeTab === "simpanan") {
        const newProd = {
          id: `PRD-S0${simpananProducts.length + 1}`,
          kode: formProduk.kode.toUpperCase(),
          nama: formProduk.nama,
          tipe: formProduk.keterangan || "Kustom",
          bunga: Number(formProduk.bungaAtauMargin) || 0,
          minAwal: Number(formProduk.minimalAwal) || 0,
          status: "AKTIF",
        };
        setSimpananProducts([newProd, ...simpananProducts]);
      } else {
        const newProd = {
          id: `PRD-P0${pembiayaanProducts.length + 1}`,
          kode: formProduk.kode.toUpperCase(),
          nama: formProduk.nama,
          margin: Number(formProduk.bungaAtauMargin) || 0,
          maxPlafon: Number(formProduk.minimalAwal) || 0,
          tenorMax: formProduk.keterangan || "36 Bulan",
          status: "AKTIF",
        };
        setPembiayaanProducts([newProd, ...pembiayaanProducts]);
      }

      setIsOpenModal(false);
      showModal(
        "success",
        "Katalog Produk Berhasil Ditambahkan",
        `Produk ${activeTab === "simpanan" ? "simpanan" : "pembiayaan"} baru "${formProduk.nama}" (${formProduk.kode.toUpperCase()}) telah diintegrasikan ke dalam rujukan master produk dengan skema penandatanganan stempel digital.`
      );
    } else {
      // Alur Eksekusi Penyuntingan (Edit Mode)
      if (activeTab === "simpanan") {
        setSimpananProducts(prev => prev.map(p => p.id === selectedId ? {
          ...p,
          kode: formProduk.kode.toUpperCase(),
          nama: formProduk.nama,
          tipe: formProduk.keterangan || p.tipe,
          bunga: Number(formProduk.bungaAtauMargin) || p.bunga,
          minAwal: Number(formProduk.minimalAwal) || p.minAwal,
        } : p));
      } else {
        setPembiayaanProducts(prev => prev.map(p => p.id === selectedId ? {
          ...p,
          kode: formProduk.kode.toUpperCase(),
          nama: formProduk.nama,
          margin: Number(formProduk.bungaAtauMargin) || p.margin,
          maxPlafon: Number(formProduk.minimalAwal) || p.maxPlafon,
          tenorMax: formProduk.keterangan || p.tenorMax,
        } : p));
      }

      setIsOpenModal(false);
      showModal(
        "success",
        "Pembaruan Portofolio Berhasil",
        `Parameter redaksi dan ketentuan finansial pada paket "${formProduk.nama}" telah berhasil diperbarui ke dalam simpul utama.`
      );
    }
  };

  const handleHapusProduk = (id: string, nama: string) => {
    if (activeTab === "simpanan") {
      setSimpananProducts(prev => prev.filter(p => p.id !== id));
    } else {
      setPembiayaanProducts(prev => prev.filter(p => p.id !== id));
    }
    showModal("success", "Produk Diarsipkan", `Katalog produk "${nama}" berhasil dinonaktifkan dari penawaran sistem.`);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen & Katalog Produk</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengaturan master portofolio produk simpanan dan paket pembiayaan koperasi.</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleBukaTambah("simpanan")}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white h-9 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Produk Simpanan
          </Button>
          <Button
            size="sm"
            onClick={() => handleBukaTambah("pembiayaan")}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Paket Pembiayaan
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          onClick={() => setActiveTab("simpanan")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "simpanan"
              ? "border-emerald-600 text-emerald-600 bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          Katalog Simpanan ({simpananProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("pembiayaan")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "pembiayaan"
              ? "border-blue-600 text-blue-600 bg-blue-50/40"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Percent className="w-4 h-4" />
          Katalog Pembiayaan ({pembiayaanProducts.length})
        </button>
      </div>

      {/* ── Tampilan Tab Simpanan ── */}
      {activeTab === "simpanan" && (
        <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Produk Simpanan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-w-full">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="th-standard pl-6">Kode</TableHead>
                  <TableHead className="th-standard">Nama Produk</TableHead>
                  <TableHead className="th-standard text-center">Klasifikasi</TableHead>
                  <TableHead className="th-standard text-center">Bunga / p.a</TableHead>
                  <TableHead className="th-standard text-right">Setoran Awal Min</TableHead>
                  <TableHead className="th-standard text-center">Status</TableHead>
                  <TableHead className="th-standard text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simpananProducts.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-emerald-600">
                      {row.kode}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">
                      {row.nama}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600">
                      {row.tipe}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-slate-800">
                      {row.bunga}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      Rp {row.minAwal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[9px] font-medium py-0.5 px-2 bg-emerald-50 text-emerald-600 border-emerald-100">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBukaEdit(row, true)}
                        className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Sunting Produk"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHapusProduk(row.id, row.nama)}
                        className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Tampilan Tab Pembiayaan ── */}
      {activeTab === "pembiayaan" && (
        <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Paket Pembiayaan Kredit</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-w-full">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="th-standard pl-6">Kode</TableHead>
                  <TableHead className="th-standard">Nama Paket</TableHead>
                  <TableHead className="th-standard text-center">Margin / p.a</TableHead>
                  <TableHead className="th-standard text-right">Batas Maks Plafon</TableHead>
                  <TableHead className="th-standard text-center">Tenor Max</TableHead>
                  <TableHead className="th-standard text-center">Status</TableHead>
                  <TableHead className="th-standard text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pembiayaanProducts.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                      {row.kode}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">
                      {row.nama}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-slate-800">
                      {row.margin}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      Rp {row.maxPlafon.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600 font-medium">
                      {row.tenorMax}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[9px] font-medium py-0.5 px-2 ${row.status === "AKTIF" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBukaEdit(row, false)}
                        className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Sunting Paket"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHapusProduk(row.id, row.nama)}
                        className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog Tambah / Sunting Produk ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">{modalTitle}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sesuaikan margin/bunga tahunan serta plafon atas atau batas setoran minimal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kode Produk</label>
              <input
                type="text"
                placeholder="SMP-BARU / PEM-BARU"
                value={formProduk.kode}
                onChange={(e) => setFormProduk({ ...formProduk, kode: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama / Deskripsi Paket</label>
              <input
                type="text"
                placeholder="Contoh: Deposito Syariah / Kredit Mandiri..."
                value={formProduk.nama}
                onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })}
                className="w-full h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {activeTab === "simpanan" ? "Bunga (% p.a)" : "Margin (% p.a)"}
                </label>
                <input
                  type="text"
                  value={formProduk.bungaAtauMargin}
                  onChange={(e) => setFormProduk({ ...formProduk, bungaAtauMargin: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {activeTab === "simpanan" ? "Min Awal (Rp)" : "Max Plafon (Rp)"}
                </label>
                <input
                  type="text"
                  value={formProduk.minimalAwal}
                  onChange={(e) => setFormProduk({ ...formProduk, minimalAwal: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                {activeTab === "simpanan" ? "Kategori Sifat" : "Tenor Maksimal"}
              </label>
              <input
                type="text"
                placeholder={activeTab === "simpanan" ? "Sukarela / Berjangka" : "36 Bulan"}
                value={formProduk.keterangan}
                onChange={(e) => setFormProduk({ ...formProduk, keterangan: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanProduk} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              {modalMode === "tambah" ? "Simpan Katalog" : "Perbarui Portofolio"}
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
