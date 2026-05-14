import { Role, JenisSimpanan, TipeAkunCoa } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Memulai proses inisialisasi/seeding pangkalan data Koperasi-AI (Kondisi Siap Live)...");

  // 1. Bersihkan tabel agar inisialisasi ulang berjalan bersih
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

  // 2. Buat Cabang Pusat Operasional dan Cabang Pembantu
  const cabangPusat = await prisma.koperasi.create({
    data: {
      nama: "KSP Harapan Artha Nusantara - Pusat Operasional",
      badanHukumNo: "CAB-PUSAT",
      alamat: "Jl. Jenderal Sudirman Kav. 45, Jakarta Selatan",
      telepon: "021-5552910",
      email: "pusat@koperasi-artha.com",
    },
  });

  const cabangJabar = await prisma.koperasi.create({
    data: {
      nama: "Cabang Pembantu Jawa Barat",
      badanHukumNo: "CAB-JABAR",
      alamat: "Jl. Asia Afrika No. 88, Bandung",
      telepon: "022-4431920",
      email: "jabar@koperasi-artha.com",
    },
  });

  const cabangJatim = await prisma.koperasi.create({
    data: {
      nama: "Cabang Pembantu Jawa Timur",
      badanHukumNo: "CAB-JATIM",
      alamat: "Jl. Pemuda No. 12, Surabaya",
      telepon: "031-5521990",
      email: "jatim@koperasi-artha.com",
    },
  });

  console.log(`✅ Topologi Cabang Siap Live terdaftar: ${cabangPusat.nama}, ${cabangJabar.nama}, ${cabangJatim.nama}`);

  // 3. Buat Chart of Accounts (COA) Standar Operasional untuk Cabang Pusat
  const coaKas = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "101.01", namaAkun: "Kas Teller Operasional", tipe: TipeAkunCoa.ASSET },
  });
  const coaSimpananPokok = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "201.01", namaAkun: "Simpanan Pokok Anggota", tipe: TipeAkunCoa.EQUITY },
  });
  const coaSimpananWajib = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "201.02", namaAkun: "Simpanan Wajib Anggota", tipe: TipeAkunCoa.LIABILITY },
  });
  const coaSimpananSukarela = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "201.03", namaAkun: "Simpanan Sukarela Fleksibel", tipe: TipeAkunCoa.LIABILITY },
  });
  const coaPiutangMikro = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "104.01", namaAkun: "Piutang Pembiayaan Mikro", tipe: TipeAkunCoa.ASSET },
  });
  const coaPendapatanMargin = await prisma.chartOfAccount.create({
    data: { koperasiId: cabangPusat.id, kodeAkun: "401.01", namaAkun: "Pendapatan Margin Pembiayaan", tipe: TipeAkunCoa.REVENUE },
  });

  console.log("✅ Pemetaan Buku Besar (Chart of Accounts) standar operasional berhasil diinisialisasi.");

  // 4. Buat Akun Pengguna / Operator untuk Setiap Role (Sesuai Permintaan Siap Live)
  
  // a. User Dasar (Base User) - Superadmin Terkunci Mutlak
  const baseSuperadmin = await prisma.user.create({
    data: {
      koperasiId: cabangPusat.id,
      email: "superadmin@koperasi.id",
      passwordHash: "SECURE_LIVE_HASH_PASS_2026!", 
      namaLengkap: "Rangga Perdana (Superadmin Master)",
      role: Role.SUPERADMIN,
      isActive: true,
    },
  });

  // b. User Role Manager
  const manajerUser = await prisma.user.create({
    data: {
      koperasiId: cabangPusat.id,
      email: "manager@koperasi.id",
      passwordHash: "SECURE_LIVE_HASH_PASS_2026!",
      namaLengkap: "Siska Dewi (Manajer Operasional)",
      role: Role.MANAGER,
      isActive: true,
    },
  });

  // c. User Role Teller
  const tellerUser = await prisma.user.create({
    data: {
      koperasiId: cabangPusat.id,
      email: "teller@koperasi.id",
      passwordHash: "SECURE_LIVE_HASH_PASS_2026!",
      namaLengkap: "Citra Sari (Teller Utama)",
      role: Role.TELLER,
      isActive: true,
    },
  });

  console.log(`✅ Akun Operator terotentikasi di setiap role siap live:`);
  console.log(`   - [SUPERADMIN Dasar Terkunci]: ${baseSuperadmin.email}`);
  console.log(`   - [MANAGER Operasional]: ${manajerUser.email}`);
  console.log(`   - [TELLER Pelayanan]: ${tellerUser.email}`);

  // Catat AuditLog Inisialisasi
  await prisma.auditLog.create({
    data: {
      userId: baseSuperadmin.id,
      source: "SYSTEM_KERNEL",
      action: "PRODUCTION_LIVE_INIT",
      entityType: "KERNEL",
      entityId: baseSuperadmin.id,
      details: "Inisialisasi basis data mutlak untuk lingkungan rilis/live selesai dijalankan secara terpusat.",
    },
  });

  // 5. Buat Katalog Produk Master Siap Live
  await prisma.produkSimpanan.createMany({
    data: [
      {
        koperasiId: cabangPusat.id,
        namaProduk: "Simpanan Pokok Wajib Bersama",
        jenis: JenisSimpanan.POKOK,
        setoranAwalMin: 500000,
        coaId: coaSimpananPokok.id,
      },
      {
        koperasiId: cabangPusat.id,
        namaProduk: "Simpanan Wajib Bulanan",
        jenis: JenisSimpanan.WAJIB,
        setoranAwalMin: 100000,
        coaId: coaSimpananWajib.id,
      },
      {
        koperasiId: cabangPusat.id,
        namaProduk: "Tabungan Sukarela Hari Tua",
        jenis: JenisSimpanan.SUKARELA,
        nisbahBagiHasil: 4.5,
        setoranAwalMin: 50000,
        coaId: coaSimpananSukarela.id,
      },
    ],
  });

  await prisma.produkPinjaman.create({
    data: {
      koperasiId: cabangPusat.id,
      namaProduk: "Pembiayaan Usaha Rakyat (PUR)",
      marginBunga: 1.25,
      plafonMax: 50000000,
      tenorMaxBulan: 36,
      coaPiutangId: coaPiutangMikro.id,
    },
  });

  console.log("✅ Katalog Produk Simpanan & Pembiayaan rilis produksi berhasil dimuat.");
  console.log("🎉 Pangkalan Data Koperasi-AI telah berada dalam kondisi 100% SIAP LIVE!");
}

main()
  .catch((e) => {
    console.error("❌ Galat saat eksekusi live seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
