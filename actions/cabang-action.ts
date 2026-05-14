"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Mengambil senarai seluruh titik simpul cabang/koperasi riil dari tabel `koperasi`.
 */
export async function getCabangListAction() {
  try {
    const list = await prisma.koperasi.findMany({
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      data: list.map((k, index) => ({
        id: k.id,
        kode: k.badanHukumNo || (index === 0 ? "CAB-PUSAT" : `CAB-00${index}`),
        nama: k.nama,
        alamat: k.alamat || "Alamat belum terdaftar",
        telepon: k.telepon || "-",
        email: k.email || "-",
        isUtama: index === 0,
        createdAt: k.createdAt.toLocaleString("id-ID"),
      })),
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal memuat daftar topologi cabang." };
  }
}

/**
 * Mendaftarkan instansi cabang/koperasi baru ke dalam basis data.
 */
export async function createCabangAction(inputData: {
  kode: string;
  nama: string;
  alamat: string;
  telepon: string;
}) {
  try {
    // Validasi kode cabang (badanHukumNo digunakan sebagai kode rujukan topologi)
    const uniqueKode = inputData.kode.trim().toUpperCase() || `CAB-${Date.now().toString().slice(-4)}`;

    await prisma.$transaction(async (tx) => {
      const newCabang = await tx.koperasi.create({
        data: {
          nama: inputData.nama.trim(),
          badanHukumNo: uniqueKode,
          alamat: inputData.alamat.trim() || null,
          telepon: inputData.telepon.trim() || null,
        },
      });

      // Rekam log pendaftaran cabang
      await tx.auditLog.create({
        data: {
          source: "TOPOLOGY_MANAGER",
          action: "CREATE_CABANG",
          entityType: "CABANG",
          entityId: newCabang.id,
          details: JSON.stringify({ nama: newCabang.nama, kode: newCabang.badanHukumNo }),
        },
      });
    });

    revalidatePath("/cabang");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal mendaftarkan titik cabang baru." };
  }
}

/**
 * Memperbarui parameter redaksi titik cabang (koperasi) yang ada.
 */
export async function updateCabangAction(inputData: {
  id: string;
  kode: string;
  nama: string;
  alamat: string;
  telepon: string;
}) {
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.koperasi.update({
        where: { id: inputData.id },
        data: {
          nama: inputData.nama.trim(),
          badanHukumNo: inputData.kode.trim().toUpperCase(),
          alamat: inputData.alamat.trim() || null,
          telepon: inputData.telepon.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          source: "TOPOLOGY_MANAGER",
          action: "UPDATE_CABANG",
          entityType: "CABANG",
          entityId: updated.id,
          details: JSON.stringify({ nama: updated.nama, kode: updated.badanHukumNo }),
        },
      });
    });

    revalidatePath("/cabang");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal memutakhirkan parameter simpul cabang." };
  }
}
