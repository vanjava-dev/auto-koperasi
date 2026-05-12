"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Shield, KeyRound, UserCheck, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"TELLER" | "MANAGER" | "ADMIN">("TELLER");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleQuickSelect = (role: "TELLER" | "MANAGER" | "ADMIN") => {
    setSelectedRole(role);
    if (role === "TELLER") {
      setUsername("teller_utama");
      setPassword("password_koperasi_secure");
    } else if (role === "MANAGER") {
      setUsername("manager_kredit");
      setPassword("password_manager_secure");
    } else {
      setUsername("admin_super");
      setPassword("password_admin_secure");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showModal(
        "success",
        "Otentikasi Berhasil Lolos",
        `Selamat datang kembali, ${username}! Sesi akses Anda telah diamankan di bawah payung hak akses peran ${selectedRole}. Log otentikasi atomik berhasil disisipkan.`
      );
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4">
      {/* Ornamen Latar Mengambang */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        {/* Identitas Merek */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner text-blue-400 mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Koperasi-AI Core</h1>
          <p className="text-xs text-slate-400">Portal Manajemen Otomasi Cerdas & Jejak Audit Terpadu</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4 text-center border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Otentikasi kredensial untuk membuka akses terminal pembukuan.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Pilihan Peran Cepat (Quick Select Role) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-center">
                Simulasi Peran Akses Cepat
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => handleQuickSelect("TELLER")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedRole === "TELLER"
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Teller
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("MANAGER")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedRole === "MANAGER"
                      ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Manajer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("ADMIN")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedRole === "ADMIN"
                      ? "bg-white text-purple-600 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Pengguna (Username)
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan nama pengguna..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold shadow-md shadow-blue-500/20"
                >
                  <LogIn className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Mengotentikasi Sesi..." : "Masuk ke Sistem"}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[10px]">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dilindungi enkripsi lapis ganda & wajib rekam jejak audit.</span>
          </CardFooter>
        </Card>

        {/* Kembalian Cepat Navigasi Simulasi */}
        <div className="text-center">
          <a href="/dashboard" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3" /> Lewati ke Antarmuka Dasbor Utama
          </a>
        </div>
      </div>

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
