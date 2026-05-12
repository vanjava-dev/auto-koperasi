"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Wifi } from "lucide-react";

/**
 * Navbar — Bilah atas yang menampilkan identitas koperasi dan info pengguna.
 */
export function Navbar() {
  const koperasiName = process.env.NEXT_PUBLIC_KOPERASI_NAME || "KSP Harapan Artha Nusantara";

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
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cabang Utama</span>
          </div>
        </div>
      </div>

      {/* Status & User */}
      <div className="flex items-center gap-3">
        {/* Indikator Status Jaringan (SOP Portal Anggota) */}
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-100 font-normal text-xs py-0.5">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </Badge>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
          <Avatar className="w-8 h-8 border border-slate-200">
            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-semibold">
              CS
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900">Citra Sari</div>
            <div className="text-[10px] text-slate-400">Kepala Teller</div>
          </div>
        </div>
      </div>
    </header>
  );
}
