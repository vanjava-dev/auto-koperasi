import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

function createSimulatedStream(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const words = text.split(" ");
      for (const word of words) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
    const isDemoKey = apiKey.includes("AIzaSyDIX7KQI0LsTI6") || !apiKey;

    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : "";

    // Logika Respons Panduan Cerdas Berbasis Konteks Koperasi
    let fallbackAnswer = "";
    if (lastMsg.includes("setoran") || lastMsg.includes("simpanan") || lastMsg.includes("sop")) {
      fallbackAnswer = `Berdasarkan **SOP Koperasi-AI**, pencatatan setoran simpanan tunai harus melalui tahapan pembukuan ganda (Double-Entry) terintegrasi berikut:

1. **Verifikasi Identitas**: Kasir/Teller memverifikasi NIK/CIF serta status keaktifan Anggota.
2. **Penerimaan Fisik Kas**: Teller menerima dan menghitung kesesuaian fisik uang tunai.
3. **Pencatatan Modul**: Input nominal transaksi pada antarmuka Dasbor Simpanan untuk memicu mutasi sistem.
4. **Jurnal Otomatis (SSOT)**: Mesin akuntansi akan otomatis membentuk jurnal seimbang secara seketika:
   • **Debit**: Kas Tunai Teller Utama (101.01)
   • **Kredit**: Simpanan Sukarela / Berjangka Anggota (201.01 / 201.02)
5. **Validasi Akhir**: Sistem mencetak stempel jejak audit (Audit Log) dan kasir menyerahkan tanda terima resmi kepada Anggota.`;
    } else if (lastMsg.includes("denda") || lastMsg.includes("sanksi") || lastMsg.includes("terlambat") || lastMsg.includes("angsuran")) {
      fallbackAnswer = `Sesuai kepatuhan standar PSAK Koperasi dan modul **Koperasi-AI**, ketentuan denda keterlambatan angsuran pembiayaan diatur sebagai berikut:

• **Tarif Denda Bawaan**: Ditetapkan sebesar **0.1% per hari keterlambatan** dari porsi pokok angsuran yang tertunggak.
• **Pengakuan Pendapatan**: Kasir mencatat penerimaan denda melalui modul pembayaran angsuran. Sistem mengklasifikasikan aliran dana ini ke pos **Pendapatan Denda Keterlambatan Angsuran (401.03)**.
• **Otomatisasi Jurnal**: Pembayaran denda memicu jurnal riil:
   • **Debit**: Kas Tunai Teller Utama (101.01)
   • **Kredit**: Pendapatan Denda Keterlambatan Angsuran (401.03)

Sistem juga akan menandai status kolektibilitas debitur secara dinamis berdasarkan histori pembayaran.`;
    } else {
      fallbackAnswer = `Terima kasih atas pertanyaan Anda. Sebagai Asisten AI Core Koperasi, saya bertugas mengawal kepatuhan SOP pembukuan ganda dan manajemen risiko.

Untuk menjamin kelayakan portofolio pembiayaan, pastikan setiap persetujuan plafon selalu merujuk pada skor kelayakan **AI Credit Scoring 5C** dan rasio NPL instansi tetap berada di bawah ambang batas standar (<5%). Apakah ada rincian nomor kontrak atau prosedur spesifik lain yang ingin Anda konsultasikan hari ini?`;
    }

    // Jika menggunakan kunci demo bawaan, langsung kembalikan respons simulasi streaming premium
    if (isDemoKey) {
      return new Response(createSimulatedStream(fallbackAnswer), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Eksekusi pemanggilan riil ke Google Gemini API
    const systemPrompt = `Anda adalah Asisten AI Core Koperasi mutakhir bernama "Koperasi-AI".
Tugas Anda adalah memberikan saran, panduan operasional, serta membimbing kasir/teller dalam mencatat setoran, penarikan, dan pembiayaan sesuai Standar Operasional Prosedur (SOP).
Jawablah pertanyaan dengan ramah, profesional, dan ringkas. Gunakan pemformatan poin atau tabel jika menjelaskan tahapan prosedur.`;

    const result = await streamText({
      model: google("gemini-1.5-pro"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (e) {
    console.error("[AI_CHAT_ROUTE_ERROR]", e);
    // Fallback tangguh jika API Key riil mengalami limitasi kuota atau gangguan jaringan
    const errorFallbackAnswer = `Mohon maaf, koneksi ke peladen utama Google Gemini sedang mengalami penyesuaian jaringan atau limitasi kuota.

Namun sebagai referensi cepat SOP Koperasi: Pastikan seluruh transaksi kasir selalu terikat pada pos Akun Buku Besar (CoA) yang tepat untuk menjaga keseimbangan neraca lajur secara otomatis. Silakan hubungi administrator sistem jika kendala berlanjut.`;
    
    return new Response(createSimulatedStream(errorFallbackAnswer), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
