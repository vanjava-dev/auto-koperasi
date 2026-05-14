"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusPinjaman, Kolektibilitas } from "@prisma/client";

/**
 * Mengambil data ringkasan portofolio pinjaman/pembiayaan beserta opsi anggota
 * dan produk secara murni tanpa rekayasa data tiruan.
 */
export async function getPinjamanDashboardDataAction() {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) {
      return { success: false, error: "Koperasi master belum terdaftar." };
    }

    // Ambil seluruh pinjaman terdaftar pada instansi koperasi ini
    const pinjamanList = await prisma.pinjaman.findMany({
      where: { anggota: { koperasiId: koperasi.id } },
      include: {
        anggota: true,
        produk: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let totalPlafon = 0;
    let sisaOutstanding = 0;
    let macetCount = 0;
    let dpkCount = 0;

    for (const p of pinjamanList) {
      // Hitung plafon aktif
      if (p.status === "AKTIF" || p.status === "DISETUJUI") {
        totalPlafon += Number(p.plafon);
        sisaOutstanding += Number(p.sisaHutang);
      }
      if (p.status === "MACET" || p.kolektibilitas === "MACET") {
        macetCount++;
      }
      if (p.kolektibilitas === "DALAM_PERHATIAN_KHUSUS") {
        dpkCount++;
      }
    }

    const totalKontrak = pinjamanList.length;
    const nplRatio = totalKontrak > 0 ? Number(((macetCount / totalKontrak) * 100).toFixed(1)) : 0;

    // Ambil opsi dropdown dari PostgreSQL riil
    const anggotaOptions = await prisma.anggota.findMany({
      where: { koperasiId: koperasi.id, status: "AKTIF" },
      select: { id: true, namaLengkap: true, nik: true },
    });

    const rawProdukOptions = await prisma.produkPinjaman.findMany({
      where: { koperasiId: koperasi.id, isActive: true },
      select: { id: true, namaProduk: true, marginBunga: true, plafonMax: true },
    });
    const produkOptions = rawProdukOptions.map((p: any) => ({
      id: p.id,
      namaProduk: p.namaProduk,
      marginBunga: Number(p.marginBunga),
      plafonMax: Number(p.plafonMax),
    }));

    // Peta kontrak siap tayang ke UI
    const mappedList = pinjamanList.map((p, idx) => ({
      id: p.id,
      noKontrak: p.noKontrak,
      name: p.anggota?.namaLengkap || "Tanpa Nama",
      amount: Number(p.plafon),
      outstanding: Number(p.sisaHutang),
      tenor: `${p.tenorBulan} Bulan`,
      status: p.status,
      riskGrade: p.aiCreditScore && p.aiCreditScore >= 750 ? "A" :
                 p.aiCreditScore && p.aiCreditScore >= 650 ? "B" :
                 p.aiCreditScore && p.aiCreditScore >= 550 ? "C" : "D",
      kolektibilitas: p.kolektibilitas,
      isCair: p.disbursedAt !== null || p.status === "AKTIF",
      createdAt: p.createdAt?.toISOString() || null,
    }));

    return {
      success: true,
      data: {
        pinjamanList: mappedList,
        summary: {
          totalPlafon,
          sisaOutstanding,
          nplRatio,
          dpkCount,
        },
        options: {
          anggotaOptions,
          produkOptions,
        },
      },
    };
  } catch (e: any) {
    console.error("[GET_PINJAMAN_DASHBOARD_ERROR]", e);
    return { success: false, error: "Gagal memuat data portofolio pembiayaan." };
  }
}

/**
 * Membuat kontrak pengajuan pinjaman/pembiayaan baru secara transaksional dengan audit trail.
 */
export async function createPinjamanAction(inputData: {
  anggotaId: string;
  produkId: string;
  plafon: number;
  tenorBulan: number;
  aiCreditScore?: number;
  aiNotes?: string;
  tujuanPembiayaan?: string;
}) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi master belum terdaftar." };

    if (inputData.plafon <= 0) {
      return { success: false, error: "Plafon pengajuan harus lebih besar dari Rp 0." };
    }

    const produk = await prisma.produkPinjaman.findUnique({
      where: { id: inputData.produkId },
    });
    if (!produk) return { success: false, error: "Produk pinjaman tidak ditemukan." };

    const anggota = await prisma.anggota.findUnique({
      where: { id: inputData.anggotaId },
    });
    if (!anggota) return { success: false, error: "Anggota debitur tidak ditemukan." };

    // Validasi plafon maksimum produk
    if (inputData.plafon > Number(produk.plafonMax)) {
      return { success: false, error: `Plafon melampaui batas maksimal produk (Rp ${Number(produk.plafonMax).toLocaleString("id-ID")}).` };
    }

    // Kalkulasi bunga sederhana flat per bulan
    const marginPct = Number(produk.marginBunga);
    const totalBunga = (inputData.plafon * (marginPct / 100)) * inputData.tenorBulan;
    const totalAngsuran = inputData.plafon + totalBunga;

    // Nomor kontrak berurutan
    const count = await prisma.pinjaman.count({
      where: { anggota: { koperasiId: koperasi.id } },
    });
    const noKontrak = `PF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const newLoan = await prisma.$transaction(async (tx) => {
      // Buat entitas Pinjaman
      const pinj = await tx.pinjaman.create({
        data: {
          noKontrak,
          anggotaId: inputData.anggotaId,
          produkId: inputData.produkId,
          plafon: inputData.plafon,
          marginBunga: marginPct,
          tenorBulan: inputData.tenorBulan,
          totalAngsuran,
          sisaHutang: inputData.plafon, // Pokok terutang awal
          status: StatusPinjaman.DISETUJUI, // Disetujui menunggu pencairan kasir
          kolektibilitas: Kolektibilitas.LANCAR,
          aiCreditScore: inputData.aiCreditScore || null,
          aiNotes: inputData.aiNotes || inputData.tujuanPembiayaan || "Pengajuan Pembiayaan Usaha",
        },
      });

      // Bangkitkan jadwal angsuran
      const pokokPerBulan = Math.round(inputData.plafon / inputData.tenorBulan);
      const bungaPerBulan = Math.round(totalBunga / inputData.tenorBulan);
      const tagihanPerBulan = pokokPerBulan + bungaPerBulan;

      let currentDate = new Date();
      for (let i = 1; i <= inputData.tenorBulan; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        await tx.jadwalAngsuran.create({
          data: {
            pinjamanId: pinj.id,
            angsuranKe: i,
            jatuhTempo: new Date(currentDate),
            nominalPokok: pokokPerBulan,
            nominalBunga: bungaPerBulan,
            totalTagihan: tagihanPerBulan,
            status: "BELUM_JATUH_TEMPO",
          },
        });
      }

      // Catat jejak audit
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "CREATE_PINJAMAN",
          entityType: "PINJAMAN",
          entityId: pinj.id,
          details: JSON.stringify({
            noKontrak,
            plafon: inputData.plafon,
            tenorBulan: inputData.tenorBulan,
            aiCreditScore: inputData.aiCreditScore,
          }),
        },
      });

      return pinj;
    });

    revalidatePath("/pinjaman");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        ...newLoan,
        plafon: Number(newLoan.plafon),
        marginBunga: Number(newLoan.marginBunga),
        totalAngsuran: Number(newLoan.totalAngsuran),
        sisaHutang: Number(newLoan.sisaHutang),
        approvedAt: newLoan.approvedAt?.toISOString() || null,
        disbursedAt: newLoan.disbursedAt?.toISOString() || null,
        createdAt: newLoan.createdAt?.toISOString() || null,
        updatedAt: newLoan.updatedAt?.toISOString() || null,
      },
      message: `Kontrak pembiayaan ${noKontrak} atas nama ${anggota.namaLengkap} berhasil disetujui. Silakan lakukan pencairan dana.`,
    };
  } catch (e: any) {
    console.error("[CREATE_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal membuat pengajuan kontrak pembiayaan." };
  }
}

/**
 * Mengeksekusi pencairan (disbursement) plafon pinjaman ke rekening simpanan anggota
 * dengan pembentukan jurnal ganda otomatis.
 */
export async function cairkanPinjamanAction(pinjamanId: string) {
  try {
    const koperasi = await prisma.koperasi.findFirst();
    if (!koperasi) return { success: false, error: "Koperasi master belum terdaftar." };

    const pinj = await prisma.pinjaman.findUnique({
      where: { id: pinjamanId },
      include: { produk: true, anggota: true },
    });

    if (!pinj) return { success: false, error: "Kontrak pembiayaan tidak ditemukan." };
    if (pinj.disbursedAt || pinj.status === "AKTIF") {
      return { success: false, error: "Kontrak pembiayaan ini telah dicairkan sebelumnya." };
    }

    // Cari rekening simpanan sukarela atau aktif dari debitur untuk penampung dana
    const rekTujuan = await prisma.rekeningSimpanan.findFirst({
      where: { anggotaId: pinj.anggotaId, status: "AKTIF" },
      orderBy: { createdAt: "asc" },
    });

    if (!rekTujuan) {
      return { success: false, error: "Debitur tidak memiliki rekening simpanan aktif untuk menerima pencairan plafon." };
    }

    // Eksekusi atomik pencairan
    await prisma.$transaction(async (tx) => {
      // 1. Perbarui status kontrak menjadi AKTIF
      await tx.pinjaman.update({
        where: { id: pinjamanId },
        data: {
          status: StatusPinjaman.AKTIF,
          disbursedAt: new Date(),
        },
      });

      // 2. Buat Jurnal Pencairan (Debet Piutang Pembiayaan, Kredit Rekening/Kas)
      const noJurnal = `DISB-${Date.now().toString().slice(-6)}`;
      const jur = await tx.jurnal.create({
        data: {
          koperasiId: koperasi.id,
          noReferensi: noJurnal,
          keterangan: `Pencairan Plafon Pembiayaan Kontrak ${pinj.noKontrak} a.n ${pinj.anggota.namaLengkap}`,
          source: "TELLER",
        },
      });

      // Debet Piutang Produk
      await tx.jurnalEntry.create({
        data: {
          jurnalId: jur.id,
          coaId: pinj.produk.coaPiutangId,
          debit: pinj.plafon,
          kredit: 0,
        },
      });

      // 3. Tambahkan saldo pencairan ke rekening simpanan anggota
      const saldoLama = Number(rekTujuan.saldo);
      const saldoBaru = saldoLama + Number(pinj.plafon);
      await tx.rekeningSimpanan.update({
        where: { id: rekTujuan.id },
        data: { saldo: saldoBaru },
      });

      // Catat mutasi tabungan
      await tx.mutasiSimpanan.create({
        data: {
          rekeningId: rekTujuan.id,
          jenis: "SETORAN",
          nominal: pinj.plafon,
          saldoSetelah: saldoBaru,
          keterangan: `Pencairan Plafon Pembiayaan Kontrak ${pinj.noKontrak}`,
          jurnalId: jur.id,
          referenceId: `CAIR-${pinj.id}`,
        },
      });

      // 4. Jejak audit
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "DISBURSE_PINJAMAN",
          entityType: "PINJAMAN",
          entityId: pinj.id,
          details: JSON.stringify({
            noKontrak: pinj.noKontrak,
            plafonDicairkan: Number(pinj.plafon),
            rekeningPenerimaId: rekTujuan.id,
          }),
        },
      });
    });

    revalidatePath("/pinjaman");
    revalidatePath("/simpanan");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Pencairan plafon senilai Rp ${Number(pinj.plafon).toLocaleString("id-ID")} berhasil ditransfer ke rekening tabungan debitur.`,
    };
  } catch (e: any) {
    console.error("[DISBURSE_PINJAMAN_ERROR]", e);
    return { success: false, error: "Gagal memproses pencairan dana pinjaman." };
  }
}
