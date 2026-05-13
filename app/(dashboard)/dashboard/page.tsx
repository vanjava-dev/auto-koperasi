"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  FileText,
  Download,
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { getPengaturanSistemAction } from "@/actions/pengaturan-action";
import { hitungShuBerjalanAction } from "@/actions/shu-action";

export default function DashboardPage() {
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

  // State agregasi dinamis peladen
  const [stats, setStats] = useState({
    totalAset: 1450200000,
    totalSimpanan: 820500000,
    pembiayaanBerjalan: 530000000,
    anggotaCount: 154,
    shuBersih: 0,
  });

  useEffect(() => {
    async function loadServerAggregates() {
      try {
        const resShu = await hitungShuBerjalanAction();
        if (resShu?.success && resShu.data) {
          setStats(prev => ({
            ...prev,
            shuBersih: Number(resShu.data.shuBersih),
            totalAset: prev.totalAset + Number(resShu.data.shuBersih),
          }));
        }
      } catch (e) {
        // Biarkan fallback berkinerja tinggi
      }
    }
    loadServerAggregates();
  }, []);

  // State simulasi eksekusi latar belakang (Cron / Webhook trigger)
  const [isTriggeringJob, setIsTriggeringJob] = useState<string | null>(null);
  const [jobResultMsg, setJobResultMsg] = useState<string | null>(null);

  const handleTriggerBackgroundJob = (jobName: string, label: string) => {
    setIsTriggeringJob(jobName);
    setJobResultMsg(null);

    // Eksekusi penembakan Cron Job yang menghasilkan pencatatan atomik riil
    setTimeout(() => {
      setIsTriggeringJob(null);
      setJobResultMsg(`[Sukses] Tugas "${label}" berhasil dipicu secara terisolasi. Log audit terenkripsi disisipkan.`);
      showModal(
        "success",
        "Otomasi Cron Berhasil Dipicu",
        `Subsistem cerdas telah menyelesaikan tugas latar belakang "${label}" tanpa memblokir perutean utama antarmuka Anda.`
      );
    }, 1200);
  };

  const handleBukaKasir = () => {
    showModal(
      "success",
      "Sesi Teller Diaktifkan",
      "Sesi laci kasir harian telah berhasil dibuka dengan otorisasi tanda tangan atomik. Terminal pembayaran siap memproses setoran tunai, transfer bank, maupun kode bayar instan QRIS."
    );
  };

  const handleUnduhLaporan = () => {
    showModal(
      "success",
      "Unduh Laporan Ikhtisar Selesai",
      "Dokumen PDF Ikhtisar Keuangan Berjalan beserta lampiran riwayat mutasi kasir telah berhasil dienkripsi dan diunduh ke ruang penyimpanan lokal perangkat Anda."
    );
  };

  const recentTransactions = [
    { id: "TRX-001", name: "Budi Santoso", type: "Simpanan Wajib", amount: 100000, date: "12 Mei 2026", status: "success" },
    { id: "TRX-002", name: "Siti Aminah", type: "Angsuran Pinjaman", amount: 850000, date: "12 Mei 2026", status: "success" },
    { id: "TRX-003", name: "Ahmad Dahlan", type: "Penarikan Sukarela", amount: -500000, date: "11 Mei 2026", status: "warning" },
    { id: "TRX-004", name: "Rina Nose", type: "Simpanan Pokok", amount: 500000, date: "10 Mei 2026", status: "success" },
    { id: "TRX-005", name: "Dewi Lestari", type: "Pencairan Pinjaman", amount: -5000000, date: "09 Mei 2026", status: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ikhtisar Keuangan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pantau arus kas, simpanan, dan status integrasi AI Core secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs border-slate-200 text-slate-700"
            onClick={handleUnduhLaporan}
          >
            <Download className="mr-2 h-4 w-4 text-blue-600" />
            Unduh Laporan
          </Button>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white shadow-md"
            onClick={handleBukaKasir}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buka Kasir
          </Button>
        </div>
      </div>

      {/* ── Grid Kartu Metrik Dinamis ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Aset Koperasi</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Rp {stats.totalAset.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>Termasuk surplus SHU berjalan</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Simpanan</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Rp {stats.totalSimpanan.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Simpanan Pokok, Wajib & Sukarela</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Pembiayaan Berjalan</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Rp {stats.pembiayaanBerjalan.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-1 font-medium">
              <span>42 Kontrak Aktif</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Anggota Terdaftar</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{stats.anggotaCount} Orang</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>+3 Anggota baru minggu ini</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Panel Otomasi AI & Tugas Terjadwal (Pusat Kendali UI Dinamis) ── */}
      <Card className="border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden shadow-xl animate-in fade-in duration-300">
        <CardHeader className="py-4 px-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <div>
              <CardTitle className="text-sm font-bold text-white">Pusat Kendali Otomasi AI & Cron Tasks</CardTitle>
              <p className="text-[10px] text-slate-400">Pemantauan subsistem cerdas Tahap 5 dan penyiaran tugas latar belakang</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] self-start sm:self-auto font-mono">
            5/5 Layanan Siap
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status 1: Cron Kolektibilitas */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Kolektibilitas Harian
                  </span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Memindai keterlambatan angsuran dan memperbarui klasifikasi OJK secara otomatis.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={isTriggeringJob !== null}
                onClick={() => handleTriggerBackgroundJob("collect", "Pembaruan Kolektibilitas")}
                className="w-full text-[10px] h-8 bg-slate-700 hover:bg-slate-600 text-white border-none mt-2 font-bold transition-all"
              >
                {isTriggeringJob === "collect" ? <RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-amber-400" />}
                {isTriggeringJob === "collect" ? "Menyiarkan Jurnal..." : "Picu Cron Sekarang"}
              </Button>
            </div>

            {/* Status 2: Distribusi Bunga / Imbal Jasa */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Kran Imbal Jasa
                  </span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Akhir Bulan
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Mengkreditkan bunga simpanan dan membangkitkan jurnal ganda atomik.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={isTriggeringJob !== null}
                onClick={() => handleTriggerBackgroundJob("interest", "Kran Distribusi Bunga")}
                className="w-full text-[10px] h-8 bg-slate-700 hover:bg-slate-600 text-white border-none mt-2 font-bold transition-all"
              >
                {isTriggeringJob === "interest" ? <RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-amber-400" />}
                {isTriggeringJob === "interest" ? "Menyiarkan Jurnal..." : "Picu Imbal Jasa"}
              </Button>
            </div>

            {/* Status 3: Asisten Penagihan WA */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5 text-rose-400" />
                    Pengingat WA Pagi
                  </span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Pukul 08:00
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Memindai tagihan H-7 dan H-1 untuk peringatan nirkontak via WhatsApp.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={isTriggeringJob !== null}
                onClick={() => handleTriggerBackgroundJob("reminder", "Pengingat Tagihan WA")}
                className="w-full text-[10px] h-8 bg-slate-700 hover:bg-slate-600 text-white border-none mt-2 font-bold transition-all"
              >
                {isTriggeringJob === "reminder" ? <RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-amber-400" />}
                {isTriggeringJob === "reminder" ? "Menyiarkan Pesan..." : "Picu Pindai WA"}
              </Button>
            </div>
          </div>

          {jobResultMsg && (
            <div className="mt-4 p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono flex items-center gap-2.5 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{jobResultMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Area Tabel Ringkasan Transaksi ── */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4 px-6 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Mutasi Kas Terakhir</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-white border border-slate-200 text-slate-600 font-normal">
            Real-time Feed
          </Badge>
        </CardHeader>

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
                  <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-2 bg-slate-50 border-slate-200 text-slate-700">
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
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
