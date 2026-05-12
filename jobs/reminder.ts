import { prisma } from "@/lib/prisma";
import { StatusJadwal } from ".prisma/client";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export async function runReminderJob() {
  console.log("[CRON_START] runReminderJob...");
  const today = new Date();
  const targetH7 = addDays(today, 7);
  const targetH1 = addDays(today, 1);
  let remindersSent = 0;

  try {
    // Ambil jadwal aktif yang statusnya belum dibayar lunas
    const activeSchedules = await prisma.jadwalAngsuran.findMany({
      where: {
        status: { not: StatusJadwal.DIBAYAR },
      },
      select: {
        id: true,
        jatuhTempo: true,
        totalTagihan: true,
        pinjamanId: true,
      },
    });

    for (const schedule of activeSchedules) {
      const jatuhTempo = new Date(schedule.jatuhTempo);
      let tipeReminder: "H-7" | "H-1" | null = null;

      if (isSameDay(jatuhTempo, targetH7)) {
        tipeReminder = "H-7";
      } else if (isSameDay(jatuhTempo, targetH1)) {
        tipeReminder = "H-1";
      }

      if (tipeReminder) {
        const pinjaman = await prisma.pinjaman.findUnique({
          where: { id: schedule.pinjamanId, status: "AKTIF" },
          include: { anggota: true },
        });

        if (!pinjaman || !pinjaman.anggota) continue;

        const { anggota } = pinjaman;
        const pesan = `Halo ${anggota.namaLengkap}, mengingatkan bahwa angsuran pinjaman ${pinjaman.noKontrak} senilai Rp ${Number(schedule.totalTagihan).toLocaleString("id-ID")} akan jatuh tempo pada ${jatuhTempo.toLocaleDateString("id-ID")}. Mohon siapkan dana pada rekening simpanan Anda.`;

        await prisma.auditLog.create({
          data: {
            userId: null,
            source: "CRON",
            action: `SEND_WA_REMINDER_${tipeReminder.replace("-", "")}`,
            entityType: "JADWAL_ANGSURAN",
            entityId: schedule.id,
            details: JSON.stringify({
              noKontrak: pinjaman.noKontrak,
              noHp: anggota.noHp ?? "Tidak tersedia",
              tipe: tipeReminder,
              pesanPemicu: pesan,
            }),
          },
        });

        remindersSent++;
      }
    }

    console.log(`[CRON_SUCCESS] Pindai pengingat selesai. Total pesan dikirim: ${remindersSent}.`);
    return { success: true, remindersSent };
  } catch (e) {
    console.error("[CRON_REMINDER_ERROR]", e);
    return { success: false, error: e instanceof Error ? e.message : "Galat pengirim pengingat" };
  }
}
