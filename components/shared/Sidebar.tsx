"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  WalletCards,
  FileSpreadsheet,
  Coins,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * Sidebar — Bilah navigasi samping yang adaptif dan mendukung usapan seluler.
 * Mematuhi SOP Responsif Mobile Dokumen 10 Bagian 1 & 2.
 */
export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kasir / Teller", href: "/teller", icon: Coins },
    { name: "Manajemen Anggota", href: "/anggota", icon: Users },
    { name: "Simpanan & Pinjaman", href: "/portofolio", icon: WalletCards },
    { name: "Jurnal Pembukuan", href: "/jurnal", icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* ── Backdrop Pengaman (Mobile) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in-0"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar Wadah Utama ── */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <span className="text-white font-bold tracking-tight text-base">
              Koperasi-AI
            </span>
          </Link>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tautan Navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose} // Auto-Close Link untuk kenyamanan seluler
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-min",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Info Mode Statis (Tahap 2) */}
        <div className="p-4 border-t border-slate-800">
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 mb-1">Mode UI Statis</div>
            <span>Tahap 2: Slicing frontend tanpa koneksi DB.</span>
          </div>
        </div>
      </aside>

      {/* ── Floating Action Button (Mobile Navigation Drawer Trigger) ── */}
      <Button
        size="icon"
        onClick={onToggle}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl fixed bottom-6 right-6 z-50 lg:hidden flex items-center justify-center text-white transition-transform active:scale-95"
        aria-label="Buka menu navigasi"
      >
        <Menu className="w-6 h-6" />
      </Button>
    </>
  );
}
