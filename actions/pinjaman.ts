"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StatusPinjaman } from ".prisma/client";

// ── Skema Validasi ───────────────────────────────────────────────
const AjukanPinjamanSchema = z.object({
  anggotaId: z.string().uuid(),
  produkId: z.string().uuid(),
  koperasiId: z.string().uuid(),
  plafon: z.number().positive(),
  tenorBulan: z.number().int().positive().max(60),
});

const UpdateStatusPinjamanSchema = z.object({
  pinjamanId: z.string().uuid(),
  status: z.nativeEnum(StatusPinjaman),
  coaPiutangId: z.string().uuid().optional(),
  coaKasId: z.string().uuid().optional(),
  koperasiId: z.string().uuid().optional(),
});

type ActionResult = { success: boolean; error?: string };

// ── Helper: No. Referensi Jurnal ────────────────────────────────
function generateNoRef(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `JRN-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Server Action: Ajukan Pinjaman Baru ────────────────────────
export async function ajukanPinjaman(input: unknown): Promise<ActionResult> {
  const parsed = AjukanPinjamanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const produk = await tx.produkPinjaman.findUniqueOrThrow({ where: { id: data.produkId } });

      if (data.plafon > Number(produk.plafonMax)) {
        throw new Error(
          `Plafon melebihi batas maksimum: Rp ${Number(produk.plafonMax).toLocaleString("id-ID")}.`
        );
      }

      const margin = Number(produk.marginBunga);
      const totalBunga = (data.plafon * margin / 100) * data.tenorBulan;
      const totalAngsuran = data.plafon + totalBunga;
      const noKontrak = `KNT-${Date.now()}`;

      await tx.pinjaman.create({
        data: {
          noKontrak,
          anggotaId: data.anggotaId,
          produkId: data.produkId,
          plafon: data.plafon,
          marginBunga: margin,
          tenorBulan: data.tenorBulan,
          totalAngsuran,
          sisaHutang: totalAngsuran,
          status: StatusPinjaman.PENGAJUAN,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "AJUKAN_PINJAMAN",
          entityType: "PINJAMAN",
          entityId: noKontrak,
          details: JSON.stringify({
            anggotaId: data.anggotaId,
            plafon: data.plafon,
            tenorBulan: data.tenorBulan,
            totalAngsuran,
          }),
        },
      });
    });

    revalidatePath("/dashboard/portofolio");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal mengajukan pinjaman.";
    console.error("[AJUKAN_PINJAMAN_ERROR]", e);
    return { success: false, error: msg };
  }
}

// ── Server Action: Setujui & Cairkan Pinjaman ──────────────────
export async function setujuiDanCairkanPinjaman(input: unknown): Promise<ActionResult> {
  const parsed = UpdateStatusPinjamanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { pinjamanId, status, coaPiutangId, coaKasId, koperasiId } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const pinjaman = await tx.pinjaman.findUniqueOrThrow({ where: { id: pinjamanId } });

      await tx.pinjaman.update({
        where: { id: pinjamanId },
        data: {
          status,
          approvedAt: status === StatusPinjaman.DISETUJUI ? new Date() : undefined,
          disbursedAt: status === StatusPinjaman.AKTIF ? new Date() : undefined,
        },
      });

      // Jika pencairan, buat jurnal Dr. Piutang / Cr. Kas
      if (status === StatusPinjaman.AKTIF && coaPiutangId && coaKasId && koperasiId) {
        await tx.jurnal.create({
          data: {
            koperasiId,
            noReferensi: generateNoRef(),
            keterangan: `Pencairan pinjaman ${pinjaman.noKontrak}`,
            source: "TELLER",
            entries: {
              create: [
                { coaId: coaPiutangId, debit: Number(pinjaman.plafon), kredit: 0 },
                { coaId: coaKasId, debit: 0, kredit: Number(pinjaman.plafon) },
              ],
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: `STATUS_PINJAMAN_${status}`,
          entityType: "PINJAMAN",
          entityId: pinjamanId,
          details: JSON.stringify({
            noKontrak: pinjaman.noKontrak,
            statusSebelum: pinjaman.status,
            statusSesudah: status,
          }),
        },
      });
    });

    revalidatePath("/dashboard/portofolio");
    return { success: true };
  } catch (e) {
    console.error("[SETUJUI_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal memperbarui status pinjaman." };
  }
}

// ── Fungsi Pendukung ────────────────────────────────────────────
export async function fetchDaftarPinjaman() {
  return prisma.pinjaman.findMany({
    include: {
      anggota: { select: { namaLengkap: true } },
      produk: { select: { namaProduk: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
