"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getProdukListAction, 
  createProdukSimpananAction, 
  createProdukPinjamanAction,
  updateProdukSimpananAction,
  updateProdukPinjamanAction,
  deleteProdukSimpananAction,
  deleteProdukPinjamanAction
} from "@/actions/produk-action";
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

  // State Double-Entry Guard
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [selectedCoa, setSelectedCoa] = useState("201.01 - Simpanan Sukarela Anggota (Kewajiban)");

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

  // Senarai Produk Simpanan diawali kosong murni tanpa sampel statis
  const [simpananProducts, setSimpananProducts] = useState<any[]>([]);

  // Senarai Produk Pembiayaan diawali kosong murni tanpa sampel statis
  const [pembiayaanProducts, setPembiayaanProducts] = useState<any[]>([]);

  const [realCoasList, setRealCoasList] = useState<any[]>([]);

  const loadRealProducts = async () => {
    try {
      const res = await getProdukListAction();
      if (res?.success && res.data) {
        if (res.data.coas) {
          setRealCoasList(res.data.coas);
          if (res.data.coas.length > 0) {
            setSelectedCoa(res.data.coas[0].id);
          }
        }
        if (res.data.simpanan && res.data.simpanan.length > 0) {
          setSimpananProducts(res.data.simpanan.map((s: any) => ({
            id: s.id,
            kode: s.jenis,
            nama: s.namaProduk,
            tipe: s.jenis,
            bunga: Number(s.nisbahBagiHasil) || 0,
            minAwal: Number(s.setoranAwalMin) || 0,
            status: s.isActive ? "AKTIF" : "PASIF",
            coaName: s.coa ? `${s.coa.kodeAkun} - ${s.coa.namaAkun}` : "-",
          })));
        }
        if (res.data.pinjaman && res.data.pinjaman.length > 0) {
          setPembiayaanProducts(res.data.pinjaman.map((p: any) => ({
            id: p.id,
            kode: "PEM-" + p.tenorMaxBulan,
            nama: p.namaProduk,
            margin: Number(p.marginBunga) || 0,
            maxPlafon: Number(p.plafonMax) || 0,
            tenorMax: `${p.tenorMaxBulan} Bulan`,
            status: p.isActive ? "AKTIF" : "PASIF",
            coaName: p.coaPiutang ? `${p.coaPiutang.kodeAkun} - ${p.coaPiutang.namaAkun}` : "-",
          })));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadRealProducts();
  }, []);

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

  const handleTriggerSimpan = () => {
    if (!formProduk.nama || !formProduk.kode) {
      showModal("warning", "Gagal Menyimpan", "Harap lengkapi nama paket dan kode identifikasi produk terlebih dahulu.");
      return;
    }
    if (realCoasList.length > 0) {
      const defaultMatch = realCoasList.find(c => 
        activeTab === "simpanan" ? c.tipe === "LIABILITY" : c.tipe === "ASSET"
      );
      if (defaultMatch) {
        setSelectedCoa(defaultMatch.id);
      } else {
        setSelectedCoa(realCoasList[0].id);
      }
    }
    setShowGuardModal(true);
  };

  const handleSimpanProduk = async () => {
    if (!formProduk.nama || !formProduk.kode) {
      showModal("warning", "Gagal Menyimpan", "Harap lengkapi nama paket dan kode identifikasi produk terlebih dahulu.");
      return;
    }

    if (modalMode === "tambah") {
      if (activeTab === "simpanan") {
        let jenisEnum = "SUKARELA";
        const ket = formProduk.keterangan?.toUpperCase() || "";
        if (ket.includes("POKOK")) jenisEnum = "POKOK";
        else if (ket.includes("WAJIB")) jenisEnum = "WAJIB";
        else if (ket.includes("BERJANGKA") || ket.includes("DEPOSIT")) jenisEnum = "BERJANGKA";

        const res = await createProdukSimpananAction({
          namaProduk: formProduk.nama,
          jenis: jenisEnum as any,
          nisbahBagiHasil: Number(formProduk.bungaAtauMargin) || 0,
          setoranAwalMin: Number(formProduk.minimalAwal) || 0,
          coaId: selectedCoa,
        });
        if (res?.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Katalog Produk Berhasil Ditambahkan",
            `Produk simpanan baru "${formProduk.nama}" terikat mutlak pada Akun Buku Besar telah diamankan ke PostgreSQL riil.`
          );
          loadRealProducts();
        } else {
          showModal("warning", "Gagal Menyisipkan", res?.error || "Terjadi kendala penyimpanan ke pangkalan data.");
        }
      } else {
        const res = await createProdukPinjamanAction({
          namaProduk: formProduk.nama,
          marginBunga: Number(formProduk.bungaAtauMargin) || 0,
          plafonMax: Number(formProduk.minimalAwal) || 0,
          tenorMaxBulan: Number(formProduk.keterangan?.replace(/\D/g, "")) || 24,
          coaPiutangId: selectedCoa,
        });
        if (res?.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Katalog Produk Berhasil Ditambahkan",
            `Paket pembiayaan baru "${formProduk.nama}" terikat mutlak pada Pos Aset Piutang CoA telah diamankan ke PostgreSQL riil.`
          );
          loadRealProducts();
        } else {
          showModal("warning", "Gagal Menyisipkan", res?.error || "Terjadi kendala penyimpanan ke pangkalan data.");
        }
      }
    } else {
      // Alur Eksekusi Penyuntingan (Edit Mode) ke PostgreSQL Nyata
      if (activeTab === "simpanan") {
        const res = await updateProdukSimpananAction(selectedId, {
          namaProduk: formProduk.nama,
          nisbahBagiHasil: Number(formProduk.bungaAtauMargin) || 0,
          setoranAwalMin: Number(formProduk.minimalAwal) || 0,
        });
        if (res?.success) {
          setIsOpenModal(false);
          showModal("success", "Pembaruan Berhasil", `Produk simpanan "${formProduk.nama}" berhasil diperbarui di basis data PostgreSQL.`);
          loadRealProducts();
        } else {
          showModal("warning", "Gagal Memperbarui", res?.error || "Terjadi kendala saat memperbarui basis data.");
        }
      } else {
        const res = await updateProdukPinjamanAction(selectedId, {
          namaProduk: formProduk.nama,
          marginBunga: Number(formProduk.bungaAtauMargin) || 0,
          plafonMax: Number(formProduk.minimalAwal) || 0,
        });
        if (res?.success) {
          setIsOpenModal(false);
          showModal("success", "Pembaruan Berhasil", `Paket pembiayaan "${formProduk.nama}" berhasil diperbarui di basis data PostgreSQL.`);
          loadRealProducts();
        } else {
          showModal("warning", "Gagal Memperbarui", res?.error || "Terjadi kendala saat memperbarui basis data.");
        }
      }
    }
  };

  const handleHapusProduk = async (id: string, nama: string) => {
    if (activeTab === "simpanan") {
      const res = await deleteProdukSimpananAction(id);
      if (res?.success) {
        showModal("success", "Produk Dihapus", `Katalog produk simpanan "${nama}" berhasil dihapus permanen dari PostgreSQL.`);
        loadRealProducts();
      } else {
        showModal("warning", "Gagal Menghapus", res?.error || "Produk tidak dapat dihapus karena memiliki keterkaitan data.");
      }
    } else {
      const res = await deleteProdukPinjamanAction(id);
      if (res?.success) {
        showModal("success", "Produk Dihapus", `Katalog paket pembiayaan "${nama}" berhasil dihapus permanen dari PostgreSQL.`);
        loadRealProducts();
      } else {
        showModal("warning", "Gagal Menghapus", res?.error || "Paket tidak dapat dihapus karena memiliki keterkaitan data.");
      }
    }
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
                  <TableHead className="th-standard">Pos Buku Besar</TableHead>
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
                    <TableCell className="text-xs font-mono font-medium text-slate-500 max-w-[150px] truncate" title={row.coaName}>
                      {row.coaName}
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
                  <TableHead className="th-standard">Pos Piutang CoA</TableHead>
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
                    <TableCell className="text-xs font-mono font-medium text-slate-500 max-w-[150px] truncate" title={row.coaName}>
                      {row.coaName}
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
            <Button size="sm" onClick={handleTriggerSimpan} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              {modalMode === "tambah" ? "Simpan Katalog" : "Perbarui Portofolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Proteksi Entri Ganda (Double-Entry Guard) ── */}
      <Dialog open={showGuardModal} onOpenChange={setShowGuardModal}>
        <DialogContent className="sm:max-w-[450px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Layers className="w-5 h-5 shrink-0" />
              <DialogTitle className="text-sm font-bold uppercase tracking-wider">Proteksi Entri Ganda (Double-Entry Guard)</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Setiap produk finansial wajib dikaitkan dengan pos <span className="font-bold text-slate-900">Akun Buku Besar (Chart of Accounts)</span> untuk menjamin otomatisasi jurnal Debit/Kredit yang seimbang saat transaksi berlangsung.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Nama Paket:</span>
                <span className="font-bold text-slate-900">{formProduk.nama || "-"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Kode Produk:</span>
                <span className="font-mono font-bold text-blue-600">{formProduk.kode || "-"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Parameter (% p.a):</span>
                <span className="font-mono font-bold text-slate-900">{formProduk.bungaAtauMargin || "0"}%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keterikatan Pos Buku Besar (COA)</label>
              <select 
                value={selectedCoa}
                onChange={(e) => setSelectedCoa(e.target.value)}
                className="w-full h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:border-blue-500"
              >
                {realCoasList.length > 0 ? (
                  realCoasList
                    .filter(c => activeTab === "simpanan" ? c.tipe !== "ASSET" : c.tipe === "ASSET")
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.kodeAkun} - {c.namaAkun} ({c.tipe})
                      </option>
                    ))
                ) : (
                  <option value="">Memuat pos akun peladen...</option>
                )}
              </select>
              <p className="text-[9px] text-slate-400 mt-1">Mengikat pos di atas menjamin kepatuhan ganda otomatis tanpa campur tangan pembukuan manual.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGuardModal(false)} className="text-xs h-8 font-semibold">
              Tinjau Ulang
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setShowGuardModal(false);
                handleSimpanProduk();
              }} 
              className="bg-amber-600 hover:bg-amber-700 text-xs text-white h-8 font-bold shadow-md"
            >
              Ya, Terapkan & Kaitkan COA
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
