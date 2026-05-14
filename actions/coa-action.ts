"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipeAkunCoa } from ".prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// STANDAR CHART OF ACCOUNTS (BAGAN AKUN) — PSAK Koperasi Indonesia
// Struktur hierarki 3 level: Klasifikasi → Sub-Klasifikasi → Akun Rinci
// Referensi: PSAK 27 (Akuntansi Perkoperasian) & SAK ETAP Bab 20
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COA_SEED = [

  // ══════════════════════════════════════════════════════════════════
  // KELOMPOK 1: ASET (ASSET)
  // ══════════════════════════════════════════════════════════════════

  // 1.1 — Aset Lancar / Kas & Setara Kas
  { kodeAkun: "101.01", namaAkun: "Kas Tunai Teller Utama", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "101.02", namaAkun: "Rekening Bank (Syariah / Konvensional)", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "101.03", namaAkun: "Kas Kecil / Petty Cash", tipe: TipeAkunCoa.ASSET },

  // 1.2 — Aset Lancar / Piutang & Pembiayaan
  { kodeAkun: "102.01", namaAkun: "Piutang Pembiayaan Pokok Anggota", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "102.02", namaAkun: "Piutang Pembiayaan Multiguna", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "102.03", namaAkun: "Penyisihan Kerugian Piutang (Cadangan Risiko)", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "102.04", namaAkun: "Piutang Bunga / Margin yang Masih Harus Diterima", tipe: TipeAkunCoa.ASSET },

  // 1.3 — Aset Lancar / Investasi Jangka Pendek
  { kodeAkun: "103.01", namaAkun: "Investasi Deposito Bank", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "103.02", namaAkun: "Penempatan Dana Likuiditas Lainnya", tipe: TipeAkunCoa.ASSET },

  // 1.4 — Aset Tetap
  { kodeAkun: "111.01", namaAkun: "Peralatan & Inventaris Kantor", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "111.02", namaAkun: "Kendaraan Dinas", tipe: TipeAkunCoa.ASSET },
  { kodeAkun: "111.03", namaAkun: "Akumulasi Penyusutan Aset Tetap", tipe: TipeAkunCoa.ASSET },

  // ══════════════════════════════════════════════════════════════════
  // KELOMPOK 2: KEWAJIBAN (LIABILITY)
  // ══════════════════════════════════════════════════════════════════

  // 2.1 — Kewajiban Jangka Pendek / Simpanan Anggota
  { kodeAkun: "201.01", namaAkun: "Simpanan Sukarela (Tabungan) Anggota", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "201.02", namaAkun: "Simpanan Berjangka (Deposito) Anggota", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "201.03", namaAkun: "Titipan Dana SHU Belum Diambil", tipe: TipeAkunCoa.LIABILITY },

  // 2.2 — Kewajiban Jangka Pendek / Hutang Operasional
  { kodeAkun: "202.01", namaAkun: "Hutang Bagi Hasil yang Masih Harus Dibayar", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "202.02", namaAkun: "Hutang Pajak Penghasilan (PPh)", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "202.03", namaAkun: "Biaya Operasional yang Masih Harus Dibayar", tipe: TipeAkunCoa.LIABILITY },
  { kodeAkun: "202.04", namaAkun: "Hutang kepada Pihak Ketiga / Bank", tipe: TipeAkunCoa.LIABILITY },

  // ══════════════════════════════════════════════════════════════════
  // KELOMPOK 3: EKUITAS / MODAL KOPERASI (EQUITY)
  // ══════════════════════════════════════════════════════════════════

  { kodeAkun: "301.01", namaAkun: "Simpanan Pokok Anggota (Modal Inti)", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.02", namaAkun: "Simpanan Wajib Anggota (Modal Sumbangan)", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.03", namaAkun: "Cadangan Umum Koperasi", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.04", namaAkun: "Cadangan Risiko / Dana Cadangan", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.05", namaAkun: "SHU Tahun Lalu (Belum Dibagikan)", tipe: TipeAkunCoa.EQUITY },
  { kodeAkun: "301.06", namaAkun: "SHU Berjalan (Tahun Ini)", tipe: TipeAkunCoa.EQUITY },

  // ══════════════════════════════════════════════════════════════════
  // KELOMPOK 4: PENDAPATAN (REVENUE)
  // ══════════════════════════════════════════════════════════════════

  { kodeAkun: "401.01", namaAkun: "Pendapatan Margin / Bagi Hasil Pembiayaan", tipe: TipeAkunCoa.REVENUE },
  { kodeAkun: "401.02", namaAkun: "Pendapatan Provisi & Administrasi Pembiayaan", tipe: TipeAkunCoa.REVENUE },
  { kodeAkun: "401.03", namaAkun: "Pendapatan Denda Keterlambatan Angsuran", tipe: TipeAkunCoa.REVENUE },
  { kodeAkun: "401.04", namaAkun: "Pendapatan Jasa Tabungan & Investasi", tipe: TipeAkunCoa.REVENUE },
  { kodeAkun: "401.05", namaAkun: "Pendapatan Non-Operasional Lainnya", tipe: TipeAkunCoa.REVENUE },

  // ══════════════════════════════════════════════════════════════════
  // KELOMPOK 5: BEBAN (EXPENSE)
  // ══════════════════════════════════════════════════════════════════

  { kodeAkun: "501.01", namaAkun: "Beban Bagi Hasil / Bunga Simpanan Anggota", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.02", namaAkun: "Beban Gaji, Tunjangan & Honorarium Pengurus", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.03", namaAkun: "Beban Administrasi Umum & ATK Kantor", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.04", namaAkun: "Beban Penyusutan Aset Tetap", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.05", namaAkun: "Beban Cadangan Kerugian Piutang", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.06", namaAkun: "Beban Listrik, Air & Komunikasi", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.07", namaAkun: "Beban Sewa Gedung & Fasilitas", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.08", namaAkun: "Beban Pajak & Perizinan", tipe: TipeAkunCoa.EXPENSE },
  { kodeAkun: "501.09", namaAkun: "Beban Operasional Lainnya", tipe: TipeAkunCoa.EXPENSE },
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

    // 2. Ambil seluruh pos akun + entri jurnal terkait untuk tenant ini
    let coaList = await prisma.chartOfAccount.findMany({
      where: { koperasiId: koperasi.id },
      include: { jurnalEntries: true },
      orderBy: { kodeAkun: "asc" },
    });

    // 3. Periksa akun-akun standar yang belum terdaftar pada database
    const existingCodes = new Set(coaList.map(c => c.kodeAkun));
    const missingSeeds = DEFAULT_COA_SEED.filter(seed => !existingCodes.has(seed.kodeAkun));

    if (missingSeeds.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const seed of missingSeeds) {
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

        // Catat stempel audit injeksi sinkronisasi
        await tx.auditLog.create({
          data: {
            userId: null,
            source: "AI_AGENT",
            action: "SEED_CHART_OF_ACCOUNTS",
            entityType: "COA",
            entityId: koperasi!.id,
            details: `Sinkronisasi otomatis menyisipkan ${missingSeeds.length} pos akun master standar yang belum terdaftar selesai dieksekusi.`,
          },
        });
      });

      // Muat ulang setelah sinkronisasi
      coaList = await prisma.chartOfAccount.findMany({
        where: { koperasiId: koperasi.id },
        include: { jurnalEntries: true },
        orderBy: { kodeAkun: "asc" },
      });
    }

    // 4. Hitung saldo terkini berdasarkan akumulasi entri jurnal
    const withSaldo = coaList.map(coa => {
      const validEntries = coa.jurnalEntries || [];
      const totalDebit = validEntries.reduce((acc: number, e: any) => acc + Number(e.debit), 0);
      const totalKredit = validEntries.reduce((acc: number, e: any) => acc + Number(e.kredit), 0);

      let saldoTerkini: number;
      if (coa.tipe === "ASSET" || coa.tipe === "EXPENSE") {
        saldoTerkini = Math.max(0, totalDebit - totalKredit);
      } else {
        saldoTerkini = Math.max(0, totalKredit - totalDebit);
      }

      return {
        id: coa.id,
        kodeAkun: coa.kodeAkun,
        namaAkun: coa.namaAkun,
        tipe: coa.tipe,
        isActive: coa.isActive,
        saldoTerkini,
        createdAt: coa.createdAt?.toISOString() || null,
        updatedAt: coa.updatedAt?.toISOString() || null,
      };
    });

    return { success: true, data: withSaldo };
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

