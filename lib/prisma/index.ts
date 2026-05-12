import { PrismaClient } from "@prisma/client";

// Mencegah instansiasi berulang Prisma Client saat Next.js melakukan hot-reloading di mode development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client terpusat berkinerja tinggi.
 * Menggunakan mode mesin pustaka (library engine) natif peladen standar terisolasi dari bundler.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
