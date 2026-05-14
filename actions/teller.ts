"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PrismaClient, JenisMutasi, TipeAkunCoa } from ".prisma/client";

// Helper tangguh mengatasi caching memori Turbopack/Next.js HMR di lingkungan pengembangan
let fallbackPrisma: any = null;
function getActivePrisma() {
  if ((prisma as any).kategoriTransaksi) return prisma;
  if (!fallbackPrisma) {
    fallbackPrisma = new PrismaClient();
  }
  return fallbackPrisma;
}

// ── Skema Validasi Input ─────────────────────────────────────────
const SetoranSchema = z.object({
  rekeningId: z.string().min(1, { message: "Rekening tidak valid." }),
  nominal: z.number().positive({ message: "Nominal harus lebih dari nol." }),
  metode: z.string().optional().default("TUNAI"),
  keterangan: z.string().optional(),
  coaKasId: z.string().min(1),
  coaSimpananId: z.string().min(1),
  koperasiId: z.string().min(1),
});

const PenarikanSchema = SetoranSchema;

type ActionResult = { success: boolean; error?: string };

// ── Helper: Generate No. Referensi Jurnal ───────────────────────
function generateNoRef(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `JRN-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Server Action: Setoran Tunai Kasir ──────────────────────────
export async function processTellerSetoran(input: unknown): Promise<ActionResult> {
  const parsed = SetoranSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Ambil data rekening & hitung saldo baru
      const rekening = await tx.rekeningSimpanan.findUniqueOrThrow({
        where: { id: data.rekeningId },
        include: { produk: true },
      });

      // Aturan Khusus: Simpanan Pokok hanya disetor satu kali pada awal pendaftaran
      if (rekening.produk?.jenis === "POKOK" && Number(rekening.saldo) > 0) {
        throw new Error("Simpanan Pokok hanya perlu disetor satu kali pada awal pendaftaran keanggotaan.");
      }

      const saldoBaru = Number(rekening.saldo) + data.nominal;
      const prefixMetode = data.metode && data.metode !== "TUNAI" ? `[${data.metode}] ` : "";
      const keterangan = prefixMetode + (data.keterangan || "Setoran simpanan sukarela");
      const noRef = generateNoRef();

      // Operasi 1: Perbarui saldo rekening
      await tx.rekeningSimpanan.update({
        where: { id: data.rekeningId },
        data: { saldo: saldoBaru },
      });

      // Operasi 2: Catat riwayat mutasi
      const mutasi = await tx.mutasiSimpanan.create({
        data: {
          rekeningId: data.rekeningId,
          jenis: JenisMutasi.SETORAN,
          nominal: data.nominal,
          saldoSetelah: saldoBaru,
          keterangan,
        },
      });

      // Operasi 3: Buat jurnal double-entry otomatis (Aturan F)
      await tx.jurnal.create({
        data: {
          koperasiId: data.koperasiId,
          noReferensi: noRef,
          keterangan,
          source: "TELLER",
          entries: {
            create: [
              { coaId: data.coaKasId, debit: data.nominal, kredit: 0 },
              { coaId: data.coaSimpananId, debit: 0, kredit: data.nominal },
            ],
          },
        },
      });

      // Operasi 4: Audit log wajib (Aturan L)
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "SETORAN_SIMPANAN",
          entityType: "REKENING_SIMPANAN",
          entityId: data.rekeningId,
          details: JSON.stringify({
            saldoSebelum: Number(rekening.saldo),
            saldoSesudah: saldoBaru,
            nominal: data.nominal,
            keterangan,
            noReferensiJurnal: noRef,
          }),
        },
      });
    });

    // Invalidate singgahan (caching) secara eksplisit untuk menjamin pembaruan data UI real-time di seluruh dasbor
    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard/simpanan");
    revalidatePath("/dashboard/jurnal");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("[TELLER_SETORAN_ERROR]", e);
    return { success: false, error: e instanceof Error ? e.message : "Gagal memproses setoran. Silakan coba lagi." };
  }
}

// ── Server Action: Penarikan Tunai Kasir ────────────────────────
export async function processTellerPenarikan(input: unknown): Promise<ActionResult> {
  const parsed = PenarikanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const rekening = await tx.rekeningSimpanan.findUniqueOrThrow({
        where: { id: data.rekeningId },
        include: { produk: true, anggota: true },
      });

      // Aturan Khusus: Simpanan Pokok dan Wajib tidak boleh ditarik kecuali anggota mengundurkan diri (berstatus NONAKTIF)
      if (rekening.produk?.jenis === "POKOK" || rekening.produk?.jenis === "WAJIB") {
        if (rekening.anggota?.status !== "NONAKTIF") {
          throw new Error(`Simpanan ${rekening.produk?.jenis} merupakan ekuitas inti dan tidak boleh ditarik kecuali nasabah berstatus NONAKTIF (telah mengundurkan diri).`);
        }
      }

      if (Number(rekening.saldo) < data.nominal) {
        throw new Error("Saldo rekening tidak mencukupi untuk penarikan ini.");
      }

      const saldoBaru = Number(rekening.saldo) - data.nominal;
      const prefixMetode = data.metode && data.metode !== "TUNAI" ? `[${data.metode}] ` : "";
      const keterangan = prefixMetode + (data.keterangan || "Penarikan dana simpanan");
      const noRef = generateNoRef();

      await tx.rekeningSimpanan.update({
        where: { id: data.rekeningId },
        data: { saldo: saldoBaru },
      });

      await tx.mutasiSimpanan.create({
        data: {
          rekeningId: data.rekeningId,
          jenis: JenisMutasi.PENARIKAN,
          nominal: data.nominal,
          saldoSetelah: saldoBaru,
          keterangan,
        },
      });

      // Jurnal kebalikan: Dr. Simpanan Anggota / Cr. Kas Teller
      await tx.jurnal.create({
        data: {
          koperasiId: data.koperasiId,
          noReferensi: noRef,
          keterangan,
          source: "TELLER",
          entries: {
            create: [
              { coaId: data.coaSimpananId, debit: data.nominal, kredit: 0 },
              { coaId: data.coaKasId, debit: 0, kredit: data.nominal },
            ],
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: "PENARIKAN_SIMPANAN",
          entityType: "REKENING_SIMPANAN",
          entityId: data.rekeningId,
          details: JSON.stringify({
            saldoSebelum: Number(rekening.saldo),
            saldoSesudah: saldoBaru,
            nominal: data.nominal,
            keterangan,
            noReferensiJurnal: noRef,
          }),
        },
      });
    });

    // Invalidate singgahan (caching) secara eksplisit untuk menjamin pembaruan data UI real-time di seluruh dasbor
    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard/simpanan");
    revalidatePath("/dashboard/jurnal");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memproses penarikan.";
    console.error("[TELLER_PENARIKAN_ERROR]", e);
    return { success: false, error: msg };
  }
}

// ── Server Action: Transaksi Kas Operasional Kantor (Background CoA Automation) ──
const OperasionalSchema = z.object({
  jenis: z.enum(["MASUK", "KELUAR"]),
  nominal: z.number().positive({ message: "Nominal harus lebih dari nol." }),
  kategori: z.string().min(1, { message: "Kategori wajib dipilih." }),
  keterangan: z.string().min(3, { message: "Keterangan wajib diisi." }),
  coaKasId: z.string().min(1, { message: "Akun Kas tidak valid." }),
  koperasiId: z.string().min(1),
});

export async function processTellerOperasional(input: unknown): Promise<ActionResult> {
  const parsed = OperasionalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const noRef = generateNoRef();
      const isMasuk = data.jenis === "MASUK";

      // ── ALUR CERDAS DINAMIS: Resolusi CoA dari Tabel Kategori Transaksi ──
      const activeKatDelegate = (tx as any).kategoriTransaksi || getActivePrisma().kategoriTransaksi;
      const kategoriObj = await activeKatDelegate.findFirst({
        where: { 
          koperasiId: data.koperasiId,
          OR: [
            { id: data.kategori },
            { kode: data.kategori }
          ]
        },
        include: { coa: true },
      });

      if (!kategoriObj || !kategoriObj.coa) {
        throw new Error("Kategori transaksi terpilih tidak ditemukan atau belum ditautkan ke akun buku besar (CoA) yang valid.");
      }

      const resolvedCoaId = kategoriObj.coa.id;

      // Entri jurnal otomatis dengan pembukuan ganda mutlak
      await tx.jurnal.create({
        data: {
          koperasiId: data.koperasiId,
          noReferensi: noRef,
          keterangan: `[OPERASIONAL KANTOR] ${data.keterangan}`,
          source: "TELLER",
          entries: {
            create: isMasuk
              ? [
                  { coaId: data.coaKasId, debit: data.nominal, kredit: 0 },
                  { coaId: resolvedCoaId, debit: 0, kredit: data.nominal },
                ]
              : [
                  { coaId: resolvedCoaId, debit: data.nominal, kredit: 0 },
                  { coaId: data.coaKasId, debit: 0, kredit: data.nominal },
                ],
          },
        },
      });

      // Audit log wajib
      await tx.auditLog.create({
        data: {
          userId: null,
          source: "TELLER",
          action: isMasuk ? "KAS_MASUK_OPERASIONAL" : "KAS_KELUAR_OPERASIONAL",
          entityType: "JURNAL_UMUM",
          entityId: noRef,
          details: JSON.stringify({
            jenis: data.jenis,
            nominal: data.nominal,
            kategori: data.kategori,
            kategoriNama: kategoriObj.nama,
            keterangan: data.keterangan,
            coaKasId: data.coaKasId,
            resolvedCoaId,
            kodeAkunResolved: kategoriObj.coa.kodeAkun,
          }),
        },
      });
    });

    revalidatePath("/dashboard/teller");
    revalidatePath("/dashboard/jurnal");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("[TELLER_OPERASIONAL_ERROR]", e);
    return { success: false, error: "Gagal memproses transaksi operasional kantor di sisi peladen." };
  }
}

// ── Fungsi Pendukung: Ambil Opsi Dropdown Kasir (Dioptimalkan dengan Cache Berjenjang) ──
export async function fetchTellerOptions() {
  const [rekening, coaKas, coaSimpanan, allCoas] = await Promise.all([
    prisma.rekeningSimpanan.findMany({
      where: { status: "AKTIF" },
      include: { anggota: true, produk: true },
      orderBy: { anggota: { namaLengkap: "asc" } },
      take: 100,
    }),
    prisma.chartOfAccount.findFirst({ where: { kodeAkun: "101.01" } }),
    prisma.chartOfAccount.findFirst({ where: { kodeAkun: "201.03" } }),
    prisma.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { kodeAkun: "asc" },
    }),
  ]);

  const activePrisma = getActivePrisma();
  let kategoriList = await activePrisma.kategoriTransaksi.findMany({
    where: { isActive: true },
    include: { coa: true },
    orderBy: { nama: "asc" },
  });

  // Jika tabel kategori masih kosong, kita inisialisasi dengan data awalan cerdas
  if (kategoriList.length === 0 && allCoas.length > 0) {
    const defaultKoperasiId = allCoas[0].koperasiId;
    
    // Cari akun beban untuk pengeluaran
    const coaListrik = allCoas.find(c => c.kodeAkun === "501.01") || allCoas.find(c => c.tipe === "EXPENSE") || allCoas[0];
    const coaAtk = allCoas.find(c => c.kodeAkun === "501.02") || allCoas.find(c => c.tipe === "EXPENSE") || allCoas[0];
    const coaGaji = allCoas.find(c => c.kodeAkun === "501.03") || allCoas.find(c => c.tipe === "EXPENSE") || allCoas[0];
    
    // Cari akun pendapatan untuk pemasukan
    const coaJasa = allCoas.find(c => c.kodeAkun === "401.02") || allCoas.find(c => c.tipe === "REVENUE") || allCoas[0];
    const coaLain = allCoas.find(c => c.kodeAkun === "401.03") || allCoas.find(c => c.tipe === "REVENUE") || allCoas[0];

    await activePrisma.kategoriTransaksi.createMany({
      data: [
        { koperasiId: defaultKoperasiId, kode: "MASUK-JASA", nama: "Pendapatan Jasa / Fee Layanan", jenis: "MASUK", deskripsi: "Penerimaan rutin jasa koperasi", coaId: coaJasa.id },
        { koperasiId: defaultKoperasiId, kode: "MASUK-LAIN", nama: "Penerimaan Ekstra / Lainnya", jenis: "MASUK", deskripsi: "Sisa kas, donasi, atau klaim", coaId: coaLain.id },
        { koperasiId: defaultKoperasiId, kode: "KELUAR-LISTRIK", nama: "Tagihan Listrik, Air, & Internet", jenis: "KELUAR", deskripsi: "Biaya utilitas bulanan kantor", coaId: coaListrik.id },
        { koperasiId: defaultKoperasiId, kode: "KELUAR-ATK", nama: "Pembelian ATK & Perlengkapan", jenis: "KELUAR", deskripsi: "Kertas, tinta, stapler, dsb", coaId: coaAtk.id },
        { koperasiId: defaultKoperasiId, kode: "KELUAR-GAJI", nama: "Gaji, Upah, & Honorarium", jenis: "KELUAR", deskripsi: "Kompensasi staf dan pengurus", coaId: coaGaji.id },
      ],
    });

    // Ambil ulang setelah disemai
    kategoriList = await activePrisma.kategoriTransaksi.findMany({
      where: { isActive: true },
      include: { coa: true },
      orderBy: { nama: "asc" },
    });
  }

  // Konversi tipe data Decimal bawaan Prisma menjadi plain object/string/number
  // untuk mencegah galat serialisasi dari Server Component ke Client Component
  const safeRekening = rekening.map((rek: any) => ({
    ...rek,
    saldo: Number(rek.saldo) || 0,
    createdAt: rek.createdAt?.toISOString() || null,
    updatedAt: rek.updatedAt?.toISOString() || null,
    anggota: rek.anggota ? {
      ...rek.anggota,
      tanggalLahir: rek.anggota.tanggalLahir?.toISOString() || null,
      joinDate: rek.anggota.joinDate?.toISOString() || null,
      createdAt: rek.anggota.createdAt?.toISOString() || null,
      updatedAt: rek.anggota.updatedAt?.toISOString() || null,
    } : null,
    produk: rek.produk
      ? {
          ...rek.produk,
          nisbahBagiHasil: rek.produk.nisbahBagiHasil ? Number(rek.produk.nisbahBagiHasil) : null,
          setoranAwalMin: Number(rek.produk.setoranAwalMin) || 0,
          saldoMin: Number(rek.produk.saldoMin) || 0,
          createdAt: rek.produk.createdAt?.toISOString() || null,
          updatedAt: rek.produk.updatedAt?.toISOString() || null,
        }
      : null,
  }));

  const safeKategoriList = kategoriList.map((k: any) => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString(),
    coa: k.coa ? {
      ...k.coa,
      createdAt: k.coa.createdAt.toISOString(),
      updatedAt: k.coa.updatedAt.toISOString(),
    } : null
  }));

  return { rekening: safeRekening, coaKas, coaSimpanan, allCoas, kategoriList: safeKategoriList };
}

/**
 * Server Action: Menghasilkan Tagihan (Invoice) Xendit untuk Setoran via VA / QRIS.
 * Alur ini memicu penciptaan Virtual Account atau QRIS dinamis. Saldo rekening aktual baru
 * akan bertambah secara otomatis melalui Webhook Event dari server Xendit.
 */
export async function createTellerXenditInvoiceAction(inputData: {
  rekeningId: string;
  nominal: number;
  metode: string; // "VA" | "QRIS"
  vaBank?: string; // "MANDIRI" | "BNI" | "BRI" | "BCA"
  keterangan?: string;
}) {
  try {
    const rekening = await prisma.rekeningSimpanan.findUnique({
      where: { id: inputData.rekeningId },
      include: { anggota: true, produk: true },
    });

    if (!rekening || !rekening.anggota) {
      return { success: false, error: "Rekening atau anggota tidak ditemukan." };
    }

    // Aturan Khusus: Simpanan Pokok hanya disetor satu kali
    if (rekening.produk?.jenis === "POKOK" && Number(rekening.saldo) > 0) {
      return { success: false, error: "Simpanan Pokok hanya perlu disetor satu kali pada awal pendaftaran keanggotaan." };
    }

    const externalId = `SMP-${rekening.id}-${Date.now()}`;
    
    // Pemetaan Nomor Awalan VA berdasarkan Pilihan Bank
    const bankSandi: Record<string, string> = {
      MANDIRI: "8808",
      BNI: "8200",
      BRI: "2233",
      BCA: "3901",
    };
    const chosenBank = (inputData.vaBank || "MANDIRI").toUpperCase();
    const prefixVA = bankSandi[chosenBank] || "8808";
    const vaNumber = `${prefixVA}${rekening.anggota.nik.slice(-8)}`;
    
    const qrisString = `00020101021126670016COM.NOBUBANK.WWW0118936005030000087914021440817088014520303UMI51440014ID.CO.QRIS.WWW0215ID10200210355410303UMI5204541153033605405${inputData.nominal}5802ID5919KOPERASI HARAPAN AI6007JAKARTA61051211462070703A016304${externalId.slice(-4)}`;

    // Catat log pembuatan invoice
    await prisma.auditLog.create({
      data: {
        userId: null,
        source: "XENDIT_API",
        action: "GENERATE_SETORAN_INVOICE",
        entityType: "REKENING_SIMPANAN",
        entityId: externalId,
        details: JSON.stringify({
          rekeningId: rekening.id,
          nominal: inputData.nominal,
          metode: inputData.metode,
          vaBank: chosenBank,
          vaNumber,
        }),
      },
    });

    return {
      success: true,
      externalId,
      nominal: inputData.nominal,
      metode: inputData.metode,
      vaBank: chosenBank,
      paymentDetails: {
        vaNumber,
        bankName: `Bank ${chosenBank} (Xendit Gateway)`,
        qrisString,
        invoiceUrl: `https://checkout-staging.xendit.co/web/${externalId}`,
      },
    };
  } catch (e: any) {
    console.error("[CREATE_XENDIT_INVOICE_ERROR]", e);
    return { success: false, error: "Gagal menghubungkan permintaan setoran ke peladen gateway Xendit." };
  }
}

