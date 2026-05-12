import { defineConfig } from "@prisma/config";

/**
 * Konfigurasi Ekosistem Prisma ORM v7.8.0+
 * Mematuhi arsitektur pemisahan Datasource URL terbaru.
 */
export default defineConfig({
  earlyAccess: true,
  schema: {
    path: "prisma/schema.prisma",
  },
  migrate: {
    connectionString: process.env.DATABASE_URL,
  },
});
