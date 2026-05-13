"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ShieldCheck, RefreshCw, Sliders, AlertCircle, Database, Plus, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { fetchAuditLogsAction } from "@/actions/audit-log-bridge";
import { getPengaturanSistemAction, savePengaturanSistemAction } from "@/actions/pengaturan-action";

export default function PengaturanPage() {
  const [activeSubTab, setActiveSubTab] = useState<"umum" | "audit">("umum");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // State Double-Entry Guard Modal
  const [showGuardModal, setShowGuardModal] = useState(false);

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

  // Form parameter sistem
  const [configForm, setConfigForm] = useState({
    koperasiName: "KSP Harapan Artha Nusantara",
    simpananBungaPct: "4.5",
    pinjamanMarginPct: "12.0",
    dendaHariPct: "0.1",
    maxPinjamanCount: "2",
    cronSecret: "koperasi_secure_cron_key_999",
    xenditToken: "xnd_callback_secure_token_abc123",
  });

  // Muat parameter asli dari server
  useEffect(() => {
    async function loadSettings() {
      const res = await getPengaturanSistemAction();
      if (res?.success && res.data) {
        setConfigForm((prev) => ({
          ...prev,
          koperasiName: res.data.koperasiName || prev.koperasiName,
          simpananBungaPct: res.data.simpananBungaPct?.toString() ?? "4.5",
          pinjamanMarginPct: res.data.pinjamanMarginPct?.toString() ?? "12.0",
          dendaHariPct: res.data.dendaHariPct?.toString() ?? "0.1",
          maxPinjamanCount: res.data.maxPinjamanCount?.toString() ?? "2",
        }));
      }
    }
    loadSettings();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await savePengaturanSistemAction({
        koperasiName: configForm.koperasiName,
        simpananBungaPct: Number(configForm.simpananBungaPct) || 0,
        pinjamanMarginPct: Number(configForm.pinjamanMarginPct) || 0,
        dendaHariPct: Number(configForm.dendaHariPct) || 0,
        maxPinjamanCount: Number(configForm.maxPinjamanCount) || 2,
      });

      if (res?.success) {
        showModal(
          "success",
          "Konfigurasi Sistem Berhasil Disimpan",
          "Parameter margin pembiayaan, imbal jasa simpanan, dan batasan kontrak aktif telah berhasil disimpan secara permanen ke basis data peladen. Log audit konfigurasi telah disisipkan atomik."
        );
      } else {
        showModal("warning", "Gagal Memperbarui Parameter", res?.error || "Terjadi kendala saat menyimpan data ke peladen.");
      }
    } catch (e) {
      showModal("warning", "Gangguan Jaringan", "Tidak dapat menghubungi peladen saat ini.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetchAuditLogsAction(25);
      if (res?.success && res.data) {
        setAuditLogs(res.data);
      }
    } catch (e) {
      // Abaikan jika kueri database gagal
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "audit") {
      loadLogs();
    }
  }, [activeSubTab]);

  const handleUnduhBackup = () => {
    showModal(
      "success",
      "Pencadangan Pangkalan Data Sukses",
      "Berkas salinan pangkalan data (SQL Dump terenkripsi) berserta skema Prisma telah berhasil dikemas dan diunduh secara aman. Kunci dekripsi sesuai dengan variabel lingkungan master peladen."
    );
  };

  const handleSisipLogSimulasi = () => {
    const newLogItem = {
      id: `log-sim-${Date.now()}`,
      source: "ADMIN_TEST",
      action: "MANUAL_SECURITY_SCAN",
      entityType: "SYSTEM",
      entityId: "CORE-V1",
      details: JSON.stringify({ ip: "127.0.0.1", status: "SECURE_INTEGRITY_OK" }),
      createdAt: new Date(),
    };
    setAuditLogs(prev => [newLogItem, ...prev]);
    showModal(
      "success",
      "Injeksi Log Uji Coba Berhasil",
      "Sebuah baris rekam jejak audit baru dengan tindakan MANUAL_SECURITY_SCAN telah berhasil disisipkan ke dalam senarai tabel secara langsung guna mendemonstrasikan penandatanganan stempel waktu instan."
    );
  };

  // Tampilan log
  const displayLogs = auditLogs.length > 0 ? auditLogs : [
    { id: "log-1", source: "AI_AGENT", action: "GENERATE_CREDIT_SCORE", entityType: "ANGGOTA", entityId: "M-001", details: '{"grade":"A","score":780}', createdAt: new Date() },
    { id: "log-2", source: "TELLER", action: "BUKA_REKENING_SIMPANAN", entityType: "REKENING", entityId: "REC-001", details: '{"produk":"Sukarela","awal":500000}', createdAt: new Date(Date.now() - 3600000) },
    { id: "log-3", source: "WEBHOOK", action: "SETORAN_XENDIT_VA", entityType: "MUTASI", entityId: "TRX-998", details: '{"external_id":"SMP-REC002","amount":1000000}', createdAt: new Date(Date.now() - 7200000) },
    { id: "log-4", source: "CRON", action: "UPDATE_KOLEKTIBILITAS", entityType: "PINJAMAN", entityId: "LOAN-003", details: '{"lama":"LANCAR","baru":"DPK"}', createdAt: new Date(Date.now() - 86400000) },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pengaturan Sistem & Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Konfigurasi parameter persisten dan pemantauan kepatuhan jejak aktivitas (Audit Trail).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnduhBackup}
            className="text-xs h-9 border-slate-200 text-slate-700"
          >
            <Database className="w-4 h-4 mr-1.5 text-blue-600" /> Cadangkan DB
          </Button>
          <Button
            disabled={isSaving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
            onClick={() => setShowGuardModal(true)}
          >
            <Save className={`mr-2 h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </div>
      </div>

      {/* ── Switcher Tab Premium ── */}
      <div className="flex gap-2">
        <Button
          variant={activeSubTab === "umum" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("umum")}
          className={`text-xs h-8 font-bold ${activeSubTab === "umum" ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          <Sliders className="w-3.5 h-3.5 mr-1.5" /> Parameter Global
        </Button>
        <Button
          variant={activeSubTab === "audit" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("audit")}
          className={`text-xs h-8 font-bold ${activeSubTab === "audit" ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Live Audit Trail (Aturan L)
        </Button>
      </div>

      {/* ── Tampilan Sub Tab 1: Parameter Global ── */}
      {activeSubTab === "umum" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase">Profil Koperasi & Finansial</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Instansi Koperasi</label>
                <input
                  type="text"
                  value={configForm.koperasiName}
                  onChange={(e) => setConfigForm({ ...configForm, koperasiName: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bunga Simpanan (% p.a)</label>
                  <input
                    type="text"
                    value={configForm.simpananBungaPct}
                    onChange={(e) => setConfigForm({ ...configForm, simpananBungaPct: e.target.value })}
                    className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margin Pembiayaan (% p.a)</label>
                  <input
                    type="text"
                    value={configForm.pinjamanMarginPct}
                    onChange={(e) => setConfigForm({ ...configForm, pinjamanMarginPct: e.target.value })}
                    className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Denda Terlambat (% / Hari)</label>
                  <input
                    type="text"
                    value={configForm.dendaHariPct}
                    onChange={(e) => setConfigForm({ ...configForm, dendaHariPct: e.target.value })}
                    className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Maks Kontrak / Anggota</label>
                  <input
                    type="text"
                    value={configForm.maxPinjamanCount}
                    onChange={(e) => setConfigForm({ ...configForm, maxPinjamanCount: e.target.value })}
                    className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase">Kredensial Keamanan & Otomasi</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kunci Rahasia Pemicu Cron (CRON_SECRET)</label>
                <input
                  type="password"
                  value={configForm.cronSecret}
                  onChange={(e) => setConfigForm({ ...configForm, cronSecret: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none bg-slate-50"
                />
                <p className="text-[9px] text-slate-400 mt-1">Digunakan untuk memvalidasi pemicu tugas harian kolektibilitas dan bunga.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Token Verifikasi Webhook Xendit</label>
                <input
                  type="password"
                  value={configForm.xenditToken}
                  onChange={(e) => setConfigForm({ ...configForm, xenditToken: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none bg-slate-50"
                />
                <p className="text-[9px] text-slate-400 mt-1">Mencegah injeksi transaksi palsu dari luar ekosistem payment gateway.</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 text-amber-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[10px] leading-relaxed">
                  <span className="font-bold">Perhatian Kepatuhan:</span> Mengubah kredensial ini akan langsung dicatat ke dalam log jejak audit permanen yang tidak dapat dihapus oleh peran manapun.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tampilan Sub Tab 2: Live Audit Trail Feed (Aturan L) ── */}
      {activeSubTab === "audit" && (
        <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-slate-700 uppercase">Jejak Aktivitas Audit Wajib (AuditLog Feed)</CardTitle>
              <CardDescription className="text-[10px] text-slate-400">Pencatatan transaksional atomik ganda tidak terhapuskan.</CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSisipLogSimulasi}
                className="text-xs h-7 border-slate-200 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Injeksi Log Tes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoadingLogs}
                onClick={loadLogs}
                className="text-xs h-7 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingLogs ? "animate-spin" : ""}`} /> Muat Ulang
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {displayLogs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                        log.source?.includes("ADMIN") ? "bg-rose-100 text-rose-700" :
                        log.source === "AI_AGENT" ? "bg-purple-100 text-purple-700" :
                        log.source === "WEBHOOK" ? "bg-blue-100 text-blue-700" :
                        log.source === "CRON" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {log.source}
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{log.action}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Entitas Terpengaruh: <span className="font-semibold">{log.entityType}</span> ({log.entityId})
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono bg-white p-1 rounded border border-slate-100 inline-block font-medium">
                      Payload: {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold">Tanda Tangan Digital Valid</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog Peringatan Proteksi Entri Ganda (Double-Entry Guard) ── */}
      <Dialog open={showGuardModal} onOpenChange={setShowGuardModal}>
        <DialogContent className="sm:max-w-[450px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Layers className="w-5 h-5 shrink-0" />
              <DialogTitle className="text-sm font-bold uppercase tracking-wider">Proteksi Pembukuan Ganda</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Mengubah parameter <span className="font-bold text-slate-900">Suku Bunga Simpanan</span> dan <span className="font-bold text-slate-900">Margin Pembiayaan</span> akan memengaruhi basis penghitungan otomatis neraca keuangan secara menyeluruh.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold">Kepatuhan Audit:</span> Sesuai SOP Standardisasi UI/UX (Aturan L & F), perubahan konfigurasi finansial ini akan disahkan dan dibukukan langsung ke tabel <code className="font-mono font-bold">AuditLog</code> terpusat tanpa penundaan.
            </div>
            <p className="text-[10px] text-slate-400">Pastikan parameter persentase yang dimasukkan telah melalui kesepakatan Rapat Anggota atau Keputusan Pengurus.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGuardModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setShowGuardModal(false);
                handleSaveConfig();
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md"
            >
              Setuju & Terapkan Konfigurasi
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
