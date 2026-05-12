"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, CreditCard, ArrowUpRight, CheckCircle2, AlertTriangle, Eye, ShieldAlert, FileCheck2, Cpu, ArrowDownToLine } from "lucide-react";
import { TablePagination, TableEmptyState } from "@/components/shared/TableHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { analyzeCreditScoreAction } from "@/actions/credit-score-bridge";

export default function PinjamanPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<string>("SEMUA");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isScoringLoading, setIsScoringLoading] = useState(false);
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Form pengajuan pinjaman
  const [loanForm, setLoanForm] = useState({
    memberId: "M-001",
    memberName: "Budi Santoso",
    loanAmount: "15000000",
    tenorMonths: "24",
    monthlyIncome: "8500000",
    totalObligations: "1200000",
    collateralValue: "25000000",
    loanPurpose: "Modal Pengembangan Usaha Mikro",
  });

  // Senarai kontrak pinjaman berjalan dinamis
  const [loanList, setLoanList] = useState([
    { id: "LOAN-001", noKontrak: "PF-2024-0001", name: "Budi Santoso", amount: 15000000, outstanding: 8500000, tenor: "24 Bulan", status: "LANCAR", riskGrade: "A", isCair: true },
    { id: "LOAN-002", noKontrak: "PF-2024-0002", name: "Siti Aminah", amount: 5000000, outstanding: 1200000, tenor: "12 Bulan", status: "LANCAR", riskGrade: "A", isCair: true },
    { id: "LOAN-003", noKontrak: "PF-2024-0003", name: "Ahmad Dahlan", amount: 25000000, outstanding: 25000000, tenor: "36 Bulan", status: "DPK", riskGrade: "B", isCair: true },
    { id: "LOAN-004", noKontrak: "PF-2024-0004", name: "Dewi Lestari", amount: 10000000, outstanding: 9500000, tenor: "18 Bulan", status: "LANCAR", riskGrade: "A", isCair: true },
    { id: "LOAN-005", noKontrak: "PF-2024-0005", name: "Rina Nose", amount: 7500000, outstanding: 7500000, tenor: "12 Bulan", status: "MACET", riskGrade: "D", isCair: true },
  ]);

  const filteredList = loanList.filter(
    (item) => (selectedFilter === "SEMUA" || item.status.toUpperCase() === selectedFilter) &&
              (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.noKontrak.includes(searchQuery))
  );

  const handleLiveCreditScore = async () => {
    setIsScoringLoading(true);
    setScoringResult(null);

    try {
      const res = await analyzeCreditScoreAction({
        memberId: loanForm.memberId,
        monthlyIncome: Number(loanForm.monthlyIncome) || 0,
        totalObligations: Number(loanForm.totalObligations) || 0,
        collateralValue: Number(loanForm.collateralValue) || 0,
        loanAmount: Number(loanForm.loanAmount) || 0,
      });

      setScoringResult(res);
    } catch (e) {
      showModal("warning", "Gangguan AI Engine", "Gagal menghubungi mesin kalkulasi risiko kredit.");
    } finally {
      setIsScoringLoading(false);
    }
  };

  const handleSubmitPengajuan = () => {
    if (!scoringResult) {
      showModal("warning", "Analisis Diperlukan", "Harap lakukan analisis kelayakan (AI Credit Scoring) terlebih dahulu sebelum mengajukan persetujuan kontrak.");
      return;
    }

    const newLoan = {
      id: `LOAN-00${loanList.length + 1}`,
      noKontrak: `PF-2026-000${loanList.length + 1}`,
      name: loanForm.memberName,
      amount: Number(loanForm.loanAmount) || 0,
      outstanding: Number(loanForm.loanAmount) || 0,
      tenor: `${loanForm.tenorMonths} Bulan`,
      status: "LANCAR",
      riskGrade: scoringResult.grade,
      isCair: false, // Menunggu aksi pencairan kasir
    };

    setLoanList([newLoan, ...loanList]);
    setIsOpenModal(false);

    showModal(
      "success",
      "Pengajuan Pembiayaan Berhasil Diajukan",
      `Kontrak pembiayaan ${newLoan.noKontrak} atas nama ${newLoan.name} dengan plafon Rp ${newLoan.amount.toLocaleString("id-ID")} telah dikirim ke antrean dengan Risk Grade ${newLoan.riskGrade}. Sisa dana akan disalurkan saat tombol Pencairan ditekan.`
    );
  };

  const handleLihatJadwal = (row: any) => {
    const angsuranPokok = Math.round(row.outstanding / parseInt(row.tenor));
    const marginBulanan = Math.round((row.amount * 0.12) / parseInt(row.tenor));
    showModal(
      "success",
      `Rincian Pembiayaan: ${row.noKontrak}`,
      `Debitur: ${row.name}\nPlafon: Rp ${row.amount.toLocaleString("id-ID")}\nOutstanding: Rp ${row.outstanding.toLocaleString("id-ID")}\nTenor: ${row.tenor}\nRisk Grade: ${row.riskGrade}\n\nEstimasi Kewajiban Per Bulan:\n• Pokok Angsuran: Rp ${angsuranPokok.toLocaleString("id-ID")}\n• Imbal Jasa / Margin: Rp ${marginBulanan.toLocaleString("id-ID")}\n• Total Setoran: Rp ${(angsuranPokok + marginBulanan).toLocaleString("id-ID")}`
    );
  };

  const handlePencairan = (id: string) => {
    setLoanList(prev => prev.map(item => item.id === id ? { ...item, isCair: true } : item));
    showModal(
      "success",
      "Pencairan Dana Berhasil Dieksekusi",
      "Dana pembiayaan telah berhasil dipindahbukukan ke rekening tabungan debitur bersangkutan melalui otorisasi jurnal ganda otomatis (Kredit Akun Bank/Kas, Debet Piutang Pembiayaan)."
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen Pembiayaan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pemantauan portofolio pinjaman terintegrasi dengan mesin AI Credit Scoring 5C.</p>
        </div>
        <Button
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white shadow-md"
          onClick={() => {
            setIsOpenModal(true);
            setScoringResult(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Pengajuan Pembiayaan Baru
        </Button>
      </div>

      {/* ── Grid Kartu Ringkasan Portofolio ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Plafon Aktif</CardTitle>
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp 62.500.000</div>
            <p className="text-[10px] text-slate-400 mt-1">Akumulasi kontrak berjalan</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Sisa Outstanding</CardTitle>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">Rp 51.700.000</div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Pokok pinjaman belum lunas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Rasio NPL (Kredit Macet)</CardTitle>
            <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">3.4%</div>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Batas aman standar OJK (&lt;5%)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Kontrak Diawasi (DPK)</CardTitle>
            <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">1 Kontrak</div>
            <p className="text-[10px] text-purple-600 font-medium mt-1">Dalam Perhatian Khusus</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Kontainer Utama Filter & Tabel ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor kontrak / debitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Deretan Filter Tab Tabler Style */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 self-start sm:self-auto">
            {["SEMUA", "LANCAR", "DPK", "MACET"].map((tab) => (
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
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">No. Kontrak</TableHead>
                <TableHead className="th-standard">Nama Debitur</TableHead>
                <TableHead className="th-standard">Plafon Pinjaman</TableHead>
                <TableHead className="th-standard text-right">Sisa Outstanding</TableHead>
                <TableHead className="th-standard text-center">Tenor</TableHead>
                <TableHead className="th-standard text-center">Risk Grade</TableHead>
                <TableHead className="th-standard text-center">Kolektibilitas</TableHead>
                <TableHead className="th-standard text-right pr-6">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableEmptyState colSpan={8} message="Tidak ditemukan kontrak pinjaman pada status ini." />
              ) : (
                filteredList.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                      {row.noKontrak}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">
                      {row.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      Rp {row.amount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      Rp {row.outstanding.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500 font-medium">
                      {row.tenor}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono font-bold text-[10px] ${
                        row.riskGrade === "A" ? "bg-emerald-100 text-emerald-700" :
                        row.riskGrade === "B" ? "bg-blue-100 text-blue-700" :
                        row.riskGrade === "C" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {row.riskGrade}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-medium py-0.5 px-2 ${
                          row.status === "LANCAR" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          row.status === "DPK" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    {/* Tombol aksi baris tabel */}
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLihatJadwal(row)}
                        title="Lihat Rincian & Angsuran"
                        className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {!row.isCair && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePencairan(row.id)}
                          title="Cairkan Plafon ke Rekening"
                          className="w-7 h-7 text-amber-500 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </Button>
                      )}
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
          entriesPerPage={5}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* ── Dialog Pengajuan Pembiayaan & AI Credit Scoring ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[520px] p-6 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Pengajuan Pembiayaan & Analisis 5C</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi parameter kelayakan finansial untuk memicu kalkulasi skor kredit cerdas secara instan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Debitur</label>
                <select
                  value={loanForm.memberName}
                  onChange={(e) => setLoanForm({ ...loanForm, memberName: e.target.value })}
                  className="w-full h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                >
                  <option value="Budi Santoso">Budi Santoso</option>
                  <option value="Siti Aminah">Siti Aminah</option>
                  <option value="Ahmad Dahlan">Ahmad Dahlan</option>
                  <option value="Rina Nose">Rina Nose</option>
                  <option value="Dewi Lestari">Dewi Lestari</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tenor Angsuran</label>
                <select
                  value={loanForm.tenorMonths}
                  onChange={(e) => setLoanForm({ ...loanForm, tenorMonths: e.target.value })}
                  className="w-full h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                >
                  <option value="12">12 Bulan</option>
                  <option value="18">18 Bulan</option>
                  <option value="24">24 Bulan</option>
                  <option value="36">36 Bulan</option>
                  <option value="48">48 Bulan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plafon Pinjaman (Rp)</label>
              <input
                type="text"
                value={loanForm.loanAmount}
                onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Penghasilan Bulanan (Rp)</label>
                <input
                  type="text"
                  value={loanForm.monthlyIncome}
                  onChange={(e) => setLoanForm({ ...loanForm, monthlyIncome: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono rounded border border-slate-200 text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Total Tanggungan/Cicilan (Rp)</label>
                <input
                  type="text"
                  value={loanForm.totalObligations}
                  onChange={(e) => setLoanForm({ ...loanForm, totalObligations: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono rounded border border-slate-200 text-slate-900 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Estimasi Nilai Jaminan / Aset (Rp)</label>
                <input
                  type="text"
                  value={loanForm.collateralValue}
                  onChange={(e) => setLoanForm({ ...loanForm, collateralValue: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono rounded border border-slate-200 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tujuan Pembiayaan</label>
              <input
                type="text"
                value={loanForm.loanPurpose}
                onChange={(e) => setLoanForm({ ...loanForm, loanPurpose: e.target.value })}
                className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-900"
              />
            </div>

            {/* Tombol Pemicu & Area Hasil AI Credit Scoring */}
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isScoringLoading}
                onClick={handleLiveCreditScore}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 flex items-center justify-center gap-1.5 font-bold"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                {isScoringLoading ? "Menghitung Bobot 5C..." : "Analisis Kelayakan Kredit (AI Scoring)"}
              </Button>
            </div>

            {scoringResult && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Skor Kredit AI: <span className="text-blue-600 font-mono">{scoringResult.score}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    scoringResult.grade === "A" ? "bg-emerald-500 text-white" :
                    scoringResult.grade === "B" ? "bg-blue-500 text-white" :
                    scoringResult.grade === "C" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                  }`}>
                    Grade {scoringResult.grade} - {scoringResult.recommendation}
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-blue-50 space-y-0.5">
                  <p className="font-bold text-slate-700">Catatan Analisis Mesin:</p>
                  {scoringResult.reasons?.map((res: string, idx: number) => (
                    <p key={idx} className="text-[9px] font-medium">• {res}</p>
                  ))}
                  <p className="text-[9px] text-emerald-600 font-bold pt-1">
                    Rekomendasi Plafon Layak: Rp {scoringResult.max_pinjaman?.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSubmitPengajuan} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              Ajukan Pembiayaan
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
