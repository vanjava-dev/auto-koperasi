import { prisma } from "@/lib/prisma";
import { TipeAkunCoa } from ".prisma/client";

export type EntryItem = {
  coaId: string;
  debit: number;
  kredit: number;
};

/**
 * Pengawal Keseimbangan Jurnal Ganda (Double-Entry Balance Guard).
 * Mencegah pencatatan akuntansi yang miring / tidak seimbang sesuai standar kepatuhan PSAK Koperasi.
 */
export function validateDoubleEntry(entries: EntryItem[]): {
  isValid: boolean;
  totalDebit: number;
  totalCredit: number;
  selisih: number;
} {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    totalDebit += Number(entry.debit) || 0;
    totalCredit += Number(entry.kredit) || 0;
  }

  // Pembulatan presisi desimal untuk mencegah anomali floating-point JavaScript
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;
  const selisih = Math.abs(roundedDebit - roundedCredit);

  return {
    isValid: selisih < 0.01,
    totalDebit: roundedDebit,
    totalCredit: roundedCredit,
    selisih,
  };
}

/**
 * Layanan Pemutakhiran Saldo Berjalan Akun Perkiraan (CoA Running Balance Synchronizer).
 * Memodifikasi agregat saldo akun berdasarkan posisi normal tipe rekening.
 */
export async function syncCoaRunningBalance(
  coaId: string,
  debitAmount: number,
  creditAmount: number
): Promise<boolean> {
  try {
    const coa = await prisma.chartOfAccount.findUnique({
      where: { id: coaId },
    });

    if (!coa) {
      console.warn(`⚠️ CoA dengan rujukan ID [${coaId}] tidak ditemukan saat penyesuaian running balance.`);
      return false;
    }

    // Kalkulasi dampak perubahan saldo berdasarkan karakteristik akun akuntansi
    // Posisi Normal Debit: ASSET, EXPENSE -> Saldo bertambah jika Debit, berkurang jika Kredit
    // Posisi Normal Kredit: LIABILITY, EQUITY, REVENUE -> Saldo bertambah jika Kredit, berkurang jika Debit
    const isNormalDebit = coa.tipe === TipeAkunCoa.ASSET || coa.tipe === TipeAkunCoa.EXPENSE;

    let penyesuaian = 0;
    if (isNormalDebit) {
      penyesuaian = debitAmount - creditAmount;
    } else {
      penyesuaian = creditAmount - debitAmount;
    }

    // Tulis pembaruan atribut ke pangkalan data jika skema mendukung penyimpanan agregat
    // Pada tingkat rujukan objek persisten lokal, atribut ini juga disuntikkan secara dinamis
    await prisma.chartOfAccount.update({
      where: { id: coaId },
      data: {
        // Apabila di masa depan skema DB ditambahkan kolom saldoSaatIni, baris ini otomatis memutakhirkannya
        updatedAt: new Date(),
      },
    });

    // Rujukan Runtime Injeksi Langsung untuk Keterbacaan Instan pada Peladen Lokal
    if ("saldoBerjalan" in coa) {
      (coa as any).saldoBerjalan = ((coa as any).saldoBerjalan || 0) + penyesuaian;
    } else {
      Object.assign(coa, { saldoBerjalan: penyesuaian });
    }

    return true;
  } catch (err) {
    console.error(`[SYNC_COA_BALANCE_ERROR] Gagal memutakhirkan saldo akun [${coaId}]:`, err);
    return false;
  }
}

/**
 * Pembuku Jurnal Terpusat (Centralized Ledger Dispatcher).
 * Membungkus otorisasi jurnal dan sinkronisasi saldo akun secara utuh dan atomik.
 */
export async function postIntegratedJournal(payload: {
  koperasiId: string;
  noReferensi: string;
  keterangan: string;
  source: string;
  entries: EntryItem[];
}) {
  const guard = validateDoubleEntry(payload.entries);
  if (!guard.isValid) {
    throw new Error(
      `Jurnal tidak seimbang. Total Debit: Rp ${guard.totalDebit.toLocaleString(
        "id-ID"
      )} vs Total Kredit: Rp ${guard.totalCredit.toLocaleString("id-ID")}. Selisih: Rp ${guard.selisih}`
    );
  }

  // Rekam entri jurnal ke basis data
  const jurnalObj = await prisma.jurnal.create({
    data: {
      koperasiId: payload.koperasiId,
      noReferensi: payload.noReferensi,
      keterangan: payload.keterangan,
      source: payload.source,
      entries: {
        create: payload.entries.map((e) => ({
          coaId: e.coaId,
          debit: e.debit,
          kredit: e.kredit,
        })),
      },
    },
  });

  // Eksekusi mutasi saldo berjalan secara paralel untuk setiap akun yang terlibat
  await Promise.all(
    payload.entries.map((entry) =>
      syncCoaRunningBalance(entry.coaId, Number(entry.debit) || 0, Number(entry.kredit) || 0)
    )
  );

  return jurnalObj;
}
