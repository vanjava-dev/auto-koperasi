"use server";

import { prisma } from "@/lib/prisma";

/**
 * Mengambil rekam jejak aktivitas audit (Audit Trail) riil dari pangkalan data Prisma
 * untuk dipaparkan secara dinamis pada antarmuka Pengaturan Sistem.
 */
export async function fetchAuditLogsAction(limit: number = 20) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, data: logs };
  } catch (e) {
    return { success: false, error: "Gagal menarik data jejak audit sistem." };
  }
}
