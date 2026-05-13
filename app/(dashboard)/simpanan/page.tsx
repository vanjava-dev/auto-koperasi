"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSimpananDashboardDataAction, createRekeningSimpananAction, createMutasiSimpananAction } from "@/actions/simpanan-action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, PiggyBank, ArrowUpRight, ArrowDownLeft, Eye, RefreshCw, Layers } from "lucide-react";
import { TablePagination, TableEmptyState } from "@/components/shared/TableHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function SimpananPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<string>("SEMUA");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isMutasiModal, setIsMutasiModal] = useState(false);
  const [selectedRekening, setSelectedRekening] = useState<any>(null);

  // State Feedback Modal
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

  // Form pembukaan rekening
  const [newRekeningForm, setNewRekeningForm] = useState({
    anggotaId: "",
    produkId: "",
    setoranAwal: "500000",
  });

  // State opsi dari peladen
  const [anggotaOpts, setAnggotaOpts] = useState<any[]>([]);
  const [produkOpts, setProdukOpts] = useState<any[]>([]);

  // Ringkasan metrik
  const [metricSummary, setMetricSummary] = useState({
    totalSukarela: 0,
    totalWajib: 0,
    totalDeposito: 0,
    totalPokok: 0,
  });

  // Data portofolio rekening simpanan riil
  const [rekeningList, setRekeningList] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      const res = await getSimpananDashboardDataAction();
      if (res?.success && res.data) {
        if (res.data.summary) {
          setMetricSummary({
            totalSukarela: res.data.summary.totalSukarela || 0,
            totalWajib: res.data.summary.totalWajib || 0,
            totalDeposito: res.data.summary.totalDeposito || 0,
            totalPokok: res.data.summary.totalPokok || 0,
          });
        }
        if (res.data.options) {
          setAnggotaOpts(res.data.options.anggotaOptions || []);
          setProdukOpts(res.data.options.produkOptions || []);
          if (res.data.options.anggotaOptions?.[0]) {
            setNewRekeningForm(prev => ({ ...prev, anggotaId: res.data.options.anggotaOptions[0].id }));
          }
          if (res.data.options.produkOptions?.[0]) {
            setNewRekeningForm(prev => ({ ...prev, produkId: res.data.options.produkOptions[0].id }));
          }
        }
        if (res.data.rekeningList && res.data.rekeningList.length > 0) {
          setRekeningList(res.data.rekeningList.map((r: any) => ({
            id: r.id,
            noRek: r.noRekening,
            name: r.anggota?.namaLengkap || "Tanpa Nama",
            type: r.produk?.namaProduk || "Simpanan Umum",
            produkJenis: r.produk?.jenis || "SUKARELA",
            balance: Number(r.saldo),
            status: r.status,
            lastTrx: r.mutasi?.[0] ? new Date(r.mutasi[0].createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Baru Dibuka",
          })));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredList = rekeningList.filter(
    (item) => selectedFilter === "SEMUA" || (item.produkJenis || item.type).toUpperCase().includes(selectedFilter)
  );

  const handleOpenRekening = async () => {
    if (!newRekeningForm.anggotaId || !newRekeningForm.produkId) {
      showModal("warning", "Pilihan Tidak Lengkap", "Harap pilih Anggota dan Produk Simpanan yang valid.");
      return;
    }

    const res = await createRekeningSimpananAction({
      anggotaId: newRekeningForm.anggotaId,
      produkId: newRekeningForm.produkId,
      setoranAwal: Number(newRekeningForm.setoranAwal) || 0,
    });

    if (res.success) {
      await loadDashboardData();
      setIsOpenModal(false);
      showModal(
        "success",
        "Rekening Berhasil Dibuka",
        `Buku tabungan baru telah diaktivasi secara persisten di database PostgreSQL. Pembukuan entri jurnal ganda otomatis disesuaikan.`
      );
    } else {
      showModal("warning", "Aktivasi Gagal", res.error || "Gagal membuka rekening baru.");
    }
  };

  const handleSimulasiMutasi = async (tipe: "setor" | "tarik", nominal: number) => {
    if (!selectedRekening) return;

    if (tipe === "tarik" && (selectedRekening.produkJenis === "POKOK" || selectedRekening.produkJenis === "WAJIB" || selectedRekening.type.includes("Pokok") || selectedRekening.type.includes("Wajib"))) {
      showModal("warning", "Akses Ditolak", "Saldo Simpanan Pokok dan Wajib tidak dapat ditarik selama keanggotaan masih aktif sesuai aturan Undang-Undang Koperasi.");
      setIsMutasiModal(false);
      return;
    }

    const res = await createMutasiSimpananAction({
      rekeningId: selectedRekening.id,
      jenis: tipe === "setor" ? "SETORAN" : "PENARIKAN",
      nominal,
    });

    if (res.success) {
      await loadDashboardData();
      setIsMutasiModal(false);
      showModal(
        "success",
        `Mutasi ${tipe === "setor" ? "Setoran" : "Penarikan"} Berhasil`,
        `Dana sebesar Rp ${nominal.toLocaleString("id-ID")} telah diproses pada database PostgreSQL rekening ${selectedRekening.noRek}. Log audit atomik telah disisipkan.`
      );
    } else {
      showModal("warning", "Transaksi Ditolak", res.error || "Gagal memproses transaksi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Portofolio Simpanan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manajemen buku tabungan, produk simpanan, dan pencatatan mutasi ganda.</p>
        </div>
        <Button
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white"
          onClick={() => setIsOpenModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Buka Rekening Simpanan
        </Button>
      </div>

      {/* ── Grid Kartu Ringkasan Portofolio ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Simpanan Sukarela</CardTitle>
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp {metricSummary.totalSukarela.toLocaleString("id-ID")}</div>
            <p className="text-[10px] text-slate-400 mt-1">Dapat ditarik kapan saja</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Simpanan Wajib</CardTitle>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp {metricSummary.totalWajib.toLocaleString("id-ID")}</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>Rutin bulanan</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Deposito Berjangka</CardTitle>
            <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp {metricSummary.totalDeposito.toLocaleString("id-ID")}</div>
            <p className="text-[10px] text-purple-600 font-medium mt-1">Bunga kompetitif 6.5% p.a</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Simpanan Pokok</CardTitle>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp {metricSummary.totalPokok.toLocaleString("id-ID")}</div>
            <p className="text-[10px] text-slate-400 mt-1">Kontribusi modal keanggotaan</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Kontainer Utama Filter & Tabel ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Pencarian */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pemilik rekening..."
              className="w-full h-8 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Deretan Filter Tab Tabler Style */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 self-start sm:self-auto">
            {["SEMUA", "SUKARELA", "WAJIB", "POKOK", "DEPOSITO"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  selectedFilter === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        {/* Tabel Portofolio dengan batas luapan horizontal wajib (SOP Mobile) */}
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">No. Rekening</TableHead>
                <TableHead className="th-standard">Nama Pemilik</TableHead>
                <TableHead className="th-standard">Produk Simpanan</TableHead>
                <TableHead className="th-standard">Trx Terakhir</TableHead>
                <TableHead className="th-standard text-center">Status</TableHead>
                <TableHead className="th-standard text-right pr-6">Saldo Buku</TableHead>
                <TableHead className="th-standard text-right pr-6">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableEmptyState colSpan={7} message="Tidak ditemukan rekening simpanan pada kategori ini." />
              ) : (
                filteredList.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-700">
                      {row.noRek}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 font-medium">{row.type}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {row.lastTrx}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-normal py-0.5 ${
                          row.status === "AKTIF"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    {/* Format angka/uang baku standar SOP */}
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900 pr-6">
                      Rp {row.balance.toLocaleString("id-ID")}
                    </TableCell>
                    {/* Tombol aksi baris tabel minimalis murni ikon (SOP 09 Poin 1) */}
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Mutasi Cepat"
                        onClick={() => {
                          setSelectedRekening(row);
                          setIsMutasiModal(true);
                        }}
                        className="w-7 h-7 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Lihat Buku Tabungan"
                        className="w-7 h-7 text-slate-500 hover:text-emerald-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={currentPage}
          totalPages={1}
          totalEntries={filteredList.length}
          entriesPerPage={6}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* ── Dialog Pembukaan Rekening Baru ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Buka Rekening Simpanan</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih keanggotaan dan produk simpanan untuk mengaktivasi buku tabungan baru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Anggota Pemilik</label>
              <select
                value={newRekeningForm.anggotaId}
                onChange={(e) => setNewRekeningForm({ ...newRekeningForm, anggotaId: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              >
                {anggotaOpts.map((ang) => (
                  <option key={ang.id} value={ang.id}>
                    {ang.namaLengkap} ({ang.nik})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pilihan Produk</label>
              <select
                value={newRekeningForm.produkId}
                onChange={(e) => setNewRekeningForm({ ...newRekeningForm, produkId: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              >
                {produkOpts.map((prd) => (
                  <option key={prd.id} value={prd.id}>
                    {prd.namaProduk} ({prd.jenis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Setoran Awal (Rp)</label>
              <input
                type="text"
                value={newRekeningForm.setoranAwal}
                onChange={(e) => setNewRekeningForm({ ...newRekeningForm, setoranAwal: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
              <p className="text-[9px] text-slate-400 mt-1">Otomatis membentuk pembukuan debit kas dan kredit kewajiban simpanan.</p>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8">
              Batal
            </Button>
            <Button size="sm" onClick={handleOpenRekening} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8">
              Aktivasi Rekening
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Simulasi Mutasi Cepat ── */}
      <Dialog open={isMutasiModal} onOpenChange={setIsMutasiModal}>
        <DialogContent className="sm:max-w-[380px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Simulasi Mutasi Rekening</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedRekening ? `Rek: ${selectedRekening.noRek} - ${selectedRekening.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 flex flex-col gap-2">
            <p className="text-xs text-slate-600 text-center bg-slate-50 p-2 rounded-lg font-mono">
              Saldo Saat Ini: Rp {selectedRekening?.balance.toLocaleString("id-ID")}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => handleSimulasiMutasi("setor", 500000)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center justify-center gap-1"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Setor 500rb
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSimulasiMutasi("tarik", 200000)}
                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-8 flex items-center justify-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Tarik 200rb
              </Button>
            </div>
          </div>
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
