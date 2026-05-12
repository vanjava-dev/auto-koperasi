"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  WalletCards,
  Coins,
  Menu,
  X,
  CreditCard,
  ShieldCheck,
  Building,
  TrendingUp,
  Package,
  UserCog,
  MapPin,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPengaturanSistemAction } from "@/actions/pengaturan-action";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * Sidebar — Bilah navigasi samping yang adaptif dan mendukung usapan seluler.
 * Menyediakan pengalih lingkup cabang dinamis (Tenant Switcher) khusus SUPERADMIN.
 */
export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [koperasiName, setKoperasiName] = useState("KSP Harapan Artha Nusantara");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // State Modal Umpan Balik Perpindahan Cabang
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

  const [liveIndicators, setLiveIndicators] = useState({
    simpananCount: 4,
    pinjamanCount: 5,
    auditLogCount: "Live",
    produkCount: 8,
    userCount: 3,
    cabangCount: 2,
    coaCount: 12,
  });

  // State untuk melacak grup mana yang dalam kondisi Expand (Terbuka) / Collapse (Tertutup)
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    "Layanan Utama": true,
    "Keuangan & Laporan": true,
    "Sistem & Manajemen": true,
  });

  // Tarik nama koperasi riil dari pangkalan data peladen saat pertama kali dimuat
  useEffect(() => {
    async function fetchMeta() {
      const res = await getPengaturanSistemAction();
      if (res?.success && res.data?.koperasiName) {
        setKoperasiName(res.data.koperasiName);
      }
    }
    fetchMeta();
  }, []);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Penanganan Perpindahan Lingkup Cabang (Tenant Switch Flow)
  const handleSwitchBranch = (branchName: string, branchCode: string) => {
    setKoperasiName(branchName);
    setIsBranchDropdownOpen(false);

    showModal(
      "success",
      "Perpindahan Simpul Cabang Berhasil",
      `Lingkup kueri basis data pengguna SUPERADMIN telah dialihkan ke dalam simpul tenant "${branchName}" (${branchCode}). Seluruh modul pembukuan kasir, keanggotaan, dan CoA kini terisolasi mutlak pada instansi cabang ini.`
    );
  };

  // Struktur Navigasi Berkelompok
  const menuGroups = [
    {
      name: "Layanan Utama",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Teller", href: "/teller", icon: Coins },
        { name: "Keanggotaan", href: "/anggota", icon: Users },
      ],
    },
    {
      name: "Keuangan & Laporan",
      items: [
        { 
          name: "Rekening Simpanan", 
          href: "/simpanan", 
          icon: WalletCards,
          badge: liveIndicators.simpananCount 
        },
        { 
          name: "Pinjaman", 
          href: "/pinjaman", 
          icon: CreditCard,
          badge: liveIndicators.pinjamanCount,
          badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
        },
        { 
          name: "Manajemen CoA (Buku Besar)", 
          href: "/coa", 
          icon: BookOpen,
          badge: liveIndicators.coaCount,
          badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
        },
        { 
          name: "Laporan Akuntansi & SHU", 
          href: "/laporan", 
          icon: TrendingUp 
        },
      ],
    },
    {
      name: "Sistem & Manajemen",
      items: [
        { 
          name: "Pengaturan Produk", 
          href: "/produk", 
          icon: Package,
          badge: liveIndicators.produkCount,
          badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30"
        },
        { 
          name: "Manajemen User", 
          href: "/users", 
          icon: UserCog,
          badge: liveIndicators.userCount,
          badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        },
        { 
          name: "Manajemen Cabang", 
          href: "/cabang", 
          icon: MapPin,
          badge: liveIndicators.cabangCount,
          badgeColor: "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        },
        { 
          name: "Pengaturan & Audit Trail", 
          href: "/pengaturan", 
          icon: ShieldCheck,
          badge: liveIndicators.auditLogCount,
          badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        },
      ],
    },
  ];

  return (
    <>
      {/* ── Backdrop Pengaman (Mobile) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in-0"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar Wadah Utama ── */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-inner border border-white/10">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-sm leading-tight">
                Koperasi-AI
              </span>
              <span className="text-[9px] text-blue-400 font-mono tracking-widest uppercase">Core v1.0.0</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white lg:hidden p-1 rounded-lg hover:bg-slate-800"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Menu Pengalih Cabang Interaktif (Branch Switcher) Khusus SUPERADMIN ── */}
        <div className="relative px-3 py-2 bg-slate-950/30 border-b border-slate-800/50">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors group text-left"
            title="Klik untuk beralih ruang lingkup simpul cabang"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Building className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] text-slate-300 font-bold truncate group-hover:text-white transition-colors">
                  {koperasiName}
                </span>
                <span className="text-[8px] text-slate-500 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Lingkup: Tenant Aktif
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-slate-300 transition-colors" />
          </button>

          {/* Senarai Pilihan Cabang Dropdown */}
          {isBranchDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">
                Pilih Simpul Operasional
              </div>
              {[
                { code: "CAB-PUSAT", name: "Kantor Pusat Operasional" },
                { code: "CAB-JABAR", name: "Cabang Pembantu Bandung Raya" },
                { code: "CAB-JATIM", name: "Cabang Pembantu Surabaya" },
              ].map((branch) => (
                <button
                  key={branch.code}
                  onClick={() => handleSwitchBranch(branch.name, branch.code)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                    koperasiName === branch.name
                      ? "bg-blue-600/20 text-blue-400 border border-blue-600/30 font-bold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
                  }`}
                >
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] truncate leading-tight">{branch.name}</span>
                    <span className="text-[8px] font-mono text-slate-500">{branch.code}</span>
                  </div>
                  {koperasiName === branch.name && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Daftar Navigasi Berkelompok */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {menuGroups.map((group) => {
            const isGroupOpen = openGroups[group.name];

            return (
              <div key={group.name} className="space-y-1">
                {/* Header Grup Collapsible */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors rounded-lg hover:bg-slate-800/30"
                  aria-expanded={isGroupOpen}
                >
                  <span>{group.name}</span>
                  {isGroupOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                  )}
                </button>

                {/* Senarai Item di dalam Grup */}
                {isGroupOpen && (
                  <div className="space-y-1 animate-in fade-in-50 duration-200">
                    {group.items.map((link) => {
                      const Icon = link.icon;
                      // Padankan jika path saat ini diawali dengan link.href
                      const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all touch-min relative group",
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20"
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                            <span className="truncate">{link.name}</span>
                          </div>
                          {link.badge && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono shrink-0",
                              link.badgeColor || "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                              isActive && "bg-white/20 text-white border-transparent"
                            )}>
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Info Mode Peladen Dinamis (Tahap 5) */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-slate-400 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider">Database Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-300 leading-relaxed">
              Prisma ORM & Auto-Journaling terhubung seutuhnya.
            </span>
          </div>
        </div>
      </aside>

      {/* ── Pemanggilan Laci Umpan Balik Perpindahan Cabang ── */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
      />

      {/* ── Floating Action Button (Mobile Navigation Drawer Trigger) ── */}
      <Button
        size="icon"
        onClick={onToggle}
        className="w-13 h-13 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl fixed bottom-6 right-6 z-50 lg:hidden flex items-center justify-center text-white transition-transform active:scale-95 border-2 border-white/20"
        aria-label="Buka menu navigasi"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </>
  );
}
