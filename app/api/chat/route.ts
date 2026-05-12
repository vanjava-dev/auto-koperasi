import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

/**
 * Route Handler Asisten AI Percakapan Core Koperasi.
 * Berperan sebagai penasihat cerdas (Advisory AI Agent) yang membimbing
 * pengurus dan kasir (Teller) mengenai tata cara transaksi dan aturan koperasi.
 * Endpoint: POST /api/chat
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `Anda adalah Asisten AI Core Koperasi mutakhir bernama "Koperasi-AI".
Tugas Anda adalah memberikan saran, panduan operasional, serta membimbing kasir/teller dalam mencatat setoran, penarikan, dan pembiayaan sesuai Standar Operasional Prosedur (SOP).
Jawablah pertanyaan dengan ramah, profesional, dan ringkas. Gunakan pemformatan poin atau tabel jika menjelaskan tahapan prosedur.`;

    const result = streamText({
      model: google("gemini-1.5-pro"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (e) {
    console.error("[AI_CHAT_ROUTE_ERROR]", e);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan internal pada peladen asisten cerdas." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
