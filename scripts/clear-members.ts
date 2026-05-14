import { prisma } from "../lib/prisma/index";

async function main() {
  console.log("Menghapus data anggota dan rekening untuk pembersihan logika lama...");

  // Hapus dari hirarki paling bawah ke atas (untuk menghindari Constraint Violation)
  await prisma.mutasiSimpanan.deleteMany();
  await prisma.jadwalAngsuran.deleteMany();
  await prisma.pinjaman.deleteMany();
  await prisma.rekeningSimpanan.deleteMany();
  await prisma.anggota.deleteMany();

  // Hapus log aktivitas dan jurnal (karena saldo di-reset)
  // Ini opsional tapi disarankan agar neraca sinkron dengan rekening kosong
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityType: "ANGGOTA" },
        { entityType: "REKENING_SIMPANAN" },
        { entityType: "REKENING" },
      ]
    }
  });

  console.log("Berhasil membersihkan db anggota dan rekening!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
