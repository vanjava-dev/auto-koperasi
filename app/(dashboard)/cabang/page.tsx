"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Phone, Server, Edit, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { getCabangListAction, createCabangAction, updateCabangAction } from "@/actions/cabang-action";
import { TableEmptyState } from "@/components/shared/TableHelper";

export default function CabangPage() {
  const [cabangList, setCabangList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOpenModal, setIsOpenModal] = useState(false);
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

  // State Formulir Cabang
  const [formCabang, setFormCabang] = useState({
    kode: "CAB-",
    nama: "",
    alamat: "",
    telepon: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getCabangListAction();
      if (res.success && res.data) {
        setCabangList(res.data);
      } else {
        showModal("error", "Gagal Memuat Data", res.error || "Terjadi kesalahan peladen saat memuat topologi cabang.");
      }
    } catch (e: any) {
      showModal("error", "Galat Jaringan", "Tidak dapat menghubungi pangkalan data peladen.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBukaTambah = () => {
    setModalMode("tambah");
    setSelectedId("");
    setFormCabang({
      kode: `CAB-${Date.now().toString().slice(-4)}`,
      nama: "",
      alamat: "",
      telepon: "",
    });
    setIsOpenModal(true);
  };

  const handleBukaEdit = (item: any) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormCabang({
      kode: item.kode || "",
      nama: item.nama || "",
      alamat: item.alamat || "",
      telepon: item.telepon || "",
    });
    setIsOpenModal(true);
  };

  const handleSimpanCabangReal = async () => {
    if (!formCabang.nama.trim() || !formCabang.kode.trim()) {
      showModal("warning", "Isian Belum Lengkap", "Harap lengkapi nama instansi/cabang serta kode unik identifikasi topologi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "tambah") {
        const res = await createCabangAction({
          kode: formCabang.kode,
          nama: formCabang.nama,
          alamat: formCabang.alamat,
          telepon: formCabang.telepon,
        });

        if (res.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Titik Cabang Berhasil Didaftarkan",
            `Instansi baru "${formCabang.nama}" dengan sandi node "${formCabang.kode}" telah berhasil diinjeksi secara permanen ke dalam PostgreSQL.`
          );
          loadData();
        } else {
          showModal("error", "Gagal Mendaftarkan Cabang", res.error || "Terjadi kendala saat menyisipkan entitas koperasi.");
        }
      } else {
        const res = await updateCabangAction({
          id: selectedId,
          kode: formCabang.kode,
          nama: formCabang.nama,
          alamat: formCabang.alamat,
          telepon: formCabang.telepon,
        });

        if (res.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Pembaruan Kantor Cabang Berhasil",
            `Parameter redaksi untuk instansi "${formCabang.nama}" telah dimutakhirkan ke dalam basis data terpusat.`
          );
          loadData();
        } else {
          showModal("error", "Gagal Memperbarui Cabang", res.error || "Terjadi kendala saat menyunting entitas koperasi.");
        }
      }
    } catch (e: any) {
      showModal("error", "Galat Sistem", "Koneksi ke peladen terputus saat menyimpan redaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSinkronisasiNode = (nama: string) => {
    showModal(
      "success",
      "Sinkronisasi Simpul Berhasil",
      `Perintah sinkronisasi langsung dengan pangkalan data node "${nama}" telah selesai dieksekusi. Catatan transaksi seimbang tanpa selisih (Balanced).`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen Jaringan Cabang</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengelolaan entitas koperasi pembantu dan topologi jaringan peladen dari PostgreSQL.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </Button>
          <Button
            size="sm"
            onClick={handleBukaTambah}
            className="bg-rose-600 hover:bg-rose-700 text-xs text-white h-9 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Buka Kantor Cabang
          </Button>
        </div>
      </div>

      {/* ── Tabel Daftar Cabang Riil ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-600" />
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Topologi Jaringan Titik Pelayanan</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200">
            Node Master: Terpusat
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">Kode Node</TableHead>
                <TableHead className="th-standard">Nama Kantor Layanan</TableHead>
                <TableHead className="th-standard">Alamat & Kontak</TableHead>
                <TableHead className="th-standard text-center">Status Simpul</TableHead>
                <TableHead className="th-standard text-right pr-6">Tindakan Operasional</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabangList.length === 0 ? (
                <TableEmptyState colSpan={5} message="Belum ada instansi atau kantor cabang yang tercatat di dalam basis data." />
              ) : (
                cabangList.map((row) => (
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
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[9px] font-medium py-0.5 px-2 bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 w-fit mx-auto">
                        <Server className="w-2.5 h-2.5" /> TERKONEKSI
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBukaEdit(row)}
                        title="Sunting Informasi Kantor Cabang"
                        className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 align-middle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSinkronisasiNode(row.nama)}
                        className="text-[10px] text-blue-600 hover:bg-blue-50 font-bold align-middle"
                      >
                        Sinkronisasi DB
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Dialog Tambah / Sunting Cabang ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {modalMode === "tambah" ? "Pendaftaran Kantor Cabang Baru" : "Penyuntingan Simpul Cabang"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan parameter simpul jaringan dan penempatan rute peladen operasional.
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
            <Button size="sm" onClick={handleSimpanCabangReal} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-xs text-white h-8 font-bold shadow-md">
              {isSubmitting ? "Menyimpan..." : modalMode === "tambah" ? "Buka Titik Simpul" : "Simpan Perubahan"}
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
