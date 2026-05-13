"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipeAkunCoa } from ".prisma/client";

// Senarai pos akun standar untuk pengisian awal otomatis (seeding)
const DEFAULT_COA_SEED = [
  { kodeAkun: "101.01", namaAkun: "Kas Tunai Teller Utama", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "101.02", namaAkun: "Rekening Bank Syariah Indonesia (BSI)", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "101.03", namaAkun: "Piutang Pembiayaan Anggota", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "201.01", namaAkun: "Simpanan Sukarela Anggota", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "201.02", namaAkun: "Simpanan Berjangka (Deposito)", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "301.01", namaAkun: "Modal Simpanan Pokok", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.02", namaAkun: "Modal Simpanan Wajib", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "401.01", namaAkun: "Pendapatan Margin Pembiayaan", tipe: TipeAkunCoa.REVENUE },
  { kodeAkun: "501.01", namaAkun: "Beban Bagi Hasil Simpanan", tipe: TipeAkunCoa.EXPENSE },
];

/**
 * Mengambil daftar pos akun CoA riil dari peladen.
 * Jika tabel CoA terdeteksi kosong, sistem akan menyisipkan pos utama (Seeding) secara otomatis.
 */
export async function getCoaListAction() {
  try {
    // 1. Dapatkan tenant root Koperasi
    let koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      koperasi = await prisma.koperasi.create({
        data: {
          nama: process.env.NEXT_PUBLIC_KOPERASI_NAME || "KSP Harapan Artha Nusantara",
          alamat: "Jl. Jend. Sudirman Kav. 45, Jakarta",
          telepon: "021-5552910",
        },
      });
    }

    // 2. Ambil seluruh pos akun untuk tenant ini
    let coaList = await prisma.chartOfAccount.findMany({
      where: { koperasiId: koperasi.id },
      orderBy: { kodeAkun: "asc" },
    });

    // 3. Jika kosong, lakukan injeksi seeding awal otomatis
    if (coaList.length === 0) {
      await prisma.$transaction(async (tx) => {
        for (const seed of DEFAULT_COA_SEED) {
          await tx.chartOfAccount.create({
            data: {
              koperasiId: koperasi!.id,
              kodeAkun: seed.kodeAkun,
              namaAkun: seed.namaAkun,
              tipe: seed.tipe,
              isActive: true,
            },
          });
        }

        // Catat stempel audit injeksi awal
        await tx.auditLog.create({
          data: {
            userId: null,
            source: "AI_AGENT",
            action: "SEED_CHART_OF_ACCOUNTS",
            entityType: "COA",
            entityId: koperasi!.id,
            details: `Injeksi otomatis ${DEFAULT_COA_SEED.length} pos akun utama (Aset, Kewajiban, Ekuitas, Pendapatan, Beban) berhasil diselesaikan.`,
          },
        });
      });

      // Muat ulang setelah di-seeding
      coaList = await prisma.chartOfAccount.findMany({
        where: { koperasiId: koperasi.id },
        orderBy: { kodeAkun: "asc" },
      });
    }

    return { success: true, data: coaList };
  } catch (e: any) {
    console.error("[GET_COA_LIST_ERROR]", e);
    return { success: false, error: e?.message || "Gagal memuat daftar Buku Besar dari pangkalan data." };
  }
}

/**
 * Menyisipkan pos akun CoA baru secara persisten dan memvalidasi duplikasi kode.
 */
export async function createCoaAction(inputData: {
  kodeAkun: string;
  namaAkun: string;
  tipe: TipeAkunCoa;
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      return { success: false, error: "Pangkalan data master koperasi belum terinisialisasi." };
    }

    // Validasi duplikasi kode akun pada penyewa aktif
    const exists = await prisma.chartOfAccount.findUnique({
      where: {
        koperasiId_kodeAkun: {
          koperasiId: koperasi.id,
          kodeAkun: inputData.kodeAkun.trim(),
        },
      },
    });

    if (exists) {
      return { success: false, error: `Sandi pos akun "${inputData.kodeAkun}" telah terdaftar untuk "${exists.namaAkun}".` };
    }

    await prisma.$transaction(async (tx) => {
      const newCoa = await tx.chartOfAccount.create({
        data: {
          koperasiId: koperasi.id,
          kodeAkun: inputData.kodeAkun.trim(),
          namaAkun: inputData.namaAkun.trim(),
          tipe: inputData.tipe,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "CREATE_COA_ACCOUNT",
          entityType: "COA",
          entityId: newCoa.id,
          details: JSON.stringify({ kodeAkun: newCoa.kodeAkun, namaAkun: newCoa.namaAkun, tipe: newCoa.tipe }),
        },
      });
    });

    revalidatePath("/dashboard/coa");
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_COA_ERROR]", e);
    return { success: false, error: "Gagal menyimpan pos akun ke pangkalan data." };
  }
}
