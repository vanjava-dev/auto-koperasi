"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { JenisMutasi } from ".prisma/client";

// ── Skema Validasi Input ─────────────────────────────────────────
const SetoranSchema = z.object({
  rekeningId: z.string().uuid({ message: "Rekening tidak valid." }),
  nominal: z.number().positive({ message: "Nominal harus lebih dari nol." }),
  keterangan: z.string().optional(),
  coaKasId: z.string().uuid(),
  coaSimpananId: z.string().uuid(),
  koperasiId: z.string().uuid(),
});

const PenarikanSchema = SetoranSchema;

type ActionResult = { success: boolean; error?: string };

// ── Helper: Generate No. Referensi Jurnal ───────────────────────
function generateNoRef(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `JRN-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Server Action: Setoran Tunai Kasir ──────────────────────────
export async function processTellerSetoran(input: unknown): Promise<ActionResult> {
  const parsed = SetoranSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Ambil data rekening & hitung saldo baru
      const rekening = await tx.rekeningSimpanan.findUniqueOrThrow({
        where: { id: data.rekeningId },
      });
      const saldoBaru = Number(rekening.saldo) + data.nominal;
      const keterangan = data.keterangan ?? "Setoran tunai via kasir";
      const noRef = generateNoRef();

      // Operasi 1: Perbarui saldo rekening
      await tx.rekeningSimpanan.update({
        where: { id: data.rekeningId },
        data: { saldo: saldoBaru },
      });

      // Operasi 2: Catat riwayat mutasi
      const mutasi = await tx.mutasiSimpanan.create({
        data: {
          rekeningId: data.rekeningId,
          jenis: JenisMutasi.SETORAN,
          nominal: data.nominal,
          saldoSetelah: saldoBaru,
          keterangan,
        },
      });

      // Operasi 3: Buat jurnal double-entry otomatis (Aturan F)
      await tx.jurnal.create({
        data: {
          koperasiId: data.koperasiId,
          noReferensi: noRef,
          keterangan,
          source: "TELLER",
          entries: {
            create: [
              { coaId: data.coaKasId, debit: data.nominal, kredit: 0 },
              { coaId: data.coaSimpananId, debit: 0, kredit: data.nominal },
            ],
          },
        },
      });

      // Operasi 4: Audit log wajib (Aturan L)
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "SETORAN_SIMPANAN",
          entityType: "REKENING_SIMPANAN",
          entityId: data.rekeningId,
          details: JSON.stringify({
            saldoSebelum: Number(rekening.saldo),
            saldoSesudah: saldoBaru,
            nominal: data.nominal,
            keterangan,
            noReferensiJurnal: noRef,
          }),
        },
      });
    });

    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("[TELLER_SETORAN_ERROR]", e);
    return { success: false, error: "Gagal memproses setoran. Silakan coba lagi." };
  }
}

// ── Server Action: Penarikan Tunai Kasir ────────────────────────
export async function processTellerPenarikan(input: unknown): Promise<ActionResult> {
  const parsed = PenarikanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const rekening = await tx.rekeningSimpanan.findUniqueOrThrow({
        where: { id: data.rekeningId },
      });

      if (Number(rekening.saldo) < data.nominal) {
        throw new Error("Saldo rekening tidak mencukupi untuk penarikan ini.");
      }

      const saldoBaru = Number(rekening.saldo) - data.nominal;
      const keterangan = data.keterangan ?? "Penarikan tunai via kasir";
      const noRef = generateNoRef();

      await tx.rekeningSimpanan.update({
        where: { id: data.rekeningId },
        data: { saldo: saldoBaru },
      });

      await tx.mutasiSimpanan.create({
        data: {
          rekeningId: data.rekeningId,
          jenis: JenisMutasi.PENARIKAN,
          nominal: data.nominal,
          saldoSetelah: saldoBaru,
          keterangan,
        },
      });

      // Jurnal kebalikan: Dr. Simpanan Anggota / Cr. Kas Teller
      await tx.jurnal.create({
        data: {
          koperasiId: data.koperasiId,
          noReferensi: noRef,
          keterangan,
          source: "TELLER",
          entries: {
            create: [
              { coaId: data.coaSimpananId, debit: data.nominal, kredit: 0 },
              { coaId: data.coaKasId, debit: 0, kredit: data.nominal },
            ],
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "PENARIKAN_SIMPANAN",
          entityType: "REKENING_SIMPANAN",
          entityId: data.rekeningId,
          details: JSON.stringify({
            saldoSebelum: Number(rekening.saldo),
            saldoSesudah: saldoBaru,
            nominal: data.nominal,
            keterangan,
            noReferensiJurnal: noRef,
          }),
        },
      });
    });

    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memproses penarikan.";
    console.error("[TELLER_PENARIKAN_ERROR]", e);
    return { success: false, error: msg };
  }
}

// ── Fungsi Pendukung: Ambil Opsi Dropdown Kasir ─────────────────
export async function fetchTellerOptions() {
  const [rekening, coaKas, coaSimpanan] = await Promise.all([
    prisma.rekeningSimpanan.findMany({
      where: { status: "AKTIF" },
      include: { anggota: { select: { namaLengkap: true, nik: true } } },
      orderBy: { anggota: { namaLengkap: "asc" } },
      take: 100,
    }),
    prisma.chartOfAccount.findFirst({ where: { kodeAkun: "101.01" } }),
    prisma.chartOfAccount.findFirst({ where: { kodeAkun: "201.03" } }),
  ]);

  return { rekening, coaKas, coaSimpanan };
}
