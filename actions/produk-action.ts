"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { JenisSimpanan } from ".prisma/client";

/**
 * Mengambil katalog produk keuangan (Simpanan dan Pinjaman) beserta rujukan akun Buku Besar (CoA).
 * Jika kosong, sistem otomatis menyisipkan seeder awal yang terikat pada CoA riil.
 */
export async function getProdukListAction() {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      return { success: false, error: "Pangkalan data master koperasi belum terdaftar." };
    }

    // Ambil senarai CoA yang relevan untuk diikat
    const coaList = await prisma.chartOfAccount.findMany({
      where: { koperasiId: koperasi.id },
    });

    // Ambil produk simpanan
    let simpananList = await prisma.produkSimpanan.findMany({
      where: { koperasiId: koperasi.id },
      include: { coa: true },
      orderBy: { namaProduk: "asc" },
    });

    // Ambil produk pinjaman
    let pinjamanList = await prisma.produkPinjaman.findMany({
      where: { koperasiId: koperasi.id },
      include: { coaPiutang: true },
      orderBy: { namaProduk: "asc" },
    });

    // Injeksi seeder otomatis jika kedua portofolio kosong
    if (simpananList.length === 0 && pinjamanList.length === 0 && coaList.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Cari CoA untuk simpanan (Kewajiban)
        const coaSukarela = coaList.find(c => c.kodeAkun.includes("201.01") || c.tipe === "LIABILITY");
        const coaDeposito = coaList.find(c => c.kodeAkun.includes("201.02") || c.tipe === "LIABILITY");

        if (coaSukarela) {
          await tx.produkSimpanan.create({
            data: {
              koperasiId: koperasi.id,
              namaProduk: "Simpanan Sukarela Fleksibel",
              jenis: JenisSimpanan.SUKARELA,
              nisbahBagiHasil: 4.5,
              setoranAwalMin: 50000,
              saldoMin: 10000,
              coaId: coaSukarela.id,
              isActive: true,
            },
          });
        }

        if (coaDeposito) {
          await tx.produkSimpanan.create({
            data: {
              koperasiId: koperasi.id,
              namaProduk: "Deposito Berjangka 6 Bulan Premium",
              jenis: JenisSimpanan.BERJANGKA,
              nisbahBagiHasil: 6.5,
              setoranAwalMin: 5000000,
              saldoMin: 5000000,
              coaId: coaDeposito.id,
              isActive: true,
            },
          });
        }

        // Cari CoA untuk piutang pinjaman (Aset)
        const coaPiutang = coaList.find(c => c.kodeAkun.includes("101.03") || c.tipe === "ASSET");
        if (coaPiutang) {
          await tx.produkPinjaman.create({
            data: {
              koperasiId: koperasi.id,
              namaProduk: "Pembiayaan Mikro Mandiri",
              marginBunga: 12.0,
              plafonMax: 25000000,
              tenorMaxBulan: 24,
              coaPiutangId: coaPiutang.id,
              isActive: true,
            },
          });

          await tx.produkPinjaman.create({
            data: {
              koperasiId: koperasi.id,
              namaProduk: "Kredit MultiGuna Usaha",
              marginBunga: 13.5,
              plafonMax: 100000000,
              tenorMaxBulan: 48,
              coaPiutangId: coaPiutang.id,
              isActive: true,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: null,
            source: "AI_AGENT",
            action: "SEED_KATALOG_PRODUK",
            entityType: "PRODUK",
            entityId: koperasi.id,
            details: "Injeksi portofolio produk keuangan terikat pada pos CoA aktual selesai dieksekusi.",
          },
        });
      });

      // Muat ulang senarai setelah di-seed
      simpananList = await prisma.produkSimpanan.findMany({
        where: { koperasiId: koperasi.id },
        include: { coa: true },
        orderBy: { namaProduk: "asc" },
      });

      pinjamanList = await prisma.produkPinjaman.findMany({
        where: { koperasiId: koperasi.id },
        include: { coaPiutang: true },
        orderBy: { namaProduk: "asc" },
      });
    }

    return {
      success: true,
      data: {
        simpanan: simpananList.map((item: any) => ({
          ...item,
          nisbahBagiHasil: Number(item.nisbahBagiHasil),
          setoranAwalMin: Number(item.setoranAwalMin),
          saldoMin: Number(item.saldoMin),
          createdAt: item.createdAt?.toISOString() || null,
          updatedAt: item.updatedAt?.toISOString() || null,
          coa: item.coa ? {
            ...item.coa,
            saldoSekarang: Number(item.coa.saldoSekarang || 0),
            createdAt: item.coa.createdAt?.toISOString() || null,
            updatedAt: item.coa.updatedAt?.toISOString() || null,
          } : null,
        })),
        pinjaman: pinjamanList.map((item: any) => ({
          ...item,
          marginBunga: Number(item.marginBunga),
          plafonMax: Number(item.plafonMax),
          createdAt: item.createdAt?.toISOString() || null,
          updatedAt: item.updatedAt?.toISOString() || null,
          coaPiutang: item.coaPiutang ? {
            ...item.coaPiutang,
            saldoSekarang: Number(item.coaPiutang.saldoSekarang || 0),
            createdAt: item.coaPiutang.createdAt?.toISOString() || null,
            updatedAt: item.coaPiutang.updatedAt?.toISOString() || null,
          } : null,
        })),
        coas: coaList.map((item: any) => ({
          ...item,
          saldoSekarang: Number(item.saldoSekarang || 0),
          createdAt: item.createdAt?.toISOString() || null,
          updatedAt: item.updatedAt?.toISOString() || null,
        })),
      },
    };
  } catch (e: any) {
    console.error("[GET_PRODUK_LIST_ERROR]", e);
    return { success: false, error: "Gagal memuat portofolio produk keuangan dari peladen." };
  }
}

