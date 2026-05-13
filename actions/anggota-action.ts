"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusAnggota, JenisSimpanan } from ".prisma/client";

const DEFAULT_ANGGOTA_SEED = [
  { nik: "3171234567890001", name: "Budi Santoso", status: StatusAnggota.AKTIF, savings: 2450000, gender: "LAKI_LAKI", address: "Jl. Sudirman Kav. 1", ocrVerified: true },
  { nik: "3171234567890002", name: "Siti Aminah", status: StatusAnggota.AKTIF, savings: 1200000, gender: "PEREMPUAN", address: "Jl. Thamrin No. 4", ocrVerified: true },
  { nik: "3171234567890003", name: "Ahmad Dahlan", status: StatusAnggota.AKTIF, savings: 5500000, gender: "LAKI_LAKI", address: "Jl. Diponegoro 2", ocrVerified: false },
  { nik: "3171234567890004", name: "Rina Nose", status: StatusAnggota.MENUNGGU, savings: 100000, gender: "PEREMPUAN", address: "Jl. Merdeka 10", ocrVerified: false },
  { nik: "3171234567890005", name: "Dewi Lestari", status: StatusAnggota.AKTIF, savings: 8900000, gender: "PEREMPUAN", address: "Jl. Pajajaran 9", ocrVerified: true },
];

/**
 * Mengambil daftar anggota koperasi beserta rincian rekening simpanan terikat.
 * Melakukan seeding otomatis ke PostgreSQL jika tabel Anggota kosong.
 */
export async function getAnggotaListAction() {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Pangkalan data master koperasi belum terdaftar." };

    let anggotaList = await prisma.anggota.findMany({
      where: { koperasiId: koperasi.id },
      include: {
        rekeningSimpanan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (anggotaList.length === 0) {
      // Cari atau buat Produk Simpanan Pokok untuk inisialisasi rekening awal
      let produkPokok = await prisma.produkSimpanan.findFirst({
        where: { koperasiId: koperasi.id, jenis: JenisSimpanan.POKOK },
      });

      if (!produkPokok) {
        // Cari CoA ekuitas untuk mengikat produk pokok
        const coaPokok = await prisma.chartOfAccount.findFirst({
          where: { koperasiId: koperasi.id, tipe: "EQUITY" },
        });

        if (coaPokok) {
          produkPokok = await prisma.produkSimpanan.create({
            data: {
              koperasiId: koperasi.id,
              namaProduk: "Simpanan Pokok Keanggotaan Baku",
              jenis: JenisSimpanan.POKOK,
              setoranAwalMin: 500000,
              saldoMin: 500000,
              coaId: coaPokok.id,
              isActive: true,
            },
          });
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const seed of DEFAULT_ANGGOTA_SEED) {
          const newMember = await tx.anggota.create({
            data: {
              koperasiId: koperasi.id,
              nik: seed.nik,
              namaLengkap: seed.name,
              alamat: seed.address,
              tempatLahir: "JAKARTA",
              tanggalLahir: new Date("1990-01-01"),
              noHp: "08123456789",
              status: seed.status,
              ocrVerified: seed.ocrVerified,
            },
          });

          // Otomatis daftarkan Rekening Simpanan jika produk pokok tersedia
          if (produkPokok) {
            await tx.rekeningSimpanan.create({
              data: {
                noRekening: `REK-PK-${seed.nik.slice(-6)}`,
                anggotaId: newMember.id,
                produkId: produkPokok.id,
                saldo: seed.savings,
                status: "AKTIF",
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            userId: null,
            source: "AI_AGENT",
            action: "SEED_BUKU_INDUK_ANGGOTA",
            entityType: "ANGGOTA",
            entityId: koperasi.id,
            details: `Injeksi otomatis ${DEFAULT_ANGGOTA_SEED.length} data master anggota terintegrasi AI OCR selesai.`,
          },
        });
      });

      // Muat ulang setelah di-seed
      anggotaList = await prisma.anggota.findMany({
        where: { koperasiId: koperasi.id },
        include: { rekeningSimpanan: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return { success: true, data: anggotaList };
  } catch (e: any) {
    console.error("[GET_ANGGOTA_LIST_ERROR]", e);
    return { success: false, error: "Gagal memuat senarai Buku Induk Anggota dari peladen." };
  }
}

/**
 * Mendaftarkan anggota baru ke pangkalan data riil dengan stempel verifikasi OCR.
 */
export async function createAnggotaAction(inputData: {
  nik: string;
  namaLengkap: string;
  alamat: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  ocrVerified: boolean;
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi belum terdaftar." };

    // Validasi duplikasi NIK
    const exists = await prisma.anggota.findUnique({
      where: { nik: inputData.nik.trim() },
    });

    if (exists) {
      return { success: false, error: `Nomor Induk Kependudukan (NIK) "${inputData.nik}" telah terpakai oleh anggota "${exists.namaLengkap}".` };
    }

    await prisma.$transaction(async (tx) => {
      const newMember = await tx.anggota.create({
        data: {
          koperasiId: koperasi.id,
          nik: inputData.nik.trim(),
          namaLengkap: inputData.namaLengkap.trim().toUpperCase(),
          alamat: inputData.alamat.trim().toUpperCase(),
          tempatLahir: inputData.tempatLahir.trim().toUpperCase(),
          tanggalLahir: inputData.tanggalLahir ? new Date(inputData.tanggalLahir) : new Date("1995-01-01"),
          status: StatusAnggota.AKTIF,
          ocrVerified: inputData.ocrVerified,
        },
      });

      // Buatkan rekening simpanan pokok jika ada produknya
      const prdPokok = await tx.produkSimpanan.findFirst({
        where: { koperasiId: koperasi.id, jenis: JenisSimpanan.POKOK },
      });

      if (prdPokok) {
        await tx.rekeningSimpanan.create({
          data: {
            noRekening: `REK-PK-${newMember.nik.slice(-6)}`,
            anggotaId: newMember.id,
            produkId: prdPokok.id,
            saldo: 500000,
            status: "AKTIF",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: null,
          source: inputData.ocrVerified ? "AI_OCR_SCANNER" : "MANUAL_REGISTRATION",
          action: "CREATE_MEMBER_RECORD",
          entityType: "ANGGOTA",
          entityId: newMember.id,
          details: JSON.stringify({ nik: newMember.nik, nama: newMember.namaLengkap, ocrVerified: newMember.ocrVerified }),
        },
      });
    });

    revalidatePath("/dashboard/anggota");
    return { success: true };
  } catch (e: any) {
    console.error("[CREATE_ANGGOTA_ERROR]", e);
    return { success: false, error: "Gagal mendaftarkan anggota ke pangkalan data." };
  }
}
