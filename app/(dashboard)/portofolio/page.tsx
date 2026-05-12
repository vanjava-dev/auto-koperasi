"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletCards, Landmark, Briefcase, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

/**
 * Halaman Simpanan & Pinjaman Statis — Menampilkan katalog produk dan peringatan COA.
 */
export default function PortofolioPage() {
  const [activeTab, setActiveTab] = useState<"simpanan" | "pinjaman">("simpanan");
  const [isCoaWarnOpen, setIsCoaWarnOpen] = useState(false);

  // Data tiruan produk simpanan
  const simpananProducts = [
    { id: "SAV-01", name: "Simpanan Wajib Anggota", nisbah: "5% p.a", minDeposit: 100000, type: "Wajib", desc: "Setoran rutin bulanan untuk menguatkan ekuitas bersama." },
    { id: "SAV-02", name: "Simpanan Sukarela Fleksibel", nisbah: "7.5% p.a", minDeposit: 50000, type: "Sukarela", desc: "Simpanan bebas tarik setor dengan nisbah bagi hasil bulanan yang kompetitif." },
    { id: "SAV-03", name: "Simpanan Berjangka (Deposito)", nisbah: "11% p.a", minDeposit: 5000000, type: "Berjangka", desc: "Investasi berjangka 3, 6, atau 12 bulan dengan imbal hasil maksimal." },
  ];

  // Data tiruan produk pinjaman
  const pinjamanProducts = [
    { id: "LOAN-01", name: "Pembiayaan Mikro Sejahtera", margin: "1.2% flat/bln", tenor: "Max 24 Bulan", plafon: 15000000, desc: "Fasilitas modal kerja tanpa agunan untuk pengusaha skala mikro." },
    { id: "LOAN-02", name: "Kredit Pemilikan Kendaraan", margin: "0.9% flat/bln", tenor: "Max 48 Bulan", plafon: 75000000, desc: "Pembiayaan pembelian sepeda motor atau mobil operasional anggota." },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Katalog Produk Finansial</h1>
          <p className="text-xs text-slate-500 mt-0.5">Konfigurasi dan penawaran layanan simpanan, deposito, serta fasilitas pinjaman.</p>
        </div>
        <Button
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-xs text-white"
          onClick={() => setIsCoaWarnOpen(true)} // Memicu dialog proteksi akuntansi
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk Baru
        </Button>
      </div>

      {/* ── Tombol Pengalih Tab ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("simpanan")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "simpanan" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Produk Simpanan ({simpananProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pinjaman")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "pinjaman" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Fasilitas Pembiayaan ({pinjamanProducts.length})
        </button>
      </div>

      {/* ── Grid Katalog Produk ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === "simpanan"
          ? simpananProducts.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-100 font-normal py-0.5">
                      {item.type}
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {item.nisbah}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 border-t border-slate-50/50 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Setoran Awal Min.</div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      Rp {item.minDeposit.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-2">
                    Buka Rekening
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          : pinjamanProducts.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-100 font-normal py-0.5">
                      {item.tenor}
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {item.margin}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 border-t border-slate-50/50 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Plafon Maksimal</div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      Rp {item.plafon.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-2">
                    Simulasi Ajukan
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Dialog Proteksi Keterkaitan COA (SOP Poin 5) ── */}
      <Dialog open={isCoaWarnOpen} onOpenChange={setIsCoaWarnOpen}>
        <DialogContent className="sm:max-w-[450px] p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900">Proteksi Buku Besar (Double-Entry Guard)</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400">
                SOP UI/UX Standardisasi Poin 5
              </DialogDescription>
            </div>
          </div>

          <div className="py-3 text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <p>
              Penambahan produk simpanan atau pinjaman baru <strong>berpotensi memodifikasi alur pos neraca keuangan</strong>.
            </p>
            <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
              Setiap produk yang dibuat wajib dipetakan secara eksplisit terhadap kode <strong>Chart of Accounts (COA)</strong> untuk otomatisasi jurnal Debit/Kredit ganda.
            </p>
            <p className="text-[10px] text-amber-600 italic">
              *Akses formulir kreasi produk utuh akan terbuka setelah mesin basis data ORM terpasang di Tahap 3.
            </p>
          </div>

          <DialogFooter>
            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-xs text-white" onClick={() => setIsCoaWarnOpen(false)}>
              Saya Mengerti & Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
