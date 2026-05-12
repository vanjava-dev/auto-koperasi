import { prisma } from "@/lib/prisma";
import { JenisMutasi } from ".prisma/client";

function generateNoRef(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `JRN-INT-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function runInterestDistributionJob() {
  console.log("[CRON_START] runInterestDistributionJob...");
  let processedCount = 0;
  let totalBungaDistributed = 0;

  try {
    const coaBebanBunga = await prisma.chartOfAccount.findFirst({
      where: { kodeAkun: "501.01" },
    });

    const rekeningAktif = await prisma.rekeningSimpanan.findMany({
      where: { status: "AKTIF", saldo: { gt: 0 } },
      include: { produk: true },
    });

    for (const rekening of rekeningAktif) {
      // Menggunakan nisbahBagiHasil sebagai pengali persentase p.a.
      const sukuBungaTahunan = Number(rekening.produk.nisbahBagiHasil || 0);
      if (sukuBungaTahunan <= 0) continue;

      const bungaBulanan = Math.round((Number(rekening.saldo) * (sukuBungaTahunan / 100)) / 12);
      if (bungaBulanan <= 0) continue;

      const saldoBaru = Number(rekening.saldo) + bungaBulanan;
      const keterangan = `Bagi hasil / Bunga simpanan bulanan (${sukuBungaTahunan}% p.a)`;
      const koperasiId = rekening.produk.koperasiId;

      await prisma.$transaction(async (tx) => {
        // a. Update saldo
        await tx.rekeningSimpanan.update({
          where: { id: rekening.id },
          data: { saldo: saldoBaru },
        });

        // b. Mutasi
        await tx.mutasiSimpanan.create({
          data: {
            rekeningId: rekening.id,
            jenis: JenisMutasi.BUNGA_BAGIHASIL,
            nominal: bungaBulanan,
            saldoSetelah: saldoBaru,
            keterangan,
          },
        });

        // c. Jurnal
        const coaSimpanan = await tx.chartOfAccount.findFirst({
          where: { id: rekening.produk.coaId },
        });

        if (coaBebanBunga && coaSimpanan) {
          await tx.jurnal.create({
            data: {
              koperasiId,
              noReferensi: generateNoRef(),
              keterangan: `Distribusi Imbal Jasa Rek. ${rekening.id}`,
              source: "SYSTEM",
              entries: {
                create: [
                  { coaId: coaBebanBunga.id, debit: bungaBulanan, kredit: 0 },
                  { coaId: coaSimpanan.id, debit: 0, kredit: bungaBulanan },
                ],
              },
            },
          });
        }

        // d. Audit log
        await tx.auditLog.create({
          data: {
            userId: null,
            source: "CRON",
            action: "KREDIT_BUNGA_SIMPANAN",
            entityType: "REKENING_SIMPANAN",
            entityId: rekening.id,
            details: JSON.stringify({
              saldoSebelum: Number(rekening.saldo),
              bungaKredit: bungaBulanan,
              saldoSesudah: saldoBaru,
            }),
          },
        });
      });

      processedCount++;
      totalBungaDistributed += bungaBulanan;
    }

    console.log(`[CRON_SUCCESS] Distribusi Bunga selesai. Total: Rp ${totalBungaDistributed.toLocaleString("id-ID")} untuk ${processedCount} rekening.`);
    return { success: true, processedCount, totalDistributed: totalBungaDistributed };
  } catch (e) {
    console.error("[CRON_INTEREST_ERROR]", e);
    return { success: false, error: e instanceof Error ? e.message : "Galat distribusi bunga" };
  }
}
