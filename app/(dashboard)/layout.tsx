"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Navbar } from "@/components/shared/Navbar";

/**
 * DashboardLayout — Kerangka pembungkus utama antarmuka Koperasi-AI.
 * Mengelola pergeseran bilah navigasi seluler dan dorongan wadah di desktop.
 * Sesuai SOP Responsif Mobile Dokumen 10 Bagian 1.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Bilah Navigasi Samping */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onToggle={toggleSidebar}
      />

      {/* Wadah Area Utama — didorong ke kanan sejauh 64 (256px) di layar lebar */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        {/* Bilah Atas */}
        <Navbar />

        {/* Konten Halaman Adaptif dengan batas luapan */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
