"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowDownToLine, ArrowUpFromLine, RefreshCw, CheckCircle2 } from "lucide-react";
import { FeedbackModal } from "@/components/shared/FeedbackModal";

/**
 * Halaman Kasir / Teller Statis — Antarmuka ringkas cepat untuk input transaksi harian.
 */
export default function TellerPage() {
  const [activeTab, setActiveTab] = useState<"setor" | "tarik">("setor");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state sederhana
  const [formData, setFormData] = useState({
    noRekening: "REK-882910",
    nama: "Budi Santoso",
    nominal: "500000",
    keterangan: "Setoran simpanan wajib bulanan",
  });

  const handleProcessTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulasi penundaan jaringan singkat
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(true); // Memanggil modal pengganti alert()
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header Halaman ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Meja Kasir & Teller</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Modul pencatatan transaksi kas cepat. Wajib diutamakan jalur otomatis (Webhook/VA) jika tersedia.
        </p>
      </div>

      {/* ── Bilah Pencarian Cepat ── */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pindai barcode atau ketik Nomor Rekening / Nama Anggota..."
                defaultValue={formData.noRekening}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto text-xs shrink-0">
              Cari Anggota
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Wadah Tabulasi Transaksi ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sisi Kiri: Pilihan Transaksi */}
        <div className="md:col-span-1 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab("setor")}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              activeTab === "setor"
                ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-xs"
                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "setor" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                <ArrowDownToLine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Setoran Kas</div>
                <div className="text-[10px] text-slate-400">Pemasukan simpanan</div>
              </div>
            </div>
            {activeTab === "setor" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tarik")}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              activeTab === "tarik"
                ? "border-rose-500 bg-rose-50/50 text-rose-700 shadow-xs"
                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "tarik" ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                <ArrowUpFromLine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Penarikan Tunai</div>
                <div className="text-[10px] text-slate-400">Pengambilan dana</div>
              </div>
            </div>
            {activeTab === "tarik" && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
          </button>
        </div>

        {/* Sisi Kanan: Formulir Input Dinamis */}
        <Card className="md:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900">
              Formulir {activeTab === "setor" ? "Setoran Masuk" : "Penarikan Dana"}
            </CardTitle>
            <CardDescription className="text-xs">
              Pastikan uang fisik telah dihitung sebelum menekan tombol verifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleProcessTransaction} className="space-y-4">
              {/* Info Terkunci */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nomor Rekening</label>
                  <div className="text-xs font-mono font-semibold bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                    {formData.noRekening}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Pemilik</label>
                  <div className="text-xs font-semibold bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 line-clamp-1">
                    {formData.nama}
                  </div>
                </div>
              </div>

              {/* Nominal Input (SOP Font Mono) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nominal Transaksi (Rp)</label>
                <input
                  type="text"
                  required
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full h-10 px-3 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Terbilang: Lima ratus ribu rupiah
                </span>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Berita / Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 resize-none"
                />
              </div>

              {/* Tombol Aksi Wajib Berikon (SOP 09 Poin 2) */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-xs text-white ${activeTab === "setor" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Memproses Jurnal...
                    </>
                  ) : (
                    <>
                      {activeTab === "setor" ? <ArrowDownToLine className="mr-2 h-4 w-4" /> : <ArrowUpFromLine className="mr-2 h-4 w-4" />}
                      Proses Transaksi & Jurnal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Feedback Modal ── */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="success"
        title="Transaksi Berhasil Dicatat"
        description={`Setoran sebesar Rp ${Number(formData.nominal).toLocaleString("id-ID")} untuk rekening ${formData.noRekening} telah dibukukan ke dalam sistem dan jurnal ganda berhasil dibuat otomatis.`}
        primaryActionLabel="Cetak Bukti Transaksi"
      />
    </div>
  );
}
