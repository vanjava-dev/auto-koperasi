"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StatusAnggota } from ".prisma/client";

// ── Skema Validasi ───────────────────────────────────────────────
const DaftarAnggotaSchema = z.object({
  koperasiId: z.string().uuid(),
  nik: z.string().length(16, { message: "NIK harus 16 digit." }),
  namaLengkap: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
  tanggalLahir: z.string().optional(),
  tempatLahir: z.string().optional(),
  ktpImageUrl: z.string().optional(),
  ocrVerified: z.boolean().optional().default(false),
});

const UpdateStatusAnggotaSchema = z.object({
  anggotaId: z.string().uuid(),
  status: z.nativeEnum(StatusAnggota),
});

type ActionResult = { success: boolean; error?: string };

// ── Server Action: Daftarkan Anggota Baru ───────────────────────
export async function daftarAnggotaBaru(input: unknown): Promise<ActionResult> {
  const parsed = DaftarAnggotaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const existing = await prisma.anggota.findUnique({ where: { nik: data.nik } });
  if (existing) {
    return { success: false, error: "NIK sudah terdaftar di sistem." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.create({
        data: {
          koperasiId: data.koperasiId,
          nik: data.nik,
          namaLengkap: data.namaLengkap,
          alamat: data.alamat,
          noHp: data.noHp,
          tempatLahir: data.tempatLahir,
          tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
          ktpImageUrl: data.ktpImageUrl,
          ocrVerified: data.ocrVerified ?? false,
          status: StatusAnggota.MENUNGGU,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "DAFTAR_ANGGOTA_BARU",
          entityType: "ANGGOTA",
          entityId: anggota.id,
          details: JSON.stringify({
            nik: data.nik,
            namaLengkap: data.namaLengkap,
            ocrVerified: data.ocrVerified,
            status: "MENUNGGU",
          }),
        },
      });
    });

    revalidatePath("/dashboard/anggota");
    return { success: true };
  } catch (e) {
    console.error("[DAFTAR_ANGGOTA_ERROR]", e);
    return { success: false, error: "Gagal mendaftarkan anggota. Silakan coba lagi." };
  }
}

// ── Server Action: Perbarui Status Anggota ──────────────────────
export async function updateStatusAnggota(input: unknown): Promise<ActionResult> {
  const parsed = UpdateStatusAnggotaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { anggotaId, status } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUniqueOrThrow({ where: { id: anggotaId } });

      await tx.anggota.update({ where: { id: anggotaId }, data: { status } });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "UPDATE_STATUS_ANGGOTA",
          entityType: "ANGGOTA",
          entityId: anggotaId,
          details: JSON.stringify({ statusSebelum: anggota.status, statusSesudah: status }),
        },
      });
    });

    revalidatePath("/dashboard/anggota");
    return { success: true };
  } catch (e) {
    console.error("[UPDATE_STATUS_ANGGOTA_ERROR]", e);
    return { success: false, error: "Gagal memperbarui status anggota." };
  }
}

// ── Fungsi Pendukung: Ambil Data Anggota ────────────────────────
export async function fetchDaftarAnggota() {
  return prisma.anggota.findMany({
    orderBy: { joinDate: "desc" },
    take: 50,
  });
}
