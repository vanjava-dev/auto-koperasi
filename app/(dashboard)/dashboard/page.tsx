"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  FileText,
  Download,
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

/**
 * Halaman Dashboard Statis — Menampilkan KPI utama dan mutasi kas terakhir.
 */
export default function DashboardPage() {
  // State untuk demonstrasi FeedbackModal (SOP 09 Larangan alert)
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

  // Data tiruan transaksi terakhir
  const recentTransactions = [
    { id: "TRX-001", name: "Budi Santoso", type: "Simpanan Wajib", amount: 100000, date: "12 Mei 2026", status: "success" },
    { id: "TRX-002", name: "Siti Aminah", type: "Angsuran Pinjaman", amount: 850000, date: "12 Mei 2026", status: "success" },
    { id: "TRX-003", name: "Ahmad Dahlan", type: "Penarikan Sukarela", amount: -500000, date: "11 Mei 2026", status: "warning" },
    { id: "TRX-004", name: "Rina Nose", type: "Simpanan Pokok", amount: 500000, date: "10 Mei 2026", status: "success" },
    { id: "TRX-005", name: "Dewi Lestari", type: "Pencairan Pinjaman", amount: -5000000, date: "09 Mei 2026", status: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Halaman (SOP Mobile Poin 3C) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ikhtisar Keuangan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pantau arus kas, simpanan, dan portofolio pembiayaan secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs"
            onClick={() => showModal("warning", "Fitur Belum Tersedia", "Laporan cetak PDF akan aktif setelah koneksi basis data Tahap 4 selesai.")}
          >
            <Download className="mr-2 h-4 w-4" />
            Unduh Laporan
          </Button>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white"
            onClick={() => showModal("success", "Pembukaan Kasir Sukses", "Sesi kasir harian telah dibuka. Siap menerima setoran tunai maupun QRIS.")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buka Kasir
          </Button>
        </div>
      </div>

      {/* ── Grid Kartu Metrik (SOP Mobile Poin 3B) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Aset */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Aset Koperasi</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Rp 1.450.200.000</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12.5% dari bulan lalu</span>
            </p>
          </CardContent>
        </Card>

        {/* Simpanan Anggota */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Simpanan</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Rp 820.500.000</div>
            <p className="text-[10px] text-slate-400 mt-1">Simpanan Pokok, Wajib & Sukarela</p>
          </CardContent>
        </Card>

        {/* Pembiayaan Aktif */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Pembiayaan Berjalan</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Rp 530.000.000</div>
            <p className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-1 font-medium">
              <span>42 Kontrak Aktif</span>
            </p>
          </CardContent>
        </Card>

        {/* Anggota Aktif */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Anggota Terdaftar</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">154 Orang</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>+3 Anggota baru minggu ini</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Area Tabel Ringkasan Transaksi (SOP Mobile Poin 3A) ── */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4 px-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Mutasi Kas Terakhir</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-normal">
            Real-time
          </Badge>
        </CardHeader>

        {/* Kewajiban Wadah overflow-x-auto untuk tabel */}
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">ID Transaksi</TableHead>
                <TableHead className="th-standard">Nama Anggota</TableHead>
                <TableHead className="th-standard">Jenis Mutasi</TableHead>
                <TableHead className="th-standard">Tanggal</TableHead>
                <TableHead className="th-standard text-right pr-6">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal py-0.5">
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {row.date}
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono text-xs font-bold">
                    <span className={row.amount > 0 ? "text-emerald-600" : "text-rose-600"}>
                      {row.amount > 0 ? "+" : ""}
                      Rp {Math.abs(row.amount).toLocaleString("id-ID")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Panggilan Komponen Global Feedback Modal ── */}
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
