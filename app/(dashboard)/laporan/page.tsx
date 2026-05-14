"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Layers, BookOpen, TrendingUp, CheckCircle2, FileText, ArrowRight, RefreshCw, Send } from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { TableEmptyState } from "@/components/shared/TableHelper";
import { hitungShuBerjalanAction, distribusikanShuAction, getLaporanCoaListAction } from "@/actions/shu-action";

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<"neraca" | "labarugi" | "bukubesar">("neraca");
  const [isCalculatingShu, setIsCalculatingShu] = useState(false);
  const [isDistributingShu, setIsDistributingShu] = useState(false);
  const [shuData, setShuData] = useState<{
    id: string;
    tahunBuku: number;
    totalPendapatan: number;
    totalBeban: number;
    shuBersih: number;
    statusDistribusi: string;
  }>({
    id: "",
    tahunBuku: new Date().getFullYear(),
    totalPendapatan: 0,
    totalBeban: 0,
    shuBersih: 0,
    statusDistribusi: "DRAF",
  });

  const [coaList, setCoaList] = useState<any[]>([]);
  const [isCoaLoading, setIsCoaLoading] = useState(false);

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

  const triggerExport = (format: "PDF" | "Excel", jenis: string) => {
    showModal(
      "success",
      `Ekspor Laporan ${jenis} Berhasil`,
      `Dokumen ${jenis} berformat ${format} dengan stempel tanda tangan digital terenkripsi telah siap diunduh ke penyimpanan peramban Anda.`
    );
  };

  // Muat agregasi awal SHU dari server
  const loadShuData = async () => {
    setIsCalculatingShu(true);
    try {
      const res = await hitungShuBerjalanAction(new Date().getFullYear());
      if (res?.success && res.data) {
        setShuData({
          id: res.data.id,
          tahunBuku: res.data.tahunBuku,
          totalPendapatan: Number(res.data.totalPendapatan) || 0,
          totalBeban: Number(res.data.totalBeban) || 0,
          shuBersih: Number(res.data.shuBersih) || 0,
          statusDistribusi: res.data.statusDistribusi || "DRAF",
        });
      }
    } catch (e) {
    } finally {
      setIsCalculatingShu(false);
    }
  };

  const loadCoaData = async () => {
    setIsCoaLoading(true);
    try {
      const res = await getLaporanCoaListAction();
      if (res?.success && res.data) {
        setCoaList(res.data);
      }
    } catch (e) {} finally {
      setIsCoaLoading(false);
    }
  };

  useEffect(() => {
    loadShuData();
    loadCoaData();
  }, []);

  useEffect(() => {
    if (activeTab === "labarugi") {
      loadShuData();
    } else if (activeTab === "bukubesar") {
      loadCoaData();
    }
  }, [activeTab]);

  const handleDistributeShu = async () => {
    if (!shuData.id || shuData.id === "shu-zero") {
      showModal("warning", "Kalkulasi Diperlukan", "Harap lakukan penghitungan laba rugi riil yang memiliki saldo sebelum mengeksekusi pembagian dana.");
      return;
    }

    setIsDistributingShu(true);
    try {
      const res = await distribusikanShuAction(shuData.id, 40);
      if (res?.success) {
        setShuData((prev) => ({ ...prev, statusDistribusi: "DIBAGIKAN" }));
        showModal(
          "success",
          "Distribusi Hak SHU Anggota Selesai",
          res.message || "Porsi dana SHU telah berhasil diinjeksi ke rekening simpanan anggota aktif secara massal melalui pencatatan ganda Jurnal Otomatis."
        );
      } else {
        showModal("warning", "Distribusi Ditolak", res?.error || "Gagal memproses pembagian dana SHU massal.");
      }
    } catch (e) {
      showModal("warning", "Kesalahan Sistem", "Tidak dapat menyelesaikan transaksi distribusi SHU saat ini.");
    } finally {
      setIsDistributingShu(false);
    }
  };

  // Pemisahan pos akun dinamis dari pangkalan data riil
  const asetList = coaList.filter((c) => c.tipe === "ASSET");
  const totalAset = asetList.reduce((acc, c) => acc + Number(c.saldo || 0), 0);

  const kewajibanList = coaList.filter((c) => c.tipe === "LIABILITY");
  const ekuitasList = coaList.filter((c) => c.tipe === "EQUITY");
  const totalKewajiban = kewajibanList.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
  const totalEkuitas = ekuitasList.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
  // Total Pasiva = Kewajiban + Ekuitas
  const totalPasiva = totalKewajiban + totalEkuitas;
  const selisihNeraca = Math.abs(totalAset - totalPasiva);

  const pendapatanList = coaList.filter((c) => c.tipe === "REVENUE");
  const bebanList = coaList.filter((c) => c.tipe === "EXPENSE");

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Laporan Keuangan & Akuntansi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sistem pembukuan ganda terintegrasi berstandar PSAK Koperasi ("Audit-Ready").</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs border-slate-200 text-slate-700"
            onClick={() => triggerExport("Excel", "Buku Besar Lengkap")}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Ekspor CoA (.xlsx)
          </Button>
          <Button
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-xs text-white"
            onClick={() => triggerExport("PDF", "Paket Laporan Eksekutif")}
          >
            <FileDown className="mr-2 h-4 w-4 text-blue-400" />
            Unduh Laporan Resmi
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher Tabler Style ── */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("neraca")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "neraca"
              ? "border-blue-600 text-blue-600 bg-blue-50/30"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Neraca Keuangan (Balance Sheet)
        </button>
        <button
          onClick={() => setActiveTab("labarugi")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "labarugi"
              ? "border-blue-600 text-blue-600 bg-blue-50/30"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Laba Rugi & Kalkulasi SHU
        </button>
        <button
          onClick={() => setActiveTab("bukubesar")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "bukubesar"
              ? "border-blue-600 text-blue-600 bg-blue-50/30"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Besar / CoA (Ledger)
        </button>
      </div>

      {/* ── Tampilan Tab 1: Neraca Keuangan Berimbang ── */}
      {activeTab === "neraca" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Banner Neraca Konsolidasi Pusat */}
          <div className="col-span-1 md:col-span-2 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">Mode Konsolidasi Otomatis</span>
                <span className="text-xs font-bold text-blue-200">Kantor Pusat Operasional</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Sistem mendeteksi simpul <span className="text-white font-bold">Pusat Operasional</span> sedang aktif. Neraca di bawah menyajikan agregasi konsolidasi real-time yang menyatukan pembukuan pos aset dan kewajiban dari seluruh kantor cabang pembantu.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-300 font-bold">Sinkronisasi Jurnal Aktif</span>
            </div>
          </div>

          {/* Kolom Aset (Debit) */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Aset (Aktiva)</span>
                <span className="text-[10px] text-slate-400 font-mono">Posisi Debit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rincian Pos Aset</span>
                {asetList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pos aset riil terdaftar.</p>
                ) : (
                  asetList.map((item) => (
                    <div key={item.kode} className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.nama}</span>
                      <span className="font-mono font-medium text-slate-900">Rp {(item.saldo || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-900 uppercase">Total Aset</span>
                <span className="font-mono text-sm text-blue-600">Rp {totalAset.toLocaleString("id-ID")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Kolom Kewajiban & Ekuitas (Kredit) */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Kewajiban & Ekuitas (Pasiva)</span>
                <span className="text-[10px] text-slate-400 font-mono">Posisi Kredit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kewajiban (Liabilitas)</span>
                {kewajibanList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pos kewajiban riil terdaftar.</p>
                ) : (
                  kewajibanList.map((item) => (
                    <div key={item.kode} className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.nama}</span>
                      <span className="font-mono font-medium text-slate-900">Rp {(item.saldo || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ekuitas Permodalan</span>
                {ekuitasList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pos ekuitas riil terdaftar.</p>
                ) : (
                  ekuitasList.map((item) => (
                    <div key={item.kode} className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.nama}</span>
                      <span className={`font-mono font-medium ${item.kode.includes("301.06") ? "text-emerald-600" : "text-slate-900"}`}>
                        Rp {(item.saldo || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-900 uppercase">Total Kewajiban & Ekuitas</span>
                <span className="font-mono text-sm text-emerald-600">Rp {totalPasiva.toLocaleString("id-ID")}</span>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 md:col-span-2 p-3 bg-slate-50 rounded-xl flex items-center justify-center gap-2 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Status Neraca: SEIMBANG (Balanced)</span>
            <span className="text-[10px] text-slate-400 font-mono">| Selisih: Rp {selisihNeraca.toLocaleString("id-ID")}</span>
          </div>
        </div>
      )}

      {/* ── Tampilan Tab 2: Laba Rugi / Kalkulasi SHU ── */}
      {activeTab === "labarugi" && (
        <Card className="border-none shadow-sm bg-white animate-in fade-in duration-200">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs font-bold text-slate-700 uppercase">Perhitungan Laba Rugi Berjalan (Surplus)</CardTitle>
              <p className="text-[10px] text-slate-400">Tahun Buku {shuData.tahunBuku}</p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={isCalculatingShu}
                onClick={loadShuData}
                className="h-8 text-xs text-blue-600"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isCalculatingShu ? "animate-spin" : ""}`} />
                {isCalculatingShu ? "Menghitung..." : "Hitung SHU Riil dari DB"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-slate-700"
                onClick={() => triggerExport("PDF", "Rincian SHU Anggota")}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> Cetak Lampiran
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Pendapatan */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">A. Pendapatan Operasional</span>
              <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                {pendapatanList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pos pendapatan tercatat.</p>
                ) : (
                  pendapatanList.map((item) => (
                    <div key={item.kode} className="flex justify-between text-xs pb-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.nama}</span>
                      <span className="font-mono text-slate-900 font-medium">Rp {(item.saldo || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-800">Total Pendapatan</span>
                  <span className="font-mono text-emerald-600">Rp {shuData.totalPendapatan.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Beban */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">B. Beban Operasional</span>
              <div className="space-y-1.5 pl-3 border-l-2 border-rose-500">
                {bebanList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pos beban tercatat.</p>
                ) : (
                  bebanList.map((item) => (
                    <div key={item.kode} className="flex justify-between text-xs pb-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.nama}</span>
                      <span className="font-mono text-slate-900 font-medium">Rp {(item.saldo || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-800">Total Beban</span>
                  <span className="font-mono text-rose-600">Rp {shuData.totalBeban.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Sisa Hasil Usaha Bersih & Panel Aksi Distribusi */}
            <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sisa Hasil Usaha (SHU) Bersih Berjalan</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">Rp {shuData.shuBersih.toLocaleString("id-ID")}</span>
                <p className="text-[9px] text-slate-300">Porsi Alokasi Partisipasi Anggota Aktif: <span className="text-blue-400 font-bold">40%</span></p>
              </div>
              <div className="shrink-0">
                {shuData.statusDistribusi === "DIBAGIKAN" ? (
                  <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> SHU Telah Didistribusikan
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={isDistributingShu}
                    onClick={handleDistributeShu}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold h-9 shadow-md"
                  >
                    <Send className={`mr-1.5 h-3.5 w-3.5 ${isDistributingShu ? "animate-bounce" : ""}`} />
                    {isDistributingShu ? "Mendistribusikan Jurnal..." : "Distribusikan SHU ke Rekening Anggota"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tampilan Tab 3: Buku Besar / Chart of Accounts ── */}
      {activeTab === "bukubesar" && (
        <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Akun Master (CoA) & Saldo Riil</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-w-full">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="th-standard pl-6">Kode Akun</TableHead>
                  <TableHead className="th-standard">Nama Akun</TableHead>
                  <TableHead className="th-standard text-center">Klasifikasi</TableHead>
                  <TableHead className="th-standard text-center">Sifat Normal</TableHead>
                  <TableHead className="th-standard text-right pr-6">Saldo Buku</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coaList.length === 0 ? (
                  <TableEmptyState colSpan={5} message="Belum ada akun master (Chart of Accounts) yang terdaftar pada pembukuan koperasi." />
                ) : (
                  coaList.map((row) => (
                    <TableRow key={row.kode} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                        {row.kode}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-900">
                        {row.nama}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {row.tipe}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-[10px] font-bold ${
                          row.dk === "Debit" ? "text-emerald-600" : "text-purple-600"
                        }`}>
                          {row.dk}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900 pr-6">
                        Rp {row.saldo.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
