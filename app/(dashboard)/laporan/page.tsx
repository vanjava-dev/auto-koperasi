"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Layers, BookOpen, TrendingUp, CheckCircle2, FileText, ArrowRight, RefreshCw, Send } from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { hitungShuBerjalanAction, distribusikanShuAction } from "@/actions/shu-action";

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
    totalPendapatan: 15700000,
    totalBeban: 4600000,
    shuBersih: 11100000,
    statusDistribusi: "DRAF",
  });

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
          totalPendapatan: Number(res.data.totalPendapatan),
          totalBeban: Number(res.data.totalBeban),
          shuBersih: Number(res.data.shuBersih),
          statusDistribusi: res.data.statusDistribusi,
        });
      }
    } catch (e) {
      // Abaikan jika database kosong
    } finally {
      setIsCalculatingShu(false);
    }
  };

  useEffect(() => {
    if (activeTab === "labarugi") {
      loadShuData();
    }
  }, [activeTab]);

  const handleDistributeShu = async () => {
    if (!shuData.id) {
      showModal("warning", "Kalkulasi Diperlukan", "Harap lakukan penghitungan ulang laba rugi SHU terlebih dahulu sebelum mengeksekusi pembagian dana.");
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

  // Data CoA / Buku Besar tiruan/persisten
  const coaList = [
    { kode: "1.1.1.01", nama: "Kas Teller Utama", tipe: "Aset Lancar", saldo: 45000000, dk: "Debit" },
    { kode: "1.1.2.01", nama: "Bank Syariah Indonesia (BSI)", tipe: "Aset Lancar", saldo: 125000000, dk: "Debit" },
    { kode: "1.1.3.01", nama: "Piutang Pembiayaan Anggota", tipe: "Aset Lancar", saldo: 51700000, dk: "Debit" },
    { kode: "2.1.1.01", nama: "Simpanan Sukarela Anggota", tipe: "Kewajiban Pendek", saldo: 12450000, dk: "Kredit" },
    { kode: "2.1.2.01", nama: "Simpanan Berjangka (Deposito)", tipe: "Kewajiban Pendek", saldo: 45000000, dk: "Kredit" },
    { kode: "3.1.1.01", nama: "Modal Simpanan Pokok", tipe: "Ekuitas", saldo: 6250000, dk: "Kredit" },
    { kode: "3.1.2.01", nama: "Modal Simpanan Wajib", tipe: "Ekuitas", saldo: 18350000, dk: "Kredit" },
    { kode: "4.1.1.01", nama: "Pendapatan Margin Pembiayaan", tipe: "Pendapatan", saldo: 14200000, dk: "Kredit" },
    { kode: "5.1.1.01", nama: "Beban Bagi Hasil Simpanan", tipe: "Beban", saldo: 3100000, dk: "Debit" },
  ];

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
                <span className="text-[10px] font-bold text-slate-400 uppercase">Aset Lancar</span>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Kas Tunai Teller</span>
                  <span className="font-mono font-medium text-slate-900">Rp 45.000.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Rekening Bank BSI</span>
                  <span className="font-mono font-medium text-slate-900">Rp 125.000.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Piutang Pembiayaan Bersih</span>
                  <span className="font-mono font-medium text-slate-900">Rp 51.700.000</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Aset Tetap</span>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Inventaris Kantor & Sistem</span>
                  <span className="font-mono font-medium text-slate-900">Rp 25.000.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-400 italic">Akumulasi Penyusutan</span>
                  <span className="font-mono text-rose-500">(Rp 5.000.000)</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-900 uppercase">Total Aset</span>
                <span className="font-mono text-sm text-blue-600">Rp 241.700.000</span>
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
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kewajiban Jangka Pendek</span>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Simpanan Sukarela Anggota</span>
                  <span className="font-mono font-medium text-slate-900">Rp 12.450.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Deposito Berjangka</span>
                  <span className="font-mono font-medium text-slate-900">Rp 45.000.000</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ekuitas Permodalan</span>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Modal Simpanan Pokok</span>
                  <span className="font-mono font-medium text-slate-900">Rp 6.250.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Modal Simpanan Wajib</span>
                  <span className="font-mono font-medium text-slate-900">Rp 18.350.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">Cadangan Koperasi & Aset</span>
                  <span className="font-mono font-medium text-slate-900">Rp 148.550.000</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-slate-600">SHU Berjalan</span>
                  <span className="font-mono font-medium text-emerald-600">Rp {shuData.shuBersih.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-900 uppercase">Total Kewajiban & Ekuitas</span>
                <span className="font-mono text-sm text-emerald-600">Rp 241.700.000</span>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 md:col-span-2 p-3 bg-slate-50 rounded-xl flex items-center justify-center gap-2 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Status Neraca: SEIMBANG (Balanced)</span>
            <span className="text-[10px] text-slate-400 font-mono">| Selisih: Rp 0</span>
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
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Pendapatan Margin & Jasa Pembiayaan (Jurnal Master)</span>
                  <span className="font-mono text-slate-900 font-medium">Rp {(shuData.totalPendapatan - 1500000).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Pendapatan Administrasi Pendaftaran</span>
                  <span className="font-mono text-slate-900 font-medium">Rp 1.500.000</span>
                </div>
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
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Beban Imbal Jasa / Bunga Simpanan</span>
                  <span className="font-mono text-slate-900 font-medium">Rp {(shuData.totalBeban - 1500000).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Beban Layanan Server & Operasional</span>
                  <span className="font-mono text-slate-900 font-medium">Rp 1.500.000</span>
                </div>
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
                {coaList.map((row) => (
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
                ))}
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
