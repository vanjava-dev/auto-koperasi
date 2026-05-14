"use server";

import { prisma } from "@/lib/prisma";

/**
 * Mengambil data entri jurnal dan buku besar (Double-Entry) riil dari database
 * untuk disajikan pada halaman Jurnal Umum tanpa rekayasa data dummy.
 */
export async function getJurnalEntriesAction() {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      return { success: false, error: "Koperasi master belum terdaftar." };
    }

    // Ambil baris JurnalEntry yang berafiliasi dengan koperasi bersangkutan
    const entries = await prisma.jurnalEntry.findMany({
      where: {
        jurnal: { koperasiId: koperasi.id },
      },
      include: {
        jurnal: true,
        coa: true,
      },
      orderBy: [
        { jurnal: { tanggal: "desc" } },
        { id: "asc" },
      ],
    });

    const mapped = entries.map((ent) => ({
      id: ent.jurnal?.noReferensi || "JRN-UNKNOWN",
      date: ent.jurnal?.tanggal 
        ? new Date(ent.jurnal.tanggal).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      desc: ent.jurnal?.keterangan || "Tanpa Keterangan",
      account: ent.coa ? `${ent.coa.kodeAkun} ${ent.coa.namaAkun}` : "Akun Tidak Diketahui",
      coa: ent.coa?.kodeAkun || "-",
      debit: Number(ent.debit),
      kredit: Number(ent.kredit),
    }));

    return {
      success: true,
      data: mapped,
    };
  } catch (e: any) {
    console.error("[GET_JURNAL_ENTRIES_ERROR]", e);
    return { success: false, error: "Gagal memuat buku besar dari pangkalan data." };
  }
}

import { revalidatePath } from "next/cache";

/**
 * Memposting jurnal penyesuaian manual ganda (Double-Entry) secara langsung
 * ke pangkalan data beserta pencatatan jejak audit (Audit Trail) atomik wajib.
 */
export async function createJurnalManualAction(input: {
  keterangan: string;
  entries: { coaId: string; debit: number; kredit: number }[];
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      return { success: false, error: "Koperasi master belum terdaftar." };
    }

    if (!input.keterangan || input.keterangan.trim() === "") {
      return { success: false, error: "Keterangan jurnal wajib diisi." };
    }

    if (!input.entries || input.entries.length < 2) {
      return { success: false, error: "Jurnal minimal membutuhkan dua baris entri (Double-Entry)." };
    }

    // Validasi keseimbangan debit dan kredit
    const totalDebit = input.entries.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
    const totalKredit = input.entries.reduce((acc, curr) => acc + Number(curr.kredit || 0), 0);

    if (Math.abs(totalDebit - totalKredit) > 0.01) {
      return { success: false, error: "Total Debit dan Kredit tidak seimbang (Unbalanced Journal)." };
    }

    if (totalDebit <= 0) {
      return { success: false, error: "Nominal transaksi jurnal harus lebih besar dari nol." };
    }

    // Nomor referensi unik
    const timestamp = Date.now().toString().slice(-6);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const noReferensi = `JRN-${dateStr}-${timestamp}`;

    // Jalankan dalam satu transaksi atomik wajib dengan Audit Log
    await prisma.$transaction(async (tx) => {
      const jurnal = await tx.jurnal.create({
        data: {
          koperasiId: koperasi.id,
          noReferensi,
          keterangan: input.keterangan,
          source: "MANUAL",
          entries: {
            create: input.entries.map((ent) => ({
              coaId: ent.coaId,
              debit: ent.debit,
              kredit: ent.kredit,
            })),
          },
        },
      });

      // Audit Log wajib sesuai aturan keras arsitektur
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "POSTING_JURNAL_MANUAL",
          entityType: "JURNAL",
          entityId: jurnal.id,
          details: JSON.stringify({
            noReferensi,
            keterangan: input.keterangan,
            totalDebit,
            totalKredit,
            baris: input.entries.length,
          }),
        },
      });
    });

    revalidatePath("/jurnal");
    revalidatePath("/laporan");
    revalidatePath("/coa");

    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_JURNAL_MANUAL_ERROR]", e);
    return { success: false, error: e?.message || "Terjadi kesalahan sistem saat memposting jurnal." };
  }
}

