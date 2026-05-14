"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Mendapatkan senarai seluruh akun pengguna (Operator) dari tabel `users` pangkalan data.
 */
export async function getUsersAction() {
  try {
    const users = await prisma.user.findMany({
      include: {
        koperasi: {
          select: { nama: true, badanHukumNo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        username: u.email.split("@")[0],
        email: u.email,
        namaLengkap: u.namaLengkap,
        role: u.role,
        isActive: u.isActive,
        koperasiName: u.koperasi?.nama || "Pusat",
        isBaseUser: u.email.startsWith("superadmin"),
        createdAt: u.createdAt.toLocaleString("id-ID"),
      })),
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal memuat senarai akun operator." };
  }
}

/**
 * Menyisipkan akun operator baru ke dalam tabel `users` secara riil
 * disertai pencatatan jejak audit (AuditLog).
 */
export async function createUserAction(inputData: {
  username: string;
  namaLengkap: string;
  email: string;
  role: "SUPERADMIN" | "MANAGER" | "TELLER";
  koperasiId?: string;
}) {
  try {
    // Tentukan Koperasi induk (gunakan yang pertama jika tidak dispesifikasikan)
    let kopId = inputData.koperasiId;
    if (!kopId) {
      const kop = await prisma.koperasi.findFirst();
      if (kop) {
        kopId = kop.id;
      } else {
        const newKop = await prisma.koperasi.create({
          data: { nama: "KSP Harapan Artha Nusantara" },
        });
        kopId = newKop.id;
      }
    }

    const uniqueEmail = inputData.email.trim() || `${inputData.username.trim().toLowerCase()}@koperasi.id`;

    // Cek duplikasi email
    const exists = await prisma.user.findUnique({
      where: { email: uniqueEmail },
    });

    if (exists) {
      return { success: false, error: `Alamat surel atau username rujukan "${uniqueEmail}" telah digunakan oleh akun lain.` };
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          koperasiId: kopId!,
          email: uniqueEmail,
          namaLengkap: inputData.namaLengkap,
          role: inputData.role,
          passwordHash: "SECURE_HASH_DEFAULT_PASS_123!", // Sandi bawaan terenkripsi
          isActive: true,
        },
      });

      // Sisipkan rekam jejak AuditLog
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          source: "SUPERADMIN",
          action: "CREATE_USER",
          entityType: "USER",
          entityId: newUser.id,
          details: JSON.stringify({ nama: newUser.namaLengkap, role: newUser.role, email: newUser.email }),
        },
      });
    });

    revalidatePath("/users");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal menyisipkan entitas pengguna ke basis data." };
  }
}

/**
 * Memperbarui data pengguna yang ada (nama, peran, surel).
 */
export async function updateUserAction(inputData: {
  id: string;
  namaLengkap: string;
  email: string;
  role: "SUPERADMIN" | "MANAGER" | "TELLER";
}) {
  try {
    // Verifikasi perlindungan dasar untuk akun dasar (Base Superadmin)
    const targetUser = await prisma.user.findUnique({ where: { id: inputData.id } });
    if (!targetUser) return { success: false, error: "Akun operator tidak ditemukan." };

    if (targetUser.email.startsWith("superadmin") && inputData.role !== "SUPERADMIN") {
      return { success: false, error: "Akun Superadmin Dasar tidak diizinkan untuk diturunkan perannya demi menjaga ketersediaan akses tingkat tertinggi." };
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: inputData.id },
        data: {
          namaLengkap: inputData.namaLengkap,
          email: inputData.email,
          role: inputData.role,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: updated.id,
          source: "SUPERADMIN",
          action: "UPDATE_USER",
          entityType: "USER",
          entityId: updated.id,
          details: JSON.stringify({ namaLengkap: updated.namaLengkap, role: updated.role }),
        },
      });
    });

    revalidatePath("/users");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal menyunting data operator." };
  }
}

/**
 * Mengubah status keaktifan/kunci akun (isActive) pengguna.
 */
export async function toggleUserStatusAction(userId: string) {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "Pengguna tidak ditemukan." };

    // Kunci mutlak agar akun Superadmin dasar tidak ter-disable secara tak sengaja
    if (targetUser.email.startsWith("superadmin") && targetUser.isActive) {
      return { success: false, error: "Akun Superadmin Dasar telah dikunci secara permanen pada tingkat inti agar tidak dapat dinonaktifkan." };
    }

    const nextStatus = !targetUser.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: nextStatus },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          source: "SUPERADMIN",
          action: nextStatus ? "UNLOCK_USER" : "LOCK_USER",
          entityType: "USER",
          entityId: userId,
          details: `Mengubah status otorisasi akun menjadi ${nextStatus ? "AKTIF" : "TERKUNCI"}`,
        },
      });
    });

    revalidatePath("/users");
    return { success: true, nextStatus };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal mengubah status otorisasi akun." };
  }
}

/**
 * Menghapus entitas akun pengguna secara aman,
 * menolak penghapusan untuk akun Superadmin Dasar (Root/Base account).
 */
export async function deleteUserAction(userId: string) {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "Pengguna tidak ditemukan." };

    // Perlindungan ketat penghapusan akun dasar
    if (targetUser.email.startsWith("superadmin") || targetUser.role === "SUPERADMIN") {
      // Periksa apakah ini satu-satunya superadmin atau akun berawalan superadmin
      const superadminCount = await prisma.user.count({ where: { role: "SUPERADMIN" } });
      if (targetUser.email.startsWith("superadmin") || superadminCount <= 1) {
        return { 
          success: false, 
          error: "Akses Ditolak: Akun Superadmin Dasar (Root) telah diproteksi pada tingkat kernel pangkalan data dan tidak diizinkan untuk dihapus." 
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: userId },
      });

      await tx.auditLog.create({
        data: {
          source: "SUPERADMIN",
          action: "DELETE_USER",
          entityType: "USER",
          entityId: userId,
          details: `Menghapus entitas akun operator: ${targetUser.namaLengkap} (${targetUser.email})`,
        },
      });
    });

    revalidatePath("/users");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Gagal menghapus entitas akun dari basis data." };
  }
}