/**
 * Memaksa sinkronisasi seluruh pos akun standar PSAK Koperasi ke database.
 * Hanya menyisipkan akun yang belum ada (idempoten / aman dijalankan berulang).
 * Dapat dipanggil dari tombol "Sinkronisasi CoA Standar" di antarmuka pengelola.
 */
export async function seedCoaStandarAction() {
  try {
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

    const existing = await prisma.chartOfAccount.findMany({
      where: { koperasiId: koperasi.id },
      select: { kodeAkun: true },
    });

    const existingCodes = new Set(existing.map(c => c.kodeAkun));
    const missingSeeds = DEFAULT_COA_SEED.filter(seed => !existingCodes.has(seed.kodeAkun));

    if (missingSeeds.length === 0) {
      return {
        success: true,
        message: `Semua ${DEFAULT_COA_SEED.length} pos akun standar sudah lengkap terdaftar. Tidak ada yang perlu ditambahkan.`,
        inserted: 0,
      };
    }

    await prisma.$transaction(async (tx) => {
      for (const seed of missingSeeds) {
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

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "AI_AGENT",
          action: "FORCE_SEED_COA_STANDAR",
          entityType: "COA",
          entityId: koperasi!.id,
          details: JSON.stringify({
            totalSeed: DEFAULT_COA_SEED.length,
            inserted: missingSeeds.length,
            kodeInserted: missingSeeds.map(s => s.kodeAkun),
          }),
        },
      });
    });

    revalidatePath("/coa");
    revalidatePath("/laporan");

    return {
      success: true,
      message: `Berhasil menyisipkan ${missingSeeds.length} dari ${DEFAULT_COA_SEED.length} pos akun standar PSAK Koperasi ke dalam buku besar.`,
      inserted: missingSeeds.length,
    };
  } catch (e: any) {
    console.error("[SEED_COA_STANDAR_ERROR]", e);
    return { success: false, error: "Gagal menjalankan sinkronisasi CoA standar." };
  }
}
