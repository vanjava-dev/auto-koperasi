"use server";

import { extractKTPData, OcrResult } from "@/lib/automation/ocr";

/**
 * Jembatan Server Action untuk mengeksekusi layanan OCR dari komponen Klien UI.
 */
export async function scanKtpFromUrlAction(imageUrl: string): Promise<OcrResult> {
  if (!imageUrl || imageUrl.trim() === "") {
    return {
      success: false,
      confidence: 0,
      data: {},
      rawText: "",
      warnings: ["Tautan gambar KTP wajib diisi."],
      fieldConfidence: {
        nik: 0, namaLengkap: 0, tempatLahir: 0, tanggalLahir: 0,
        jenisKelamin: 0, alamat: 0, agama: 0, pekerjaan: 0,
      },
    };
  }

  // Panggil layanan Vision AI inti yang telah terpasang jejak audit
  return await extractKTPData(imageUrl);
}
