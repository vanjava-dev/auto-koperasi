"use server";

import { prisma } from "@/lib/prisma";

/**
 * Mengambil jumlah riil dari seluruh entitas aktif untuk memutakhirkan balon indikator navigasi (Sidebar Badges).
 */
export async function getSidebarStatsAction() {
  try {
    const [
      simpananList,
      pinjamanList,
      produkSimpList,
      produkPinjList,
      userList,
      koperasiList,
      coaList
    ] = await Promise.all([
      prisma.rekeningSimpanan.findMany(),
      (prisma as any).pinjaman ? (prisma as any).pinjaman.findMany() : Promise.resolve([]),
      prisma.produkSimpanan.findMany(),
      (prisma as any).produkPinjaman ? (prisma as any).produkPinjaman.findMany() : Promise.resolve([]),
      prisma.user.findMany(),
      prisma.koperasi.findMany(),
      prisma.chartOfAccount.findMany(),
    ]);

    return {
      success: true,
      data: {
        simpananCount: simpananList?.length || 0,
        pinjamanCount: pinjamanList?.length || 0,
        produkCount: (produkSimpList?.length || 0) + (produkPinjList?.length || 0),
        userCount: userList?.length || 0,
        cabangCount: koperasiList?.length || 0,
        coaCount: coaList?.length || 0,
        auditLogCount: "Live"
      }
    };
  } catch (e) {
    return {
      success: false,
      data: {
        simpananCount: 0,
        pinjamanCount: 0,
        produkCount: 0,
        userCount: 0,
        cabangCount: 0,
        coaCount: 0,
        auditLogCount: "Live"
      }
    };
  }
}
