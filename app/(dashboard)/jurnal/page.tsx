"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, RefreshCw, Plus, Trash2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination, TableEmptyState } from "@/components/shared/TableHelper";
import { getJurnalEntriesAction, createJurnalManualAction } from "@/actions/jurnal-action";
import { getCoaListAction } from "@/actions/coa-action";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { Dialog, DialogContent, DialogHeader as CustomDialogHeader, DialogTitle as CustomDialogTitle } from "@/components/ui/dialog";

/**
 * Halaman Jurnal Pembukuan Riil — Menyediakan penayangan riwayat posting secara 
 * default serta menampung modul entri Jurnal Manual/Penyesuaian ganda berbasis Modal.
 */
export default function JurnalPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [jurnalData, setJurnalData] = useState<any[]>([]);
  const [coaList, setCoaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const entriesPerPage = 10;

  // State Modal Posting Jurnal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Form Input Jurnal Manual / Penyesuaian
  const [keterangan, setKeterangan] = useState("");
  const [entries, setEntries] = useState<{ coaId: string; debit: number; kredit: number }[]>([
    { coaId: "", debit: 0, kredit: 0 },
    { coaId: "", debit: 0, kredit: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pengganti mutlak alert() menggunakan FeedbackModal sesuai SOP
  const [feedback, setFeedback] = useState<{ isOpen: boolean; type: FeedbackType; title: string; desc: string }>({
    isOpen: false,
    type: "success",
    title: "",
    desc: "",
  });

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [resJurnal, resCoa] = await Promise.all([
        getJurnalEntriesAction(),
        getCoaListAction(),
      ]);
      if (resJurnal?.success && resJurnal.data) {
        setJurnalData(resJurnal.data);
      }
      if (resCoa?.success && resCoa.data) {
        setCoaList(resCoa.data);
      }
    } catch (e) {} finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadInitialData();
  }, []);

  // Perhitungan sisi Debit & Kredit Form Manual
  const totalFormDebit = entries.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
  const totalFormKredit = entries.reduce((acc, curr) => acc + Number(curr.kredit || 0), 0);
  const selisihForm = Math.abs(totalFormDebit - totalFormKredit);

  const addRow = () => {
    setEntries([...entries, { coaId: "", debit: 0, kredit: 0 }]);
  };

  const removeRow = (index: number) => {
    if (entries.length <= 2) {
      setFeedback({
        isOpen: true,
        type: "warning",
        title: "Batas Minimal Baris",
        desc: "Sistem Double-Entry mewajibkan minimal dua baris akun berpasangan untuk menjaga keseimbangan.",
      });
      return;
    }
    setEntries(entries.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: "coaId" | "debit" | "kredit", value: any) => {
    const updated = [...entries];
    if (field === "debit") {
      updated[index].debit = Number(value) || 0;
      if (updated[index].debit > 0) updated[index].kredit = 0; // Nol-kan sisi berlawanan otomatis
    } else if (field === "kredit") {
      updated[index].kredit = Number(value) || 0;
      if (updated[index].kredit > 0) updated[index].debit = 0;
    } else {
      updated[index].coaId = value;
    }
    setEntries(updated);
  };

  const handlePostManual = async () => {
    if (!keterangan.trim()) {
      setFeedback({
        isOpen: true,
        type: "warning",
        title: "Keterangan Wajib Diisi",
        desc: "Keterangan transaksi jurnal umum wajib diisi sebagai dokumentasi jejak audit yang sah.",
      });
      return;
    }

    const invalidRow = entries.find(e => !e.coaId);
    if (invalidRow) {
      setFeedback({
        isOpen: true,
        type: "warning",
        title: "Pos Akun Belum Dipilih",
        desc: "Pastikan seluruh baris entri jurnal telah memilih pos akun master (CoA) yang relevan.",
      });
      return;
    }

    if (totalFormDebit <= 0 || selisihForm > 0.01) {
      setFeedback({
        isOpen: true,
        type: "warning",
        title: "Neraca Jurnal Tidak Seimbang",
        desc: "Total akumulasi sisi Debit dan Kredit harus berimbang (Balanced) serta bernominal di atas nol.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createJurnalManualAction({
        keterangan,
        entries,
      });

      if (res.success) {
        // Tutup modal secara mulus sebelum menayangkan umpan balik sukses
        setIsModalOpen(false);
        setFeedback({
          isOpen: true,
          type: "success",
          title: "Posting Jurnal Berhasil",
          desc: "Jurnal penyesuaian/manual ganda telah terposting secara permanen ke dalam basis data dan buku besar.",
        });
        setKeterangan("");
        setEntries([
          { coaId: "", debit: 0, kredit: 0 },
          { coaId: "", debit: 0, kredit: 0 },
        ]);
        // Muat ulang daftar transaksi di tabel
        const refreshed = await getJurnalEntriesAction();
        if (refreshed?.success && refreshed.data) {
          setJurnalData(refreshed.data);
        }
      } else {
        setFeedback({
          isOpen: true,
          type: "error",
          title: "Gagal Memposting Jurnal",
          desc: res.error || "Terjadi kesalahan internal peladen saat menyimpan catatan transaksi.",
        });
      }
    } catch (e) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Galat Jaringan",
        desc: "Tidak dapat menghubungi peladen pangkalan data saat ini.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hitung indeks halaman untuk riwayat
  const totalPages = Math.ceil(jurnalData.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = jurnalData.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Jurnal Umum & Akuntansi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Penayangan riwayat posting pembukuan riil dan pencatatan penyesuaian/koreksi ganda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Posting Jurnal Manual
          </Button>
          <Button variant="outline" size="sm" onClick={loadInitialData} disabled={isLoading} className="w-full sm:w-auto text-xs">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Memuat..." : "Sinkronisasi"}
          </Button>
          <Button size="sm" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-xs text-white">
            <Download className="mr-2 h-3.5 w-3.5" />
            Ekspor Buku Besar
          </Button>
        </div>
      </div>

      {/* ── Modal Dialog Posting Jurnal Manual (SOP Double-Entry Guard) ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 border-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col bg-white">
          {/* Bagian Header Modal */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-emerald-400" />
              <CustomDialogTitle className="text-xs font-bold uppercase tracking-wide text-white">
                Formulir Posting Jurnal Penyesuaian / Manual
              </CustomDialogTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Aturan Ganda (Debit = Kredit)</span>
          </div>

          {/* Bagian Konten/Isi Formulir yang dapat digulir */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Keterangan Transaksi / Bukti Audit</label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Koreksi penyesuaian beban penyusutan aset bulan Mei 2026..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase">Baris Bagan Akun (Debit / Kredit)</label>
                <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-[10px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Plus className="mr-1 h-3 w-3" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {entries.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                    
                    {/* Pemilihan Akun */}
                    <div className="w-full sm:flex-1">
                      <select
                        value={row.coaId}
                        onChange={(e) => updateRow(idx, "coaId", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="">-- Pilih Pos Akun Master (CoA) --</option>
                        {coaList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.kodeAkun} — {c.namaAkun} ({c.tipe})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nilai Debit */}
                    <div className="w-full sm:w-32 md:w-36">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block sm:hidden mb-0.5">Debit (Rp)</span>
                      <input
                        type="number"
                        min="0"
                        value={row.debit || ""}
                        onChange={(e) => updateRow(idx, "debit", e.target.value)}
                        placeholder="Debit"
                        className="w-full px-2 py-1.5 text-xs font-mono text-right font-bold text-slate-900 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:font-sans placeholder:font-normal"
                      />
                    </div>

                    {/* Nilai Kredit */}
                    <div className="w-full sm:w-32 md:w-36">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block sm:hidden mb-0.5">Kredit (Rp)</span>
                      <input
                        type="number"
                        min="0"
                        value={row.kredit || ""}
                        onChange={(e) => updateRow(idx, "kredit", e.target.value)}
                        placeholder="Kredit"
                        className="w-full px-2 py-1.5 text-xs font-mono text-right font-bold text-slate-900 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-rose-600 placeholder:font-sans placeholder:font-normal"
                      />
                    </div>

                    {/* Hapus Baris */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 self-end sm:self-auto shrink-0"
                      title="Hapus baris"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bagian Bawah/Footer Modal kalkulasi & tombol kirim */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[9px]">Total Debit:</span>
                <span className="font-mono font-bold text-blue-600">Rp {totalFormDebit.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-l pl-3 border-slate-200">
                <span className="text-slate-500 block text-[9px]">Total Kredit:</span>
                <span className="font-mono font-bold text-rose-600">Rp {totalFormKredit.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-l pl-3 border-slate-200">
                <span className="text-slate-500 block text-[9px]">Selisih Neraca:</span>
                <span className={`font-mono font-bold ${selisihForm <= 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                  Rp {selisihForm.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handlePostManual}
                disabled={isSubmitting || totalFormDebit <= 0 || selisihForm > 0.01}
                className="bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white px-4 h-8 shadow-sm"
              >
                <Send className={`mr-1.5 h-3 w-3 ${isSubmitting ? "animate-bounce" : ""}`} />
                {isSubmitting ? "Menyimpan..." : "Posting Jurnal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Wadah Tabel Responsif Tampilan Default Riwayat (SOP Mobile Poin 3A) ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Riwayat Posting Pembukuan Riil</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 font-mono">
            ID-IDR / Double-Entry
          </Badge>
        </CardHeader>

        {/* Luapan Horizontal Wajib untuk menjaga struktur di mobile */}
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">No. Referensi</TableHead>
                <TableHead className="th-standard">Waktu Posting</TableHead>
                <TableHead className="th-standard">Keterangan Jurnal</TableHead>
                <TableHead className="th-standard">Akun COA</TableHead>
                <TableHead className="th-standard text-right">Debit (Rp)</TableHead>
                <TableHead className="th-standard text-right pr-6">Kredit (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEntries.length === 0 ? (
                <TableEmptyState colSpan={6} message="Belum ada transaksi atau entri jurnal yang terposting ke buku besar." />
              ) : (
                currentEntries.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-600">
                      {row.id}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {row.date}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {row.desc}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">{row.account}</div>
                      <span className="text-[9px] font-mono text-slate-400">Kode: {row.coa}</span>
                    </TableCell>
                    {/* Sel Angka/Uang Wajib Font-Mono dan Rata Kanan (SOP 09 Poin 4) */}
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      {row.debit > 0 ? row.debit.toLocaleString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs font-bold text-slate-900">
                      {row.kredit > 0 ? row.kredit.toLocaleString("id-ID") : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={jurnalData.length}
          entriesPerPage={entriesPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Komponen FeedbackModal Pengganti alert() */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        description={feedback.desc}
      />
    </div>
  );
}
