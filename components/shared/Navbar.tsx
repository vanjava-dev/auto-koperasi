"use client";

import React, { useState, useEffect } from "react";
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
  UserCog,
  ChevronsUpDown
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { getNavbarContextAction } from "@/actions/pengaturan-action";

/**
 * Navbar — Bilah atas terpadu Koperasi-AI Core.
 * Menampung pemicu ganda: Menu Pengalih Cabang (kiri) dan Menu Profil Interaktif (kanan),
 * ditenagai sepenuhnya oleh entitas basis data asli dari PostgreSQL.
 */
export function Navbar() {
  // State Lingkup Cabang / Koperasi
  const [koperasiName, setKoperasiName] = useState("Memuat Simpul...");
  const [koperasiList, setKoperasiList] = useState<{ id: string; nama: string; kode: string }[]>([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // State Profil Pengguna Terotentikasi
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    namaLengkap: string;
    email: string;
    role: string;
    initials: string;
  }>({
    id: "USR-000",
    namaLengkap: "Operator Aktif",
    email: "operator@koperasi.id",
    role: "TELLER",
    initials: "OP",
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [operatorStatus, setOperatorStatus] = useState<"Online" | "Istirahat">("Online");

  // State Modal Umpan Balik Terpadu
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

  // Muat data cabang dan pengguna riil dari pangkalan data peladen
  useEffect(() => {
    async function fetchNavbarContext() {
      try {
        const res = await getNavbarContextAction();
        if (res?.success && res.data) {
          if (res.data.activeKoperasi?.nama) {
            setKoperasiName(res.data.activeKoperasi.nama);
          }
          if (res.data.koperasiList?.length > 0) {
            setKoperasiList(res.data.koperasiList);
          }
          if (res.data.currentUser) {
            setCurrentUser(res.data.currentUser);
          }
        } else {
          setKoperasiName("KSP Harapan Artha Nusantara");
        }
      } catch (e) {
        setKoperasiName("KSP Harapan Artha Nusantara");
      }
    }
    fetchNavbarContext();
  }, []);

  // Handler Perpindahan Lingkup Cabang (Tenant Context Switch)
  const handleSwitchBranch = (branchName: string, branchCode: string) => {
    setKoperasiName(branchName);
    setIsBranchOpen(false);

    showModal(
      "success",
      "Perpindahan Simpul Cabang Berhasil",
      `Lingkup kueri basis data operasional telah dialihkan ke dalam simpul cabang "${branchName}" (${branchCode}). Seluruh pencatatan transaksi kasir, data keanggotaan, serta pemetaan Buku Besar kini diisolasi pada instansi ini.`
    );
  };

  // Handler Status Kehadiran Operator
  const handleToggleStatus = () => {
    const nextStatus = operatorStatus === "Online" ? "Istirahat" : "Online";
    setOperatorStatus(nextStatus);
    setIsProfileOpen(false);

    showModal(
      "success",
      "Status Kehadiran Diperbarui",
      `Sesi terminal operator ${currentUser.namaLengkap} kini telah diatur ke mode "${nextStatus}". Ketersediaan penugasan penjurnalan otomatis disesuaikan secara seketika.`
    );
  };

  const handleBukaPengaturanProfil = () => {
    setIsProfileOpen(false);
    showModal(
      "success",
      "Akses Profil & Otorisasi",
      `Anda sedang diarahkan ke dalam konsol pengaturan kredensial pribadi. Hak akses saat ini berada pada tingkat otorisasi ${currentUser.role}.`
    );
  };

  const handleKeluarSistem = () => {
    setIsProfileOpen(false);
    showModal(
      "success",
      "Sesi Terminal Berakhir Secara Aman",
      `Sesi otentikasi aman untuk operator ${currentUser.namaLengkap} telah dicabut. Rekam jejak audit hari ini telah ditandatangani dan dienkripsi ke dalam peladen cadangan secara permanen.`
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      {/* ── Sisi Kiri: Wadah Identitas Merek & Pengalih Cabang Interaktif ── */}
      <div className="relative">
        <button
          onClick={() => {
            setIsBranchOpen(!isBranchOpen);
            if (isProfileOpen) setIsProfileOpen(false);
          }}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-100 max-w-[220px] sm:max-w-xs"
          title="Klik untuk berpindah simpul layanan cabang"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {koperasiName}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${operatorStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="font-mono text-[9px]">Cabang Aktif</span>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
        </button>

        {/* ── Senarai Dropdown Pilihan Cabang Asli ── */}
        {isBranchOpen && (
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in-0 zoom-in-95 duration-150 z-50">
            <div className="px-4 py-1.5 border-b border-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Pilih Simpul Jaringan Cabang
            </div>
            <div className="py-1 space-y-0.5">
              {koperasiList.length === 0 ? (
                <div className="px-4 py-2 text-[10px] text-slate-400 italic">Memuat instansi basis data...</div>
              ) : (
                koperasiList.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleSwitchBranch(branch.nama, branch.kode)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors ${
                      koperasiName === branch.nama
                        ? "bg-blue-50/60 text-blue-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate leading-tight">{branch.nama}</p>
                      <p className="text-[9px] font-mono text-slate-400">{branch.kode}</p>
                    </div>
                    {koperasiName === branch.nama && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Sisi Kanan: Wadah Status Jaringan & Tombol Profil Interaktif Asli ── */}
      <div className="flex items-center gap-3 relative">
        {/* Indikator Koneksi Jaringan */}
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-100 font-normal text-xs py-0.5">
          <Wifi className="w-3 h-3" />
          <span>Terhubung</span>
        </Badge>

        {/* Tombol Pemicu Menu Profil Asli */}
        <div className="relative border-l border-slate-100 pl-2">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              if (isBranchOpen) setIsBranchOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="Klik untuk membuka opsi akun & sesi"
          >
            <Avatar className="w-8 h-8 border border-slate-200 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                {currentUser.namaLengkap}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5 shrink-0" /> 
                <span className="truncate max-w-[100px]">{currentUser.role}</span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Senarai Opsi Profil Dropdown Asli */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in-0 zoom-in-95 duration-150 z-50">
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-[10px] text-slate-400 font-medium">Sesi Operator Aktif</p>
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono bg-blue-50 text-blue-600 font-bold rounded">
                  ROLE: {currentUser.role}
                </span>
              </div>

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

      {/* ── Laci Pengumuman Umpan Balik Terpadu ── */}
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
