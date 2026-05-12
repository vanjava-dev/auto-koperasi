import { prisma } from "@/lib/prisma";

export interface CreditScoreResult {
  score: number; // 300 - 850
  grade: "A" | "B" | "C" | "D" | "E";
  recommendation: "SETUJUI" | "PERTIMBANGKAN" | "TOLAK";
  maxPinjaman: number; // Rekomendasi plafon maksimal
  reasons: string[];   // Alasan pembentuk skor
  riskFlags: string[]; // Tanda anomali
  detail: {
    character: number; // Bobot 20%
    capacity: number;  // Bobot 30%
    capital: number;   // Bobot 20%
    collateral: number;// Bobot 15%
    condition: number; // Bobot 10%
    aiRisk: number;    // Bobot 5%
  };
}

/**
 * Menilai kelayakan kredit anggota menggunakan parameter 5C yang dianalisis
 * dari riwayat transaksi dan portofolio di database.
 * Pendekatan deterministik terukur tanpa ketergantungan pada LLM eksternal.
 */
export async function calculateCreditScore(
  anggotaId: string,
  pengajuanPlafon: number,
  nilaiJaminan: number = 0,
  tujuanPembiayaan: string = "Modal Usaha"
): Promise<CreditScoreResult> {
  const reasons: string[] = [];
  const riskFlags: string[] = [];

  // 1. Ambil data agregat anggota dari pangkalan data
  const anggota = await prisma.anggota.findUniqueOrThrow({
    where: { id: anggotaId },
    include: {
      rekeningSimpanan: {
        where: { status: "AKTIF" },
        select: { saldo: true },
      },
      pinjaman: {
        select: {
          status: true,
          plafon: true,
          sisaHutang: true,
          kolektibilitas: true,
        },
      },
    },
  });

  // ── A. Character (Bobot 20% — Maks 170 poin dari total 850) ────────
  let charScore = 120; // Nilai dasar anggota baru
  const pinjamanSelesai = anggota.pinjaman.filter(p => p.status === "LUNAS");
  const pinjamanAktif = anggota.pinjaman.filter(p => p.status === "AKTIF");
  const pinjamanMacet = anggota.pinjaman.filter(p => p.status === "MACET");

  if (pinjamanSelesai.length > 0) {
    charScore += 30; // Bonus riwayat lunas
    reasons.push("Memiliki riwayat pelunasan pinjaman yang baik.");
  }
  if (pinjamanMacet.length > 0) {
    charScore -= 80; // Penalti berat
    riskFlags.push("Riwayat pinjaman berstatus MACET ditemukan.");
    reasons.push("Catatan kolektibilitas buruk pada siklus sebelumnya.");
  }
  // Batasi pada bobot maksimal 170 poin
  charScore = Math.min(Math.max(charScore, 40), 170);

  // ── B. Capacity (Bobot 30% — Maks 255 poin) ────────────────────────
  // Asumsi penghasilan bulanan dihitung dari rerata mutasi atau fallback standar
  // Kita gunakan simulasi rasio kewajiban (Debt Service Ratio)
  const totalHutangAktif = pinjamanAktif.reduce((acc, p) => acc + Number(p.sisaHutang), 0);
  let capScore = 180;

  if (totalHutangAktif === 0) {
    capScore += 50;
    reasons.push("Tidak memiliki beban hutang aktif di koperasi.");
  } else if (totalHutangAktif > pengajuanPlafon * 2) {
    capScore -= 70;
    riskFlags.push("Rasio kewajiban (DSR) tinggi terhadap plafon baru.");
  }
  capScore = Math.min(Math.max(capScore, 50), 255);

  // ── C. Capital (Bobot 20% — Maks 170 poin) ─────────────────────────
  const totalSimpanan = anggota.rekeningSimpanan.reduce((acc, r) => acc + Number(r.saldo), 0);
  let capAssetScore = 100;

  if (totalSimpanan > pengajuanPlafon * 0.3) {
    capAssetScore += 60;
    reasons.push("Saldo simpanan mencukupi sebagai bantalan penyangga (buffer).");
  } else if (totalSimpanan < pengajuanPlafon * 0.05) {
    capAssetScore -= 30;
    reasons.push("Rasio permodalan simpanan rendah dibandingkan nilai pengajuan.");
  }
  capAssetScore = Math.min(Math.max(capAssetScore, 30), 170);

  // ── D. Collateral (Bobot 15% — Maks 127.5 poin) ────────────────────
  let colScore = 60;
  if (nilaiJaminan >= pengajuanPlafon) {
    colScore = 127.5;
    reasons.push("Nilai agunan/jaminan meng-cover penuh nominal pengajuan.");
  } else if (nilaiJaminan > 0) {
    colScore = 90;
    reasons.push("Agunan parsial disertakan guna menekan eksposur risiko.");
  } else {
    reasons.push("Pengajuan pinjaman tanpa agunan (unsecured loan).");
  }

  // ── E. Condition (Bobot 10% — Maks 85 poin) ────────────────────────
  let condScore = 60;
  if (tujuanPembiayaan.toLowerCase().includes("usaha") || tujuanPembiayaan.toLowerCase().includes("modal")) {
    condScore = 85; // Pembiayaan produktif
    reasons.push("Sektor pembiayaan produktif berpotensi menghasilkan arus kas balik.");
  } else {
    condScore = 50; // Konsumtif
  }

  // ── F. AI Risk Factor (Bobot 5% — Maks 42.5 poin) ──────────────────
  // Pengecekan anomali: misal usia keanggotaan sangat baru (< 1 bulan) namun langsung pinjam besar
  let aiRiskScore = 40;
  const joinDate = new Date(anggota.joinDate);
  const now = new Date();
  const monthsMember = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

  if (monthsMember < 1 && pengajuanPlafon > 5000000) {
    aiRiskScore = 10;
    riskFlags.push("Anomali: Anggota baru mendaftar langsung mengajukan plafon tinggi.");
  }

  // ── Kalkulasi Akhir Skor Kredit ──────────────────────────────────
  const rawScore = charScore + capScore + capAssetScore + colScore + condScore + aiRiskScore;
  // Rentang standar SLIK/FICO: 300 - 850
  const finalScore = Math.round(Math.min(Math.max(rawScore, 300), 850));

  // Penentuan Mutu (Grade) & Rekomendasi
  let grade: CreditScoreResult["grade"] = "C";
  let recommendation: CreditScoreResult["recommendation"] = "PERTIMBANGKAN";
  let maxPinjaman = totalSimpanan * 3; // Standar kelayakan dasar

  if (finalScore >= 750) {
    grade = "A";
    recommendation = "SETUJUI";
    maxPinjaman = Math.max(totalSimpanan * 5, 10000000);
  } else if (finalScore >= 650) {
    grade = "B";
    recommendation = "SETUJUI";
    maxPinjaman = Math.max(totalSimpanan * 4, 5000000);
  } else if (finalScore >= 550) {
    grade = "C";
    recommendation = "PERTIMBANGKAN";
    maxPinjaman = Math.max(totalSimpanan * 2, 2000000);
  } else if (finalScore >= 400) {
    grade = "D";
    recommendation = "TOLAK";
    maxPinjaman = totalSimpanan;
  } else {
    grade = "E";
    recommendation = "TOLAK";
    maxPinjaman = 0;
  }

  // Catat jejak audit aktivitas scoring jika menyentuh ambang batas kritis
  // AuditLog dapat dipanggil langsung karena fungsi ini tidak memutasi data primer
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        source: "AI_AGENT",
        action: "GENERATE_CREDIT_SCORE",
        entityType: "ANGGOTA",
        entityId: anggotaId,
        details: JSON.stringify({
          pengajuanPlafon,
          finalScore,
          grade,
          recommendation,
          riskFlagsCount: riskFlags.length,
        }),
      },
    });
  } catch (e) {
    console.error("[AUDIT_LOG_SCORING_WARNING]", e);
  }

  return {
    score: finalScore,
    grade,
    recommendation,
    maxPinjaman: Math.round(maxPinjaman),
    reasons,
    riskFlags,
    detail: {
      character: Math.round(charScore),
      capacity: Math.round(capScore),
      capital: Math.round(capAssetScore),
      collateral: Math.round(colScore),
      condition: Math.round(condScore),
      aiRisk: Math.round(aiRiskScore),
    },
  };
}
