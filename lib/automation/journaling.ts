import { prisma } from "@/lib/prisma";
import { JenisMutasi } from ".prisma/client";

/**
 * Parameter untuk membuat satu pasang entri jurnal double-entry.
 */
export interface JurnalPayload {
  koperasiId: string;
  keterangan: string;
  source?: string; // "TELLER" | "WEBHOOK" | "AI_AGENT" | "SYSTEM"
  coaDebitId: string;   // ID akun yang didebit  (mis. Kas Teller)
  coaKreditId: string;  // ID akun yang dikredit (mis. Simpanan Wajib)
  nominal: number;
}

/**
 * Menghasilkan nomor referensi jurnal unik dengan format: JRN-YYYYMMDD-XXXX
 */
function generateNoReferensi(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.floor(1000 + Math.random() * 9000).toString();
  return `JRN-${datePart}-${randPart}`;
}

/**
 * Membuat entri Jurnal + dua JurnalEntry (Debit & Kredit) secara atomik.
 * Wajib dipanggil di dalam blok `prisma.$transaction([...])` yang sama
 * dengan operasi utama transaksi dan AuditLog. (Aturan L - architecture.md)
 *
 * Mengembalikan array operasi Prisma siap dimasukkan ke dalam transaksi.
 */
export function buildJurnalOperations(payload: JurnalPayload) {
  const noReferensi = generateNoReferensi();

  return [
    // Buat dokumen jurnal induk
    prisma.jurnal.create({
      data: {
        koperasiId: payload.koperasiId,
        noReferensi,
        keterangan: payload.keterangan,
        source: payload.source ?? "SYSTEM",
        entries: {
          create: [
            // Sisi Debit
            {
              coaId: payload.coaDebitId,
              debit: payload.nominal,
              kredit: 0,
            },
            // Sisi Kredit
            {
              coaId: payload.coaKreditId,
              debit: 0,
              kredit: payload.nominal,
            },
          ],
        },
      },
    }),
  ];
}
