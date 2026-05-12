"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  entriesPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * TablePagination — Blok navigasi penomoran halaman seragam di bawah tabel.
 * Sesuai SOP UI/UX Bagian 4.2.
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalEntries,
  entriesPerPage,
  onPageChange,
}: TablePaginationProps) {
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 text-xs text-slate-500 border-t border-slate-100">
      {/* Indikator Rentang */}
      <div>
        Menampilkan <span className="font-semibold text-slate-700">{totalEntries === 0 ? 0 : startEntry}</span>–
        <span className="font-semibold text-slate-700">{endEntry}</span> dari{" "}
        <span className="font-semibold text-slate-700">{totalEntries}</span> entri
      </div>

      {/* Tombol Navigasi */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs rounded-lg"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Sebelumnya
        </Button>
        <span className="px-3 py-1 text-xs font-semibold text-slate-700">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs rounded-lg"
          disabled={currentPage >= totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Selanjutnya
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface TableEmptyStateProps {
  colSpan: number;
  message?: string;
}

/**
 * TableEmptyState — State kosong bawaan saat baris data tidak ditemukan.
 * Sesuai SOP UI/UX Bagian 4.1 Poin 4.
 */
export function TableEmptyState({
  colSpan,
  message = "Data tidak ditemukan atau belum terkonfigurasi.",
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-12 text-center text-slate-400 italic text-xs border-b-0"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