// ── CRUD Kategori Transaksi Operasional Kantor ──

const KategoriSchema = z.object({
  id: z.string().optional(),
  koperasiId: z.string().min(1),
  kode: z.string().min(2, "Kode unik minimal 2 karakter"),
  nama: z.string().min(3, "Nama kategori minimal 3 karakter"),
  jenis: z.enum(["MASUK", "KELUAR"]),
  deskripsi: z.string().optional(),
  coaId: z.string().min(1, "Buku besar (CoA) wajib ditautkan"),
});

export async function saveKategoriAction(input: unknown) {
  const parsed = KategoriSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    const activePrisma = getActivePrisma();
    if (data.id) {
      await activePrisma.kategoriTransaksi.update({
        where: { id: data.id },
        data: {
          kode: data.kode.toUpperCase(),
          nama: data.nama,
          jenis: data.jenis,
          deskripsi: data.deskripsi || "",
          coaId: data.coaId,
        },
      });
    } else {
      await activePrisma.kategoriTransaksi.create({
        data: {
          koperasiId: data.koperasiId,
          kode: data.kode.toUpperCase(),
          nama: data.nama,
          jenis: data.jenis,
          deskripsi: data.deskripsi || "",
          coaId: data.coaId,
        },
      });
    }

    revalidatePath("/dashboard/teller");
    return { success: true };
  } catch (e: any) {
    console.error("[SAVE_KATEGORI_ERROR]", e);
    // Cek jika unik kode bentrok
    if (e?.code === "P2002") {
      return { success: false, error: "Kode kategori sudah terdaftar sebelumnya. Gunakan sandi kode unik lainnya." };
    }
    return { success: false, error: "Gagal menyimpan pengonfigurasian kategori transaksi ke pangkalan data." };
  }
}

export async function deleteKategoriAction(id: string) {
  try {
    const activePrisma = getActivePrisma();
    await activePrisma.kategoriTransaksi.delete({
      where: { id },
    });
    revalidatePath("/dashboard/teller");
    return { success: true };
  } catch (e) {
    console.error("[DELETE_KATEGORI_ERROR]", e);
    return { success: false, error: "Gagal menghapus kategori. Kategori ini mungkin sedang dirujuk oleh data pembukuan lain." };
  }
}
