import { PrismaClient, Role, JenisSimpanan, TipeAkunCoa } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding data master Koperasi-AI...");

  // 1. Bersihkan tabel terkait (opsional, aman jika kosong)
  await prisma.auditLog.deleteMany();
  await prisma.jurnalEntry.deleteMany();
  await prisma.jurnal.deleteMany();
  await prisma.mutasiSimpanan.deleteMany();
  await prisma.rekeningSimpanan.deleteMany();
  await prisma.produkSimpanan.deleteMany();
  await prisma.jadwalAngsuran.deleteMany();
  await prisma.pinjaman.deleteMany();
  await prisma.produkPinjaman.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.anggota.deleteMany();
  await prisma.user.deleteMany();
  await prisma.koperasi.deleteMany();

  // 2. Buat Koperasi Utama
  const koperasi = await prisma.koperasi.create({
    data: {
      nama: "KSP Harapan Artha Nusantara",
      badanHukumNo: "BH-2026/KOP-AI/001",
      alamat: "Jl. Merdeka No. 45, Bandung, Jawa Barat",
      telepon: "022-88990011",
      email: "kontak@koperasi-artha.com",
    },
  });

  console.log(`✅ Koperasi terdaftar: ${koperasi.nama}`);

  // 3. Buat Chart of Accounts (COA) Dasar
  const coaKas = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "101.01", namaAkun: "Kas Teller Utama", tipe: TipeAkunCoa.ASSET },
  });
  const coaSimpananPokok = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "201.01", namaAkun: "Simpanan Pokok Anggota", tipe: TipeAkunCoa.EQUITY },
  });
  const coaSimpananWajib = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "201.02", namaAkun: "Simpanan Wajib Anggota", tipe: TipeAkunCoa.LIABILITY },
  });
  const coaSimpananSukarela = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "201.03", namaAkun: "Simpanan Sukarela Fleksibel", tipe: TipeAkunCoa.LIABILITY },
  });
  const coaPiutangMikro = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "104.01", namaAkun: "Piutang Pembiayaan Mikro", tipe: TipeAkunCoa.ASSET },
  });
  const coaPendapatanMargin = await prisma.chartOfAccount.create({
    data: { koperasiId: koperasi.id, kodeAkun: "401.01", namaAkun: "Pendapatan Margin Pembiayaan", tipe: TipeAkunCoa.REVENUE },
  });

  console.log("✅ Chart of Accounts (Buku Besar) tergenerate.");

  // 4. Buat Akun Pengurus / User
  const admin = await prisma.user.create({
    data: {
      koperasiId: koperasi.id,
      email: "admin@koperasi-artha.com",
      // Menggunakan plaintext sementara/hash tiruan untuk kemudahan pengembangan lokal
      passwordHash: "hashed_password_secret_123",
      namaLengkap: "Administrator Sistem",
      role: Role.SUPERADMIN,
    },
  });

  const teller = await prisma.user.create({
    data: {
      koperasiId: koperasi.id,
      email: "teller@koperasi-artha.com",
      passwordHash: "hashed_password_secret_123",
      namaLengkap: "Citra Sari (Teller)",
      role: Role.TELLER,
    },
  });

  console.log(`✅ Petugas terdaftar: ${admin.email} & ${teller.email}`);

  // 5. Buat Katalog Produk Master (Terkait COA - SOP Poin 5)
  await prisma.produkSimpanan.createMany({
    data: [
      {
        koperasiId: koperasi.id,
        namaProduk: "Simpanan Pokok",
        jenis: JenisSimpanan.POKOK,
        setoranAwalMin: 500000,
        coaId: coaSimpananPokok.id,
      },
      {
        koperasiId: koperasi.id,
        namaProduk: "Simpanan Wajib Bulanan",
        jenis: JenisSimpanan.WAJIB,
        setoranAwalMin: 100000,
        coaId: coaSimpananWajib.id,
      },
      {
        koperasiId: koperasi.id,
        namaProduk: "Tabungan Sukarela Sejahtera",
        jenis: JenisSimpanan.SUKARELA,
        nisbahBagiHasil: 5.5,
        setoranAwalMin: 50000,
        coaId: coaSimpananSukarela.id,
      },
    ],
  });

  await prisma.produkPinjaman.create({
    data: {
      koperasiId: koperasi.id,
      namaProduk: "Pembiayaan Mikro Usaha",
      marginBunga: 1.2,
      plafonMax: 25000000,
      tenorMaxBulan: 24,
      coaPiutangId: coaPiutangMikro.id,
    },
  });

  console.log("✅ Katalog Produk Simpanan & Pembiayaan master terisi.");
  console.log("🎉 Proses Seeding Selesai Sempurna!");
}

main()
  .catch((e) => {
    console.error("❌ Galat saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
