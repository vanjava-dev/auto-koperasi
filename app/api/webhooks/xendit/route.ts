import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisMutasi, StatusJadwal } from ".prisma/client";
import { buildJurnalOperations } from "@/lib/automation/journaling";

/**
 * Pemroses Webhook Transaksi Event-Driven dari Xendit Payment Gateway.
 * Menangani transfer Virtual Account (VA) dan pemindaian QRIS secara nirkontak.
 * Endpoint: POST /api/webhooks/xendit
 */
export async function POST(request: Request) {
  try {
    // 1. Validasi Token Keamanan Webhook (Mandatory Aturan E)
    const callbackToken = request.headers.get("x-callback-token");
    const secretToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!secretToken || callbackToken !== secretToken) {
      console.warn("[WEBHOOK_XENDIT] Tolak: Token keamanan tidak valid/hilang.");
      return NextResponse.json({ success: false, error: "Unauthorized callback token" }, { status: 401 });
    }

    // Ambil muatan JSON
    const payload = await request.json();
    const externalId = payload.external_id;
    const nominalPaid = Number(payload.amount || payload.paid_amount || 0);

    if (!externalId) {
      return NextResponse.json({ success: false, error: "Missing external_id" }, { status: 400 });
    }

    // 2. Pemeriksaan Idempotensi (Cegah Eksekusi Ganda)
    // Kita periksa apakah external_id ini sudah tercatat sebagai entityId pada log webhook
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        source: "WEBHOOK",
        entityId: externalId,
      },
    });

    if (existingLog) {
      console.log(`[WEBHOOK_XENDIT] Lewati: Transaksi ${externalId} telah diproses sebelumnya.`);
      return NextResponse.json({ success: true, message: "Already processed (Idempotent)" }, { status: 200 });
    }

    // 3. Penyortiran dan Eksekusi Berbasis Prefix external_id
    // Contoh format: "SMP-{rekeningId}-{timestamp}" atau "ANG-{jadwalId}-{timestamp}"
    const parts = externalId.split("-");
    const prefix = parts[0];
    const targetId = parts[1]; // UUID dari entitas target

    if (!targetId || targetId.length < 10) {
      return NextResponse.json({ success: false, error: "Malformed external_id structure" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (prefix === "SMP") {
        // ── A. PEMROSESAN SETORAN SIMPANAN (VA / QRIS) ────────────────
        const rekening = await tx.rekeningSimpanan.findUniqueOrThrow({
          where: { id: targetId },
          include: { produk: true },
        });

        const saldoBaru = Number(rekening.saldo) + nominalPaid;
        const keterangan = `Setoran otomatis via Xendit (${payload.bank_code || payload.payment_channel || "VA/QRIS"})`;

        // Ambil pemetaan COA
        const coaKasBank = await tx.chartOfAccount.findFirst({
          where: { kodeAkun: "101.02" }, // Kas di Bank (Xendit Escrow)
        });
        const coaSimpanan = await tx.chartOfAccount.findFirst({
          where: { id: rekening.produk.coaId },
        });

        // Update saldo
        await tx.rekeningSimpanan.update({
          where: { id: targetId },
          data: { saldo: saldoBaru },
        });

        // Mutasi
        await tx.mutasiSimpanan.create({
          data: {
            rekeningId: targetId,
            jenis: JenisMutasi.SETORAN,
            nominal: nominalPaid,
            saldoSetelah: saldoBaru,
            keterangan,
          },
        });

        // Jurnal Otomatis
        if (coaKasBank && coaSimpanan) {
          const noRef = `JRN-WH-${Date.now().toString().slice(-6)}`;
          await tx.jurnal.create({
            data: {
              koperasiId: rekening.produk.koperasiId,
              noReferensi: noRef,
              keterangan,
              source: "WEBHOOK",
              entries: {
                create: [
                  { coaId: coaKasBank.id, debit: nominalPaid, kredit: 0 },
                  { coaId: coaSimpanan.id, debit: 0, kredit: nominalPaid },
                ],
              },
            },
          });
        }

        // Audit Log (Wajib Aturan L)
        await tx.auditLog.create({
          data: {
            userId: null,
            source: "WEBHOOK",
            action: "WEBHOOK_SETORAN_SIMPANAN",
            entityType: "REKENING_SIMPANAN",
            entityId: externalId, // Simpan externalId agar terdeteksi idempotensi
            details: JSON.stringify({
              targetRekeningId: targetId,
              nominalPaid,
              paymentChannel: payload.payment_channel,
              keterangan,
            }),
          },
        });

      } else if (prefix === "ANG") {
        // ── B. PEMROSESAN PEMBAYARAN ANGSURAN PINJAMAN ────────────────
        const jadwal = await tx.jadwalAngsuran.findUniqueOrThrow({
          where: { id: targetId },
          include: { pinjaman: true },
        });

        const sisaHutangLama = Number(jadwal.pinjaman.sisaHutang);
        const sisaHutangBaru = Math.max(0, sisaHutangLama - nominalPaid);
        const isLunas = sisaHutangBaru === 0;

        // Update jadwal angsuran
        await tx.jadwalAngsuran.update({
          where: { id: targetId },
          data: {
            status: StatusJadwal.DIBAYAR,
            paidAt: new Date(),
          },
        });

        // Update sisa hutang pinjaman induk
        await tx.pinjaman.update({
          where: { id: jadwal.pinjaman.id },
          data: {
            sisaHutang: sisaHutangBaru,
            status: isLunas ? "LUNAS" : undefined,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: null,
            source: "WEBHOOK",
            action: "WEBHOOK_BAYAR_ANGSURAN",
            entityType: "JADWAL_ANGSURAN",
            entityId: externalId,
            details: JSON.stringify({
              targetJadwalId: targetId,
              pinjamanId: jadwal.pinjaman.id,
              nominalPaid,
              sisaHutangBaru,
            }),
          },
        });

      } else {
        throw new Error(`Prefix transaksi '${prefix}' tidak didukung sistem.`);
      }
    });

    console.log(`[WEBHOOK_XENDIT] Sukses: Transaksi ${externalId} tereksekusi sempurna.`);
    return NextResponse.json({ success: true, externalId }, { status: 200 });

  } catch (e) {
    console.error("[WEBHOOK_PROCESSOR_ERROR]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Galat internal pemroses webhook" },
      { status: 500 }
    );
  }
}
