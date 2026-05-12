import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengecualikan pemaketan mesin natif Prisma agar tidak dipaksa menjadi varian Edge/client wasm di mode Turbopack
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