/**
 * Menyisipkan portofolio Produk Simpanan baru yang mengikat mutlak pada ID Akun Buku Besar (SOP Double-Entry).
 */
export async function createProdukSimpananAction(inputData: {
  namaProduk: string;
  jenis: JenisSimpanan;
  nisbahBagiHasil: number;
  setoranAwalMin: number;
  coaId: string;
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi belum terdaftar." };

    await prisma.$transaction(async (tx) => {
      const prd = await tx.produkSimpanan.create({
        data: {
          koperasiId: koperasi.id,
          namaProduk: inputData.namaProduk.trim(),
          jenis: inputData.jenis,
          nisbahBagiHasil: inputData.nisbahBagiHasil,
          setoranAwalMin: inputData.setoranAwalMin,
          saldoMin: 0,
          coaId: inputData.coaId,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "CREATE_PRODUK_SIMPANAN",
          entityType: "PRODUK",
          entityId: prd.id,
          details: JSON.stringify({ nama: prd.namaProduk, jenis: prd.jenis, coaId: prd.coaId }),
        },
      });
    });

    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_PRODUK_SIMPANAN_ERROR]", e);
    return { success: false, error: "Gagal menyimpan produk simpanan ke basis data." };
  }
}

/**
 * Menyisipkan portofolio Produk Pinjaman/Pembiayaan baru dengan ikatan pos piutang CoA.
 */
export async function createProdukPinjamanAction(inputData: {
  namaProduk: string;
  marginBunga: number;
  plafonMax: number;
  tenorMaxBulan: number;
  coaPiutangId: string;
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi belum terdaftar." };

    await prisma.$transaction(async (tx) => {
      const prd = await tx.produkPinjaman.create({
        data: {
          koperasiId: koperasi.id,
          namaProduk: inputData.namaProduk.trim(),
          marginBunga: inputData.marginBunga,
          plafonMax: inputData.plafonMax,
          tenorMaxBulan: inputData.tenorMaxBulan,
          coaPiutangId: inputData.coaPiutangId,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "CREATE_PRODUK_PINJAMAN",
          entityType: "PRODUK",
          entityId: prd.id,
          details: JSON.stringify({ nama: prd.namaProduk, plafon: prd.plafonMax, coaPiutangId: prd.coaPiutangId }),
        },
      });
    });

    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_PRODUK_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal menyimpan produk pembiayaan ke basis data." };
  }
}

/**
 * Memperbarui data portofolio Produk Simpanan riil di PostgreSQL.
 */
export async function updateProdukSimpananAction(id: string, inputData: {
  namaProduk: string;
  nisbahBagiHasil: number;
  setoranAwalMin: number;
}) {
  try {
    await prisma.produkSimpanan.update({
      where: { id },
      data: {
        namaProduk: inputData.namaProduk.trim(),
        nisbahBagiHasil: inputData.nisbahBagiHasil,
        setoranAwalMin: inputData.setoranAwalMin,
      },
    });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[UPDATE_PRODUK_SIMPANAN_ERROR]", e);
    return { success: false, error: "Gagal memperbarui parameter produk simpanan." };
  }
}

/**
 * Memperbarui data portofolio Produk Pembiayaan riil di PostgreSQL.
 */
export async function updateProdukPinjamanAction(id: string, inputData: {
  namaProduk: string;
  marginBunga: number;
  plafonMax: number;
}) {
  try {
    await prisma.produkPinjaman.update({
      where: { id },
      data: {
        namaProduk: inputData.namaProduk.trim(),
        marginBunga: inputData.marginBunga,
        plafonMax: inputData.plafonMax,
      },
    });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[UPDATE_PRODUK_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal memperbarui parameter produk pembiayaan." };
  }
}

/**
 * Menghapus/Mengarsipkan Produk Simpanan dari PostgreSQL.
 */
export async function deleteProdukSimpananAction(id: string) {
  try {
    await prisma.produkSimpanan.delete({ where: { id } });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[DELETE_PRODUK_SIMPANAN_ERROR]", e);
    return { success: false, error: "Gagal menghapus produk simpanan (mungkin masih terikat dengan rekening aktif)." };
  }
}

/**
 * Menghapus/Mengarsipkan Produk Pembiayaan dari PostgreSQL.
 */
export async function deleteProdukPinjamanAction(id: string) {
  try {
    await prisma.produkPinjaman.delete({ where: { id } });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (e: any) {
    console.error("[DELETE_PRODUK_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal menghapus produk pembiayaan (mungkin masih terikat dengan pinjaman aktif)." };
  }
}
