"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Eye, Edit, Scan, CheckCircle2 } from "lucide-react";
import { TablePagination, TableEmptyState } from "@/components/shared/TableHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

/**
 * Halaman Manajemen Anggota Statis — Daftar keanggotaan dan simulasi OCR KTP.
 */
export default function AnggotaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Form registrasi tiruan
  const [regForm, setRegForm] = useState({
    nik: "",
    nama: "",
    alamat: "",
  });

  // Data tiruan anggota
  const membersData = [
    { id: "M-001", nik: "3171234567890001", name: "Budi Santoso", status: "Aktif", date: "10 Jan 2024", savings: 2450000 },
    { id: "M-002", nik: "3171234567890002", name: "Siti Aminah", status: "Aktif", date: "15 Feb 2024", savings: 1200000 },
    { id: "M-003", nik: "3171234567890003", name: "Ahmad Dahlan", status: "Aktif", date: "20 Mar 2024", savings: 5500000 },
    { id: "M-004", nik: "3171234567890004", name: "Rina Nose", status: "Menunggu", date: "02 Mei 2026", savings: 100000 },
    { id: "M-005", nik: "3171234567890005", name: "Dewi Lestari", status: "Aktif", date: "12 Apr 2025", savings: 8900000 },
  ];

  const handleSimulateOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccess(false);

    // Simulasi Vision AI mengekstrak data dari KTP
    setTimeout(() => {
      setIsOcrScanning(false);
      setOcrSuccess(true);
      setRegForm({
        nik: "3201011205980003",
        nama: "RANGGA PERDANA",
        alamat: "JL. SUDIRMAN KAV. 45, JAKARTA SELATAN",
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Buku Induk Anggota</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengelolaan profil keanggotaan dan pendaftaran berbasis ekstraksi KTP AI.</p>
        </div>
        <Button
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xs text-white"
          onClick={() => setIsRegisterOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Daftarkan Anggota
        </Button>
      </div>

      {/* ── Wadah Pencarian & Tabel ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIK atau Nama..."
              className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </CardHeader>

        {/* Wadah Tabel Luapan Wajib (SOP Mobile) */}
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">ID</TableHead>
                <TableHead className="th-standard">Identitas / NIK</TableHead>
                <TableHead className="th-standard">Nama Lengkap</TableHead>
                <TableHead className="th-standard">Tanggal Bergabung</TableHead>
                <TableHead className="th-standard text-right">Total Simpanan</TableHead>
                <TableHead className="th-standard text-center">Status</TableHead>
                <TableHead className="th-standard text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersData.length === 0 ? (
                <TableEmptyState colSpan={7} message="Belum ada anggota terdaftar di koperasi." />
              ) : (
                membersData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-600">
                      {row.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {row.nik}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {row.date}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      Rp {row.savings.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-normal py-0.5 ${
                          row.status === "Aktif" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    {/* Aksi Baris Minimalis Murni Ikon (SOP 09 Poin 1) */}
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-blue-600">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-emerald-600">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Komponen Penomoran Halaman Baku */}
        <TablePagination
          currentPage={currentPage}
          totalPages={1}
          totalEntries={membersData.length}
          entriesPerPage={5}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* ── Dialog Registrasi & Simulasi OCR KTP ── */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[450px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Pendaftaran Anggota Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gunakan pemindai KTP cerdas untuk mengekstrak data identitas secara instan.
            </DialogDescription>
          </Header>

          {/* Area Pemicu OCR */}
          <div className="py-2">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50">
              {ocrSuccess ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ekstraksi KTP Selesai
                  </div>
                  <p className="text-[10px] text-slate-400">Kolom isian di bawah telah terisi otomatis.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Scan className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isOcrScanning}
                    onClick={handleSimulateOcr}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
                  >
                    {isOcrScanning ? "Memindai KTP..." : "Pindai / Unggah KTP (OCR)"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Isian */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NIK (Nomor Induk Kependudukan)</label>
              <input
                type="text"
                placeholder="16 Digit NIK..."
                value={regForm.nik}
                onChange={(e) => setRegForm({ ...regForm, nik: e.target.value })}
                className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap Sesuai KTP</label>
              <input
                type="text"
                placeholder="Nama Lengkap..."
                value={regForm.nama}
                onChange={(e) => setRegForm({ ...regForm, nama: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat Tempat Tinggal</label>
              <textarea
                rows={2}
                placeholder="Alamat domisili..."
                value={regForm.alamat}
                onChange={(e) => setRegForm({ ...regForm, alamat: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRegisterOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button size="sm" onClick={() => setIsRegisterOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-xs text-white">
              Simpan & Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
