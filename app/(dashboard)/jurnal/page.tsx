"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/TableHelper";

/**
 * Halaman Jurnal Pembukuan Statis — Menampilkan entri double-entry dengan horizontal swipe.
 */
export default function JurnalPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Data tiruan pembukuan jurnal umum (Double-Entry)
  const jurnalData = [
    { id: "JRN-20260512-01", date: "12 Mei 2026 10:15", desc: "Setoran Simpanan Wajib a.n Budi Santoso", account: "101-01 Kas Teller Utama", coa: "101.01", debit: 100000, kredit: 0 },
    { id: "JRN-20260512-01", date: "12 Mei 2026 10:15", desc: "Setoran Simpanan Wajib a.n Budi Santoso", account: "201-02 Simpanan Wajib Anggota", coa: "201.02", debit: 0, kredit: 100000 },
    { id: "JRN-20260512-02", date: "12 Mei 2026 09:30", desc: "Pencairan Pembiayaan Mikro a.n Dewi Lestari", account: "104-01 Piutang Pembiayaan Mikro", coa: "104.01", debit: 5000000, kredit: 0 },
    { id: "JRN-20260512-02", date: "12 Mei 2026 09:30", desc: "Pencairan Pembiayaan Mikro a.n Dewi Lestari", account: "101-01 Kas Teller Utama", coa: "101.01", debit: 0, kredit: 5000000 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Jurnal Umum & Buku Besar</h1>
          <p className="text-xs text-slate-500 mt-0.5">Catatan posting mutasi debit/kredit ganda yang digenerate otomatis oleh Automation Engine.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Sinkronisasi Ulang
          </Button>
          <Button size="sm" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-xs text-white">
            <Download className="mr-2 h-3.5 w-3.5" />
            Ekspor Buku Besar
          </Button>
        </div>
      </div>

      {/* ── Wadah Tabel Responsif (SOP Mobile Poin 3A) ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Riwayat Posting Akuntansi</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 font-mono">
            ID-IDR / Double-Entry
          </Badge>
        </CardHeader>

        {/* Luapan Horizontal Wajib untuk menjaga struktur di mobile */}
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">No. Referensi</TableHead>
                <TableHead className="th-standard">Waktu Posting</TableHead>
                <TableHead className="th-standard">Keterangan Jurnal</TableHead>
                <TableHead className="th-standard">Akun COA</TableHead>
                <TableHead className="th-standard text-right">Debit (Rp)</TableHead>
                <TableHead className="th-standard text-right pr-6">Kredit (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jurnalData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">
                    {row.desc}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-slate-800">{row.account}</div>
                    <span className="text-[9px] font-mono text-slate-400">Kode: {row.coa}</span>
                  </TableCell>
                  {/* Sel Angka/Uang Wajib Font-Mono dan Rata Kanan (SOP 09 Poin 4) */}
                  <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                    {row.debit > 0 ? row.debit.toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-mono text-xs font-bold text-slate-900">
                    {row.kredit > 0 ? row.kredit.toLocaleString("id-ID") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={currentPage}
          totalPages={1}
          totalEntries={jurnalData.length}
          entriesPerPage={10}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
