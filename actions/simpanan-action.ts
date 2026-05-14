"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { JenisMutasi, JenisSimpanan } from ".prisma/client";

/**
 * Mengambil data gabungan untuk antarmuka dasbor portofolio Simpanan.
 * Jika tabel kosong, otomatis memprovisikan rekening bawaan untuk anggota terdaftar.
 */
export async function getSimpananDashboardDataAction() {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi belum terdaftar di pangkalan data." };

    // 1. Ambil seluruh rekening simpanan
    let rekeningList = await prisma.rekeningSimpanan.findMany({
      where: { anggota: { koperasiId: koperasi.id } },
      include: {
        anggota: true,
        produk: true,
        mutasi: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Logika seeder otomatis dinonaktifkan sesuai SOP (Pure Pristine State)
    // Nasabah / sistem wajib membuka tabungan baru secara sadar melalui antarmuka
    if (rekeningList.length === 0) {
      // Tidak melakukan penyisipan baris dummy
    }

    // 3. Hitung ringkasan saldo berdasarkan jenis produk
    let totalSukarela = 0;
    let totalWajib = 0;
    let totalDeposito = 0;
    let totalPokok = 0;

    for (const r of rekeningList) {
      const bal = Number(r.saldo);
      if (r.produk?.jenis === JenisSimpanan.SUKARELA) totalSukarela += bal;
      else if (r.produk?.jenis === JenisSimpanan.WAJIB) totalWajib += bal;
      else if (r.produk?.jenis === JenisSimpanan.BERJANGKA) totalDeposito += bal;
      else if (r.produk?.jenis === JenisSimpanan.POKOK) totalPokok += bal;
      else totalSukarela += bal; // fallback
    }

    // Ambil senarai opsi anggota dan produk untuk dropdown dialog aktivasi
    const anggotaOptions = await prisma.anggota.findMany({
      where: { koperasiId: koperasi.id },
      select: { id: true, namaLengkap: true, nik: true },
    });

    const produkOptions = await prisma.produkSimpanan.findMany({
      where: { koperasiId: koperasi.id, isActive: true },
      select: { id: true, namaProduk: true, jenis: true },
    });

    return {
      success: true,
      data: {
        rekeningList: rekeningList.map((r: any) => ({
          ...r,
          saldo: Number(r.saldo),
          createdAt: r.createdAt?.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
          anggota: r.anggota ? {
            ...r.anggota,
            createdAt: r.anggota.createdAt?.toISOString(),
            updatedAt: r.anggota.updatedAt?.toISOString(),
            tanggalLahir: r.anggota.tanggalLahir?.toISOString(),
          } : null,
          produk: r.produk ? {
            ...r.produk,
            nisbahBagiHasil: Number(r.produk.nisbahBagiHasil),
            setoranAwalMin: Number(r.produk.setoranAwalMin),
            saldoMin: Number(r.produk.saldoMin),
            createdAt: r.produk.createdAt?.toISOString(),
            updatedAt: r.produk.updatedAt?.toISOString(),
          } : null,
          mutasi: r.mutasi?.map((m: any) => ({
            ...m,
            nominal: Number(m.nominal || 0),
            saldoSetelah: Number(m.saldoSetelah || 0),
            jumlah: Number(m.jumlah || m.nominal || 0),
            saldoAkhir: Number(m.saldoAkhir || m.saldoSetelah || 0),
            createdAt: m.createdAt?.toISOString(),
          })) || [],
        })),
        summary: { totalSukarela, totalWajib, totalDeposito, totalPokok },
        options: { anggotaOptions, produkOptions },
      },
    };
  } catch (e: any) {
    console.error("[GET_SIMPANAN_DASHBOARD_ERROR]", e);
    return { success: false, error: "Gagal memuat data dasbor portofolio simpanan." };
  }
}

/**
 * Aktivasi rekening simpanan baru secara persisten.
 */
export async function createRekeningSimpananAction(inputData: {
  anggotaId: string;
  produkId: string;
  setoranAwal: number;
}) {
  try {
    const prd = await prisma.produkSimpanan.findUnique({
      where: { id: inputData.produkId },
      include: { coa: true },
    });

    const ang = await prisma.anggota.findUnique({
      where: { id: inputData.anggotaId },
    });

    if (!prd || !ang) return { success: false, error: "Entitas Anggota atau Produk tidak valid." };

    await prisma.$transaction(async (tx) => {
      // 1. Buat rekening
      const prefix = prd.jenis === "SUKARELA" ? "SK" : prd.jenis === "WAJIB" ? "WJ" : prd.jenis === "BERJANGKA" ? "DP" : "PK";
      const randomDigit = Math.floor(1000 + Math.random() * 9000);
      const noRek = `014-${prefix}-${randomDigit}`;

      const newRek = await tx.rekeningSimpanan.create({
        data: {
          noRekening: noRek,
          anggotaId: ang.id,
          produkId: prd.id,
          saldo: inputData.setoranAwal,
          status: "AKTIF",
        },
      });

      // 2. Jika ada setoran awal, sisipkan mutasi dan jurnal ganda SSOT
      if (inputData.setoranAwal > 0) {
        await tx.mutasiSimpanan.create({
          data: {
            rekeningId: newRek.id,
            jenis: JenisMutasi.SETORAN,
            nominal: inputData.setoranAwal,
            saldoSetelah: inputData.setoranAwal,
            keterangan: `Setoran awal pembukaan rekening ${prd.namaProduk}`,
          },
        });

        // Cari akun Kas Teller utama sebagai penampung debit kas
        const coaKas = await tx.chartOfAccount.findFirst({
          where: { koperasiId: prd.koperasiId, kodeAkun: { startsWith: "101" } },
        });

        if (coaKas && prd.coaId) {
          const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const noRef = `JRN-${d}-${Math.floor(1000 + Math.random() * 9000)}`;

          await tx.jurnal.create({
            data: {
              koperasiId: prd.koperasiId,
              noReferensi: noRef,
              keterangan: `Setoran awal pembukaan rekening ${noRek} atas nama ${ang.namaLengkap}`,
              source: "PORTFOLIO_AKTIVASI",
              entries: {
                create: [
                  { coaId: coaKas.id, debit: inputData.setoranAwal, kredit: 0 },
                  { coaId: prd.coaId, debit: 0, kredit: inputData.setoranAwal },
                ],
              },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "CREATE_REKENING_SIMPANAN",
          entityType: "REKENING",
          entityId: newRek.id,
          details: `Aktivasi rekening ${noRek} untuk ${ang.namaLengkap} terikat ke pos CoA ${prd.coa?.kodeAkun || "-"} sukses.`,
        },
      });
    });

    revalidatePath("/dashboard/simpanan");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_REKENING_ERROR]", e);
    return { success: false, error: "Gagal mengaktivasi buku tabungan baru di pangkalan data." };
  }
}

/**
 * Memproses setoran atau penarikan riil pada rekening simpanan.
 */
export async function createMutasiSimpananAction(inputData: {
  rekeningId: string;
  jenis: "SETORAN" | "PENARIKAN";
  nominal: number;
}) {
  try {
    const rek = await prisma.rekeningSimpanan.findUnique({
      where: { id: inputData.rekeningId },
      include: { produk: true },
    });

    if (!rek) return { success: false, error: "Rekening tidak ditemukan." };

    // Validasi bisnis mutlak
    if (inputData.jenis === "PENARIKAN") {
      if (rek.produk?.jenis === "POKOK" || rek.produk?.jenis === "WAJIB") {
        return { success: false, error: "Simpanan Pokok dan Wajib tidak dapat ditarik selama status keanggotaan masih aktif." };
      }

      if (Number(rek.saldo) < inputData.nominal) {
        return { success: false, error: `Saldo tidak mencukupi. Saldo saat ini: Rp ${Number(rek.saldo).toLocaleString("id-ID")}` };
      }
    }

    await prisma.$transaction(async (tx) => {
      const currentBal = Number(rek.saldo);
      const newBal = inputData.jenis === "SETORAN" ? currentBal + inputData.nominal : currentBal - inputData.nominal;

      // 1. Perbarui saldo mutlak
      await tx.rekeningSimpanan.update({
        where: { id: rek.id },
        data: { saldo: newBal },
      });

      // 2. Sisipkan baris riwayat mutasi
      await tx.mutasiSimpanan.create({
        data: {
          rekeningId: rek.id,
          jenis: inputData.jenis === "SETORAN" ? JenisMutasi.SETORAN : JenisMutasi.PENARIKAN,
          nominal: inputData.nominal,
          saldoSetelah: newBal,
          keterangan: `Transaksi ${inputData.jenis === "SETORAN" ? "Setoran Tunai" : "Penarikan Dana"} melalui konter teller`,
        },
      });

      // Cari akun Kas Teller utama
      const coaKas = await tx.chartOfAccount.findFirst({
        where: { koperasiId: rek.produk?.koperasiId || "KOP-MASTER", kodeAkun: { startsWith: "101" } },
      });

      if (coaKas && rek.produk?.coaId) {
        const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const noRef = `JRN-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
        const isSetor = inputData.jenis === "SETORAN";

        await tx.jurnal.create({
          data: {
            koperasiId: rek.produk.koperasiId,
            noReferensi: noRef,
            keterangan: `Mutasi ${inputData.jenis} portofolio rekening ${rek.noRekening}`,
            source: "PORTFOLIO_MUTASI",
            entries: {
              create: isSetor
                ? [
                    { coaId: coaKas.id, debit: inputData.nominal, kredit: 0 },
                    { coaId: rek.produk.coaId, debit: 0, kredit: inputData.nominal },
                  ]
                : [
                    { coaId: rek.produk.coaId, debit: inputData.nominal, kredit: 0 },
                    { coaId: coaKas.id, debit: 0, kredit: inputData.nominal },
                  ],
            },
          },
        });
      }

      // 3. Stempel audit trail
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: `MUTASI_${inputData.jenis}`,
          entityType: "REKENING",
          entityId: rek.id,
          details: `Mutasi ${inputData.jenis} sebesar Rp ${inputData.nominal.toLocaleString("id-ID")} berhasil dieksekusi. Saldo akhir: Rp ${newBal.toLocaleString("id-ID")}`,
        },
      });
    });

    revalidatePath("/dashboard/simpanan");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_MUTASI_ERROR]", e);
    return { success: false, error: "Gagal memproses transaksi mutasi simpanan." };
  }
}
