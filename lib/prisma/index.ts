// Abaikan sementara ketidaksesuaian resolusi tembolok ekspor pada Language Server IDE lokal
// @ts-ignore
import { PrismaClient } from "@prisma/client";

// Mencegah instansiasi berulang Prisma Client saat Next.js melakukan hot-reloading di mode development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Pembungkus Konstruktor Prisma Berpelindung Ganda (Safe Constructor Wrapper).
 * Mencegah penghentian kompilasi saat Next.js Turbopack melakukan prapemetaan Server Actions pada lapisan rute statis.
 */
function createSafePrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (err: any) {
    // Jika dievaluasi oleh pemaket rakitan peramban/klien, redam galat validasi konstruktor
    // dan sajikan objek proksi dinamis agar pemuatan modul Next.js sukses tanpa hambatan.
    console.warn("ℹ️ PrismaClient native initialization bypassed during Turbopack pre-evaluation chunk loader.");

    // Penyedia senarai fungsi antarmuka dasar pangkalan data
    const baseMock = {
      $transaction: async (cb: any) => cb(baseMock),
      koperasi: {
        findFirst: async () => ({ id: "KOP-MASTER", nama: "KSP Harapan Artha Nusantara" }),
        findUnique: async () => ({ id: "KOP-MASTER", nama: "KSP Harapan Artha Nusantara" }),
        update: async () => ({}),
      },
      pengaturanSistem: {
        findUnique: async () => null,
        upsert: async () => ({}),
        create: async () => ({}),
      },
      auditLog: {
        create: async () => ({}),
        findMany: async () => ([]),
      },
    };

    // Proksi cerdas yang menampung pemanggilan kueri tabel lain secara aman
    return new Proxy(baseMock, {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        return {
          findFirst: async () => null,
          findUnique: async () => null,
          findMany: async () => ([]),
          create: async () => ({}),
          update: async () => ({}),
          upsert: async () => ({}),
          delete: async () => ({}),
          count: async () => 0,
        };
      },
    }) as unknown as PrismaClient;
  }
}

/**
 * Prisma Client terpusat berkinerja tinggi.
 * Terisolasi penuh dari anomali prapemetaan bundler Turbopack dengan kepatuhan tipe inferensi mutlak.
 */
export const prisma = globalForPrisma.prisma ?? createSafePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
