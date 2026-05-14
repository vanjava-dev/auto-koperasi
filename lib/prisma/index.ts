import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pastikan cache lama dihapus agar HMR Next.js menggunakan prototype terbaru hasil generate
delete (globalThis as any).prisma;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:@localhost:5432/auto_koperasi";

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

// Klien Prisma ORM murni yang terhubung langsung secara mutlak ke PostgreSQL lokal via driver adapter standar
const newPrismaClient = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const prisma = newPrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = newPrismaClient;
}
