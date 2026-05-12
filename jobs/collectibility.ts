import { prisma } from "@/lib/prisma";
import { Kolektibilitas, StatusJadwal } from ".prisma/client";

function differenceInDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function determineKolektibilitas(daysLate: number): Kolektibilitas {
  if (daysLate <= 0) return Kolektibilitas.LANCAR;
  if (daysLate <= 30) return Kolektibilitas.DALAM_PERHATIAN_KHUSUS;
  if (daysLate <= 90) return Kolektibilitas.KURANG_LANCAR;
  if (daysLate <= 180) return Kolektibilitas.DIRAGUKAN;
  return Kolektibilitas.MACET;
}

export async function runCollectibilityJob() {
  console.log("[CRON_START] runCollectibilityJob...");
  const today = new Date();
  let updatedCount = 0;

  try {
    const overdueSchedules = await prisma.jadwalAngsuran.findMany({
      where: {
        status: { not: StatusJadwal.DIBAYAR },
        jatuhTempo: { lt: today },
        pinjaman: { status: "AKTIF" },
      },
      include: { pinjaman: true },
    });

    for (const schedule of overdueSchedules) {
      const daysLate = differenceInDays(today, new Date(schedule.jatuhTempo));
      const newKolektibilitas = determineKolektibilitas(daysLate);

      if (schedule.pinjaman.kolektibilitas !== newKolektibilitas) {
        await prisma.$transaction(async (tx) => {
          await tx.pinjaman.update({
            where: { id: schedule.pinjaman.id },
            data: { kolektibilitas: newKolektibilitas },
          });

          await tx.auditLog.create({
            data: {
              userId: null,
              source: "CRON",
              action: "UPDATE_KOLEKTIBILITAS",
              entityType: "PINJAMAN",
              entityId: schedule.pinjaman.id,
              details: JSON.stringify({
                noKontrak: schedule.pinjaman.noKontrak,
                hariKeterlambatan: daysLate,
                kolektibilitasLama: schedule.pinjaman.kolektibilitas,
                kolektibilitasBaru: newKolektibilitas,
              }),
            },
          });
        });

        updatedCount++;
      }
    }

    console.log(`[CRON_SUCCESS] Kolektibilitas diperbarui untuk ${updatedCount} pinjaman.`);
    return { success: true, updatedCount };
  } catch (e) {
    console.error("[CRON_COLLECTIBILITY_ERROR]", e);
    return { success: false, error: e instanceof Error ? e.message : "Galat tidak dikenal" };
  }
}
