"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Wifi, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  Coffee, 
  LogOut, 
  UserCog 
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

/**
 * Navbar — Bilah atas yang menampilkan identitas koperasi dan info pengguna.
 * Dilengkapi dengan Menu Profil Interaktif (Profile Dropdown) berstempel audit.
 */
export function Navbar() {
  const koperasiName = process.env.NEXT_PUBLIC_KOPERASI_NAME || "KSP Harapan Artha Nusantara";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [operatorStatus, setOperatorStatus] = useState<"Online" | "Istirahat">("Online");

  // State Modal Umpan Balik untuk Aksi Profil
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

  const handleToggleStatus = () => {
    const nextStatus = operatorStatus === "Online" ? "Istirahat" : "Online";
    setOperatorStatus(nextStatus);
    setIsProfileOpen(false);

    showModal(
      "success",
      "Status Kehadiran Diperbarui",
      `Sesi terminal operator Citra Sari kini telah diatur ke mode "${nextStatus}". Ketersediaan penugasan penjurnalan otomatis disesuaikan secara seketika.`
    );
  };

  const handleBukaPengaturanProfil = () => {
    setIsProfileOpen(false);
    showModal(
      "success",
      "Akses Profil & Otorisasi",
      "Anda sedang diarahkan ke dalam konsol pengaturan kredensial pribadi. Hak akses saat ini berada pada tingkat otorisasi tertinggi (SUPERADMIN/Kepala Teller)."
    );
  };

  const handleKeluarSistem = () => {
    setIsProfileOpen(false);
    showModal(
      "success",
      "Sesi Terminal Berakhir Secara Aman",
      "Sesi otentikasi ganda untuk operator Citra Sari telah dicabut. Rekam jejak audit hari ini telah ditandatangani dan dienkripsi ke dalam peladen cadangan secara permanen."
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Koperasi Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 lg:hidden">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-900 line-clamp-1">
            {koperasiName}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${operatorStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>Cabang Utama ({operatorStatus})</span>
          </div>
        </div>
      </div>

      {/* Status & User Container */}
      <div className="flex items-center gap-3 relative">
        {/* Indikator Status Jaringan */}
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-100 font-normal text-xs py-0.5">
          <Wifi className="w-3 h-3" />
          <span>Terhubung</span>
        </Badge>

        {/* ── Tombol Pemicu Menu Profil Interaktif ── */}
        <div className="relative border-l border-slate-100 pl-2">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="Klik untuk membuka opsi akun & sesi"
          >
            <Avatar className="w-8 h-8 border border-slate-200 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold">
                CS
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">Citra Sari</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Kepala Teller
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* ── Senarai Opsi Profil Dropdown ── */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in-0 zoom-in-95 duration-150 z-50">
              {/* Header Dropdown Info Pengguna */}
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-[10px] text-slate-400 font-medium">Sesi Operator Aktif</p>
                <p className="text-xs font-bold text-slate-900 truncate">citra.sari@koperasi.id</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono bg-blue-50 text-blue-600 font-bold rounded">
                  ID: USR-TLR-01
                </span>
              </div>

              {/* Tautan Opsi-Opsi Profil */}
              <div className="py-1">
                <button
                  onClick={handleBukaPengaturanProfil}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pengaturan Akun Pribadi</span>
                </button>

                <button
                  onClick={handleToggleStatus}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Ubah Status: {operatorStatus === "Online" ? "Istirahat" : "Online"}
                  </span>
                </button>

                <button
                  onClick={handleBukaPengaturanProfil}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <UserCog className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hak Akses & Otorisasi</span>
                </button>
              </div>

              {/* Tombol Keluar Sistem */}
              <div className="pt-1 border-t border-slate-50">
                <button
                  onClick={handleKeluarSistem}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Keluar Sistem (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Laci Pengumuman Umpan Balik Sesi ── */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
      />
    </header>
  );
}
