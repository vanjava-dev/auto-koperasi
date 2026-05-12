import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

export interface OcrResult {
  success: boolean;
  confidence: number; // 0.0 - 1.0 (Rerata skor kepercayaan)
  data: {
    nik?: string | null;
    namaLengkap?: string | null;
    tempatLahir?: string | null;
    tanggalLahir?: string | null; // YYYY-MM-DD
    jenisKelamin?: "LAKI_LAKI" | "PEREMPUAN" | null;
    alamat?: string | null;
    agama?: string | null;
    pekerjaan?: string | null;
  };
  rawText: string;
  warnings: string[];
  fieldConfidence: {
    nik: number;
    namaLengkap: number;
    tempatLahir: number;
    tanggalLahir: number;
    jenisKelamin: number;
    alamat: number;
    agama: number;
    pekerjaan: number;
  };
}

/**
 * Mengonversi URL/URI atau Base64 gambar menjadi Part masukan Gemini Vision.
 */
async function fetchImageAsGenerativePart(imageUrl: string) {
  // Jika masukan sudah berupa data URI base64
  if (imageUrl.startsWith("data:image")) {
    const parts = imageUrl.split(",");
    const mimeType = parts[0].split(":")[1].split(";")[0];
    const base64Data = parts[1];
    return {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
  }

  // Jika URL publik, kita unduh terlebih dahulu sebagai ArrayBuffer
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64Data,
      mimeType: blob.type || "image/jpeg",
    },
  };
}

/**
 * Layanan Otomasi: Ekstraksi Informasi KTP via Google Gemini Vision API.
 * Sesuai spesifikasi Intelligent Document Processing (SOP Bab 2).
 */
export async function extractKTPData(imageUrl: string): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash";

  const defaultFail: OcrResult = {
    success: false,
    confidence: 0,
    data: {},
    rawText: "",
    warnings: ["Gagal memproses gambar atau API Key tidak tersedia."],
    fieldConfidence: {
      nik: 0, namaLengkap: 0, tempatLahir: 0, tanggalLahir: 0,
      jenisKelamin: 0, alamat: 0, agama: 0, pekerjaan: 0,
    },
  };

  if (!apiKey) {
    console.warn("[OCR_SERVICE] Peringatan: GOOGLE_AI_API_KEY tidak dikonfigurasi.");
    return defaultFail;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = await fetchImageAsGenerativePart(imageUrl);

    const prompt = `Ekstrak informasi dari foto KTP Indonesia ini.
Kembalikan HANYA objek JSON dengan format persis berikut tanpa blok backtick markdown atau teks lain:
{
  "nik": "string 16 digit atau null",
  "namaLengkap": "string atau null",
  "tempatLahir": "string atau null",
  "tanggalLahir": "YYYY-MM-DD atau null",
  "jenisKelamin": "LAKI_LAKI" | "PEREMPUAN" | null,
  "alamat": "string alamat lengkap atau null",
  "agama": "string atau null",
  "pekerjaan": "string atau null",
  "fieldConfidence": {
    "nik": 0.99,
    "namaLengkap": 0.95,
    "tempatLahir": 0.90,
    "tanggalLahir": 0.90,
    "jenisKelamin": 0.99,
    "alamat": 0.85,
    "agama": 0.90,
    "pekerjaan": 0.75
  }
}
Pastikan estimasi fieldConfidence mencerminkan tingkat kejelasan pembacaan piksel (0.0 hingga 1.0).`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [prompt, imagePart],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Nilai rendah untuk keakuratan ekstraksi fakta
      },
    });

    const rawText = response.text || "";
    const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    // Hitung rerata kepercayaan
    const confObj = parsed.fieldConfidence || {};
    const values = Object.values(confObj) as number[];
    const avgConfidence = values.reduce((a, b) => a + b, 0) / (values.length || 1);

    // Susun daftar peringatan jika ada bidang dengan keyakinan di bawah 75%
    const warnings: string[] = [];
    for (const [key, val] of Object.entries(confObj)) {
      if (Number(val) < 0.75) {
        warnings.push(`Bidang ${key} memiliki tingkat pembacaan rendah (${Math.round(Number(val)*100)}%). Perlu verifikasi manual.`);
      }
    }

    const result: OcrResult = {
      success: true,
      confidence: avgConfidence,
      data: {
        nik: parsed.nik,
        namaLengkap: parsed.namaLengkap,
        tempatLahir: parsed.tempatLahir,
        tanggalLahir: parsed.tanggalLahir,
        jenisKelamin: parsed.jenisKelamin,
        alamat: parsed.alamat,
        agama: parsed.agama,
        pekerjaan: parsed.pekerjaan,
      },
      rawText,
      warnings,
      fieldConfidence: {
        nik: confObj.nik || 0,
        namaLengkap: confObj.namaLengkap || 0,
        tempatLahir: confObj.tempatLahir || 0,
        tanggalLahir: confObj.tanggalLahir || 0,
        jenisKelamin: confObj.jenisKelamin || 0,
        alamat: confObj.alamat || 0,
        agama: confObj.agama || 0,
        pekerjaan: confObj.pekerjaan || 0,
      },
    };

    // Catat jejak audit atas pemanggilan Vision AI (Aturan F)
    try {
      await prisma.auditLog.create({
        data: {
          userId: null,
          source: "AI_AGENT",
          action: "OCR_KTP_EXTRACTION",
          entityType: "ANGGOTA",
          entityId: parsed.nik || "UNKNOWN_NIK",
          details: JSON.stringify({
            avgConfidence,
            warningsCount: warnings.length,
            extractedNik: parsed.nik,
            extractedNama: parsed.namaLengkap,
          }),
        },
      });
    } catch (logErr) {
      console.error("[OCR_AUDIT_LOG_ERROR]", logErr);
    }

    return result;
  } catch (e) {
    console.error("[OCR_EXTRACTION_FAIL]", e);
    return {
      ...defaultFail,
      warnings: ["Terjadi galat teknis saat menghubungi layanan Google Gemini Vision."],
      rawText: e instanceof Error ? e.message : "Galat tidak dikenal",
    };
  }
}
