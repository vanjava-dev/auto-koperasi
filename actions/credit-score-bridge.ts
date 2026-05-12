"use server";

import { calculateCreditScore } from "@/lib/automation/credit-score";

/**
 * Jembatan Server Action untuk memanggil mesin penilaian risiko kredit AI dari antarmuka Klien.
 */
export async function analyzeCreditScoreAction(inputData: {
  memberId: string;
  monthlyIncome: number;
  totalObligations: number;
  collateralValue: number;
  loanAmount: number;
  loanPurpose?: string;
}) {
  // Panggil layanan penilaian risiko kredit AI inti yang telah terpasang jejak audit
  return await calculateCreditScore(
    inputData.memberId,
    inputData.loanAmount,
    inputData.collateralValue,
    inputData.loanPurpose || "Modal Pengembangan Usaha"
  );
}
