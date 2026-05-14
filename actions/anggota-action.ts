"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusAnggota, JenisSimpanan, JenisMutasi } from "@prisma/client";

// Bebas dari data dummy hardcoded (Sistem murni organik)

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
        rekeningSimpanan: {
          include: { produk: true }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Petakan Decimal dan Date menjadi tipe primitif aman untuk Client Component
    const serializedList = anggotaList.map((m: any) => ({
      ...m,
      createdAt: m.createdAt?.toISOString(),
      updatedAt: m.updatedAt?.toISOString(),
      tanggalLahir: m.tanggalLahir?.toISOString(),
      rekeningSimpanan: m.rekeningSimpanan?.map((r: any) => ({
        ...r,
        saldo: Number(r.saldo),
        createdAt: r.createdAt?.toISOString(),
        updatedAt: r.updatedAt?.toISOString(),
        produk: r.produk ? {
          ...r.produk,
          nisbahBagiHasil: r.produk.nisbahBagiHasil ? Number(r.produk.nisbahBagiHasil) : null,
          setoranAwalMin: Number(r.produk.setoranAwalMin) || 0,
          saldoMin: Number(r.produk.saldoMin) || 0,
          createdAt: r.produk.createdAt?.toISOString(),
          updatedAt: r.produk.updatedAt?.toISOString(),
        } : null,
      })) || [],
    }));

    return { success: true, data: serializedList };
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
      const count = await tx.anggota.count();
      const branchCode = "10";
      const yearStr = new Date().getFullYear().toString().slice(-2);
      const seqStr = String(count + 1).padStart(6, "0");
      const generatedCif = `${branchCode}${yearStr}${seqStr}`;

      const newMember = await tx.anggota.create({
        data: {
          koperasiId: koperasi.id,
          nik: inputData.nik.trim(),
          cif: generatedCif,
          namaLengkap: inputData.namaLengkap.trim().toUpperCase(),
          alamat: inputData.alamat.trim().toUpperCase(),
          tempatLahir: inputData.tempatLahir.trim().toUpperCase(),
          tanggalLahir: inputData.tanggalLahir ? new Date(inputData.tanggalLahir) : new Date("1995-01-01"),
          status: StatusAnggota.MENUNGGU,
          ocrVerified: inputData.ocrVerified,
        },
      });

      // Cari produk Pokok dan Wajib
      const prdPokok = await tx.produkSimpanan.findFirst({
        where: { koperasiId: koperasi.id, jenis: JenisSimpanan.POKOK },
      });
      const prdWajib = await tx.produkSimpanan.findFirst({
        where: { koperasiId: koperasi.id, jenis: JenisSimpanan.WAJIB },
      });

      if (prdPokok) {
        const noRek = `REK-PK-${newMember.nik.slice(-6)}`;
        await tx.rekeningSimpanan.create({
          data: {
            noRekening: noRek,
            anggotaId: newMember.id,
            produkId: prdPokok.id,
            saldo: 0,
            status: "MENUNGGU",
          },
        });
      }

      if (prdWajib) {
        const noRekWj = `REK-WJ-${newMember.nik.slice(-6)}`;
        await tx.rekeningSimpanan.create({
          data: {
            noRekening: noRekWj,
            anggotaId: newMember.id,
            produkId: prdWajib.id,
            saldo: 0,
            status: "MENUNGGU",
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
          details: JSON.stringify({ nik: newMember.nik, nama: newMember.namaLengkap, ocrVerified: newMember.ocrVerified, status: "MENUNGGU" }),
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

/**
 * Memperbarui data profil anggota riil di PostgreSQL.
 */
export async function updateAnggotaAction(id: string, inputData: {
  nik: string;
  namaLengkap: string;
  alamat: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
}) {
  try {
    await prisma.anggota.update({
      where: { id },
      data: {
        nik: inputData.nik.trim(),
        namaLengkap: inputData.namaLengkap.trim().toUpperCase(),
        alamat: inputData.alamat.trim().toUpperCase(),
        tempatLahir: inputData.tempatLahir.trim().toUpperCase(),
        tanggalLahir: inputData.tanggalLahir ? new Date(inputData.tanggalLahir) : undefined,
      },
    });
    revalidatePath("/dashboard/anggota");
    return { success: true };
  } catch (e: any) {
    console.error("[UPDATE_ANGGOTA_ERROR]", e);
    return { success: false, error: "Gagal memperbarui profil anggota." };
  }
}

/**
 * Menghasilkan tautan tagihan (Payment Link) Xendit untuk aktivasi keanggotaan.
 * Tagihan ini akan mengakumulasi saldo minimum Simpanan Pokok dan Simpanan Wajib.
 */
export async function generateAktivasiInvoiceAction(anggotaId: string) {
  try {
    const anggota = await prisma.anggota.findUnique({
      where: { id: anggotaId },
      include: {
        rekeningSimpanan: {
          where: { status: "MENUNGGU" },
          include: { produk: true },
        },
      },
    });

    if (!anggota) return { success: false, error: "Anggota tidak ditemukan." };
    if (anggota.status === StatusAnggota.AKTIF) return { success: false, error: "Anggota sudah berstatus AKTIF." };

    // Hitung total tagihan dari setoran awal minimum
    let totalTagihan = 0;
    for (const rek of anggota.rekeningSimpanan) {
      if (rek.produk) {
        totalTagihan += Number(rek.produk.setoranAwalMin);
      }
    }

    if (totalTagihan <= 0) {
      return { success: false, error: "Tidak ada tagihan aktivasi yang tertunda (Total Rp 0)." };
    }

    // Simulasi Xendit Invoice Generation (Mock)
    const externalId = `AKT-${anggotaId}-${Date.now()}`;
    const vaNumber = `8808${anggota.nik.slice(-8)}`;
    const qrisString = `00020101021126670016COM.NOBUBANK.WWW0118936005030000087914021440817088014520303UMI51440014ID.CO.QRIS.WWW0215ID10200210355410303UMI5204541153033605405${totalTagihan}5802ID5919KOPERASI HARAPAN AI6007JAKARTA61051211462070703A016304${externalId.slice(-4)}`;

    // Log ke pangkalan data
    await prisma.auditLog.create({
      data: {
        userId: null,
        source: "XENDIT_API",
        action: "GENERATE_ACTIVATION_INVOICE",
        entityType: "ANGGOTA",
        entityId: anggotaId,
        details: JSON.stringify({ externalId, totalTagihan, vaNumber }),
      },
    });

    return { 
      success: true, 
      externalId, 
      totalTagihan,
      paymentDetails: {
        vaNumber,
        bankName: "Bank Mandiri / BNI",
        qrisString
      }
    };
  } catch (e: any) {
    console.error("[GENERATE_INVOICE_ERROR]", e);
    return { success: false, error: "Gagal memproses penagihan aktivasi ke server pembayaran." };
  }
}

/**
 * Memproses aktivasi keanggotaan secara manual dengan pembayaran tunai di kasir teller.
 * Mencatat penyelesaian simpanan pokok dan wajib secara real-time dengan pembukuan ganda.
 */
export async function activateAnggotaManualAction(anggotaId: string) {
  try {
    const res = await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUnique({
        where: { id: anggotaId },
        include: {
          rekeningSimpanan: {
            where: { status: "MENUNGGU" },
            include: { produk: true },
          },
        },
      });

      if (!anggota) return { success: false, error: "Anggota tidak ditemukan." };
      if (anggota.status === StatusAnggota.AKTIF) return { success: false, error: "Anggota sudah berstatus AKTIF." };

      // Cari akun buku besar Kas di Tangan / Kasir (101.01)
      const coaKasTunai = await tx.chartOfAccount.findFirst({
        where: { kodeAkun: "101.01", koperasiId: anggota.koperasiId },
      });

      let totalBayar = 0;
      const jurnalEntries: { coaId: string; debit: number; kredit: number }[] = [];

      for (const rek of anggota.rekeningSimpanan) {
        if (!rek.produk) continue;
        const wajibBayar = Number(rek.produk.setoranAwalMin);
        
        if (wajibBayar > 0) {
          totalBayar += wajibBayar;
          
          // Update rekening
          await tx.rekeningSimpanan.update({
            where: { id: rek.id },
            data: { saldo: wajibBayar, status: "AKTIF" },
          });

          // Buat Mutasi
          await tx.mutasiSimpanan.create({
            data: {
              rekeningId: rek.id,
              jenis: JenisMutasi.SETORAN,
              nominal: wajibBayar,
              saldoSetelah: wajibBayar,
              keterangan: "Setoran Aktivasi Tunai (Kasir Teller)",
            },
          });

          // Siapkan jurnal kredit
          if (rek.produk.coaId) {
            jurnalEntries.push({ coaId: rek.produk.coaId, debit: 0, kredit: wajibBayar });
          }
        }
      }

      if (totalBayar <= 0) {
        await tx.anggota.update({
          where: { id: anggota.id },
          data: { status: StatusAnggota.AKTIF },
        });
        return { success: true };
      }

      // Tambahkan sisi debit pada jurnal pembukuan ganda
      if (coaKasTunai && jurnalEntries.length > 0) {
        jurnalEntries.unshift({ coaId: coaKasTunai.id, debit: totalBayar, kredit: 0 });

        const noRef = `JRN-AKT-${Date.now().toString().slice(-6)}`;
        await tx.jurnal.create({
          data: {
            koperasiId: anggota.koperasiId,
            noReferensi: noRef,
            keterangan: `Aktivasi Keanggotaan ${anggota.namaLengkap} via Pembayaran Tunai`,
            source: "TELLER",
            entries: {
              create: jurnalEntries,
            },
          },
        });
      }

      // Aktifkan keanggotaan
      await tx.anggota.update({
        where: { id: anggota.id },
        data: { status: StatusAnggota.AKTIF },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "MANUAL_AKTIVASI_ANGGOTA",
          entityType: "ANGGOTA",
          entityId: anggota.id,
          details: JSON.stringify({
            nominalPaid: totalBayar,
            metode: "TUNAI",
            statusBaru: "AKTIF",
          }),
        },
      });

      return { success: true };
    });

    revalidatePath("/dashboard/anggota");
    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard/simpanan");
    revalidatePath("/dashboard/jurnal");
    revalidatePath("/dashboard");
    return res;
  } catch (e: any) {
    console.error("[ACTIVATE_MANUAL_ERROR]", e);
    return { success: false, error: "Gagal memproses pembayaran tunai aktivasi keanggotaan." };
  }
}

/**
 * Mengambil detail mendalam satu orang anggota berdasarkan ID pangkalan data,
 * beserta portofolio sub-rekening simpanan, produk terikat, dan riwayat mutasi terbaru.
 */
export async function getAnggotaDetailByIdAction(id: string) {
  try {
    const member = await prisma.anggota.findUnique({
      where: { id },
      include: {
        rekeningSimpanan: {
          include: {
            produk: true,
            mutasi: {
              orderBy: { createdAt: "desc" },
              take: 25,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!member) {
      return { success: false, error: "Anggota tidak ditemukan." };
    }

    // Petakan ke format aman serialisasi untuk komponen klien
    const serialized = {
      ...member,
      createdAt: member.createdAt?.toISOString(),
      updatedAt: member.updatedAt?.toISOString(),
      tanggalLahir: member.tanggalLahir?.toISOString(),
      joinDate: member.joinDate?.toISOString(),
      rekeningSimpanan: member.rekeningSimpanan?.map((r: any) => ({
        ...r,
        saldo: Number(r.saldo || 0),
        createdAt: r.createdAt?.toISOString(),
        updatedAt: r.updatedAt?.toISOString(),
        produk: r.produk ? {
          ...r.produk,
          nisbahBagiHasil: r.produk.nisbahBagiHasil ? Number(r.produk.nisbahBagiHasil) : null,
          setoranAwalMin: Number(r.produk.setoranAwalMin) || 0,
          saldoMin: Number(r.produk.saldoMin) || 0,
          createdAt: r.produk.createdAt?.toISOString(),
          updatedAt: r.produk.updatedAt?.toISOString(),
        } : null,
        mutasi: r.mutasi?.map((mut: any) => ({
          ...mut,
          nominal: Number(mut.nominal || 0),
          jumlah: Number(mut.nominal || mut.jumlah || 0),
          saldoSetelah: Number(mut.saldoSetelah || 0),
          saldoAkhir: Number(mut.saldoSetelah || mut.saldoAkhir || 0),
          createdAt: mut.createdAt?.toISOString(),
          updatedAt: mut.updatedAt?.toISOString(),
        })) || [],
      })) || [],
    };

    return { success: true, data: serialized };
  } catch (e: any) {
    console.error("[GET_ANGGOTA_DETAIL_ERROR]", e);
    return { success: false, error: "Gagal memuat detail Buku Induk Anggota." };
  }
}

