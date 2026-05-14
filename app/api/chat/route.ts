import { streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { processTellerSetoran } from "@/actions/teller";

export const maxDuration = 60;

function createSimulatedStream(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const words = text.split(" ");
      for (const word of words) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise((resolve) => setTimeout(resolve, 15));
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

    // ── DEFINISI TOOLS KOPERASI UNTUK GEMINI API RIIL ──
    const cooperativeTools = {
      cariAnggota: tool({
        description: "Cari anggota koperasi beserta daftar rekening simpanan aktif berdasarkan nama atau NIK",
        parameters: z.object({
          kataKunci: z.string().describe("Nama anggota atau NIK yang ingin dicari"),
        }),
        execute: async ({ kataKunci }: { kataKunci: string }) => {
          const daftar = await prisma.anggota.findMany({
            where: {
              OR: [
                { namaLengkap: { contains: kataKunci, mode: "insensitive" } },
                { nik: { contains: kataKunci } },
              ],
            },
            include: {
              rekeningSimpanan: { include: { produk: true } },
            },
            take: 5,
          });

          return daftar.map((a) => ({
            id: a.id,
            namaLengkap: a.namaLengkap,
            nik: a.nik,
            status: a.status,
            rekening: a.rekeningSimpanan.map((r) => ({
              rekeningId: r.id,
              produk: r.produk?.namaProduk || "Simpanan",
              jenis: r.produk?.jenis,
              saldoTerkini: Number(r.saldo),
            })),
          }));
        },
      } as any),

      catatSetoranTunai: tool({
        description: "Mencatat transaksi setoran simpanan tunai ke rekening anggota secara real-time dan menjurnal otomatis",
        parameters: z.object({
          rekeningId: z.string().describe("ID rekening simpanan tujuan"),
          nominal: z.number().positive().describe("Jumlah uang setoran dalam Rupiah"),
          keterangan: z.string().optional().describe("Keterangan setoran"),
        }),
        execute: async ({ rekeningId, nominal, keterangan }: { rekeningId: string; nominal: number; keterangan?: string }) => {
          const koperasi = await prisma.koperasi.findFirst();
          if (!koperasi) return { success: false, error: "Koperasi belum terdaftar." };

          const coaKas = await prisma.chartOfAccount.findFirst({ where: { kodeAkun: "101.01" } });
          const coaSimpanan = await prisma.chartOfAccount.findFirst({ where: { kodeAkun: "201.01" } }) 
            || await prisma.chartOfAccount.findFirst({ where: { tipe: "LIABILITY" } });

          if (!coaKas || !coaSimpanan) {
            return { success: false, error: "Akun Kas atau Kewajiban standar belum dikonfigurasi." };
          }

          const res = await processTellerSetoran({
            rekeningId,
            nominal,
            metode: "TUNAI",
            keterangan: keterangan || "Setoran tunai via Koperasi-AI Chatbot",
            coaKasId: coaKas.id,
            coaSimpananId: coaSimpanan.id,
            koperasiId: koperasi.id,
          });

          if (res.success) {
            return {
              success: true,
              message: `Setoran tunai sebesar Rp ${nominal.toLocaleString("id-ID")} berhasil dibukukan ke rekening ${rekeningId}. Jurnal otomatis SSOT telah terbentuk.`,
            };
          } else {
            return { success: false, error: res.error };
          }
        },
      } as any),
    };

    // ── EKSEKUSI CERDAS UNTUK DEMO KEY (SIMULASI TRANSAKSI LANGSUNG) ──
    if (isDemoKey) {
      let simulatedAnswer = "";

      // 1. Logika Perintah Transaksi Setoran
      if (lastMsg.includes("setor") || lastMsg.includes("deposit") || lastMsg.includes("tambah saldo")) {
        // Deteksi cerdas Anggota secara mutlak dari isi pesan obrolan
        const semuaAnggota = await prisma.anggota.findMany({
          where: { status: "AKTIF" },
          select: { id: true, namaLengkap: true, nik: true },
        });

        let targetAnggotaId = null;
        for (const a of semuaAnggota) {
          if (lastMsg.includes(a.namaLengkap.toLowerCase()) || lastMsg.includes(a.nik.toLowerCase())) {
            targetAnggotaId = a.id;
            break;
          }
        }
        if (!targetAnggotaId) {
          for (const a of semuaAnggota) {
            const parts = a.namaLengkap.toLowerCase().split(" ").filter((p: string) => p.length > 3);
            if (parts.some((p: string) => lastMsg.includes(p))) {
              targetAnggotaId = a.id;
              break;
            }
          }
        }

        let targetJenis: any = undefined;
        if (lastMsg.includes("wajib")) targetJenis = "WAJIB";
        else if (lastMsg.includes("sukarela")) targetJenis = "SUKARELA";
        else if (lastMsg.includes("pokok")) targetJenis = "POKOK";

        let rek = null;
        if (targetAnggotaId) {
          if (targetJenis) {
            rek = await prisma.rekeningSimpanan.findFirst({
              where: { status: "AKTIF", anggotaId: targetAnggotaId, produk: { jenis: targetJenis } },
              include: { anggota: true, produk: true },
            });
          }
          if (!rek) {
            rek = await prisma.rekeningSimpanan.findFirst({
              where: { status: "AKTIF", anggotaId: targetAnggotaId, produk: { jenis: { in: ["WAJIB", "SUKARELA"] } } },
              include: { anggota: true, produk: true },
            });
          }
          if (!rek) {
            rek = await prisma.rekeningSimpanan.findFirst({
              where: { status: "AKTIF", anggotaId: targetAnggotaId },
              include: { anggota: true, produk: true },
            });
          }
        }

        // Fallback jika tidak menemukan anggota spesifik dari teks
        if (!rek) {
          if (targetJenis) {
            rek = await prisma.rekeningSimpanan.findFirst({
              where: { status: "AKTIF", produk: { jenis: targetJenis } },
              include: { anggota: true, produk: true },
            });
          } else {
            rek = await prisma.rekeningSimpanan.findFirst({
              where: { status: "AKTIF", produk: { jenis: "SUKARELA" } },
              include: { anggota: true, produk: true },
            });
            if (!rek) {
              rek = await prisma.rekeningSimpanan.findFirst({
                where: { status: "AKTIF" },
                include: { anggota: true, produk: true },
              });
            }
          }
        }

        if (rek) {
          // Ekstrak angka dengan membersihkan tanda titik/koma format mata uang terlebih dahulu
          const cleanNumberStr = lastMsg.replace(/\bsebesar\b/g, "").replace(/rp/g, "").replace(/\./g, "").replace(/,/g, "");
          const matches = cleanNumberStr.match(/\d+/g);
          const nominalInput = matches ? Math.max(...matches.map(Number)) : 50000;
          const nominal = nominalInput < 1000 ? nominalInput * 1000 : nominalInput;

          const koperasi = await prisma.koperasi.findFirst();
          const coaKas = await prisma.chartOfAccount.findFirst({ where: { kodeAkun: "101.01" } });
          
          // Resolusi presisi Akun Simpanan di Buku Besar sesuai standar PSAK
          const actualJenis = rek.produk?.jenis || "SUKARELA";
          let targetKodeAkun = "201.01";
          if (actualJenis === "WAJIB") targetKodeAkun = "301.02";
          else if (actualJenis === "POKOK") targetKodeAkun = "301.01";

          const coaSimpanan = await prisma.chartOfAccount.findFirst({ where: { kodeAkun: targetKodeAkun } }) 
            || await prisma.chartOfAccount.findFirst({ where: { kodeAkun: "201.01" } })
            || await prisma.chartOfAccount.findFirst({ where: { tipe: "LIABILITY" } });

          if (koperasi && coaKas && coaSimpanan) {
            const res = await processTellerSetoran({
              rekeningId: rek.id,
              nominal,
              metode: "TUNAI",
              keterangan: `Setoran tunai otomatis via Perintah Chatbot AI (${actualJenis})`,
              coaKasId: coaKas.id,
              coaSimpananId: coaSimpanan.id,
              koperasiId: koperasi.id,
            });

            if (res.success) {
              simulatedAnswer = `⚡ **Instruksi Transaksi Diterima & Dieksekusi** ⚡

Saya telah menjalankan tugas Kasir/Teller untuk mencatat setoran tunai riil pada sistem:
• **Anggota Target**: **${rek.anggota?.namaLengkap}**
• **Rekening ID**: \`${rek.id}\`
• **Produk**: **${rek.produk?.namaProduk}** (\`${actualJenis}\`)
• **Nominal Setoran**: **Rp ${nominal.toLocaleString("id-ID")}**
• **Status Pembukuan**: ✅ Berhasil dibukukan secara mutlak ke PostgreSQL

Jurnal akuntansi **Dr. Kas Tunai Teller (101.01)** dan **Cr. ${coaSimpanan.namaAkun} (${coaSimpanan.kodeAkun})** telah terbentuk seketika pada Buku Besar dan singgahan dasbor telah dimutakhirkan.`;
            } else {
              simulatedAnswer = `❌ **Transaksi Ditolak oleh Mesin Validasi** ❌

Upaya pencatatan setoran ke rekening \`${rek.id}\` (${rek.produk?.namaProduk}) milik **${rek.anggota?.namaLengkap}** tidak dapat dilanjutkan.
• **Alasan Validasi Sistem**: ${res.error}

*Saran Operasional*: Perintah setoran berulang sebaiknya ditujukan pada produk **Simpanan Wajib** atau **Simpanan Sukarela** (karena Simpanan Pokok hanya diizinkan satu kali penyetoran di awal keanggotaan).`;
            }
          } else {
            simulatedAnswer = "Konfigurasi standar Buku Besar (CoA Kas/Simpanan) atau entitas Koperasi belum lengkap di pangkalan data.";
          }
        } else {
          simulatedAnswer = "Mohon maaf, tidak ditemukan target rekening simpanan berstatus AKTIF yang cocok dengan parameter pencarian Anda.";
        }
      }
      // 2. Logika Perintah Pencarian Anggota
      else if (lastMsg.includes("cari") || lastMsg.includes("siapa") || lastMsg.includes("anggota")) {
        const words = lastMsg.split(" ");
        const cariIdx = words.findIndex((w: string) => w.includes("cari") || w.includes("anggota"));
        const term = words.slice(cariIdx + 1).join(" ").replace(/[^a-zA-Z0-9 ]/g, "").trim();
        
        const list = await prisma.anggota.findMany({
          where: term ? { namaLengkap: { contains: term, mode: "insensitive" } } : undefined,
          include: { rekeningSimpanan: { include: { produk: true } } },
          take: 3,
        });

        if (list.length > 0) {
          simulatedAnswer = `Saya telah mengeksekusi pencarian riil pada pangkalan data untuk **"${term || 'Semua Anggota'}"**. Berikut hasilnya:

${list.map((a: any) => `• **${a.namaLengkap}** (NIK: ${a.nik})
  Status: \`${a.status}\`
  Rekening Aktif: ${a.rekeningSimpanan.length > 0 ? a.rekeningSimpanan.map((r: any) => `\`${r.produk?.namaProduk || 'Simpanan'}\` (Saldo: Rp ${Number(r.saldo).toLocaleString('id-ID')})`).join(', ') : 'Belum ada rekening'}`).join('\n\n')}

Ketik perintah seperti **"setor 200000"** untuk menginstruksikan pengisian otomatis ke target rekening teratas.`;
        } else {
          simulatedAnswer = `Pencarian untuk anggota bernama **"${term}"** tidak ditemukan di pangkalan data.`;
        }
      }
      // 3. Fallback Panduan SOP Bawaan
      else if (lastMsg.includes("sop") || lastMsg.includes("tanya")) {
        simulatedAnswer = `Berdasarkan **SOP Koperasi-AI**, pencatatan setoran simpanan tunai harus melalui tahapan pembukuan ganda (Double-Entry) terintegrasi berikut:

1. **Verifikasi Identitas**: Kasir/Teller memverifikasi NIK/CIF serta status keaktifan Anggota.
2. **Penerimaan Fisik Kas**: Teller menerima dan menghitung kesesuaian fisik uang tunai.
3. **Pencatatan Modul**: Input nominal transaksi pada Dasbor Simpanan untuk memicu mutasi sistem.
4. **Jurnal Otomatis**: Sistem menjurnal Dr. Kas Tunai dan Cr. Simpanan Anggota secara seketika.`;
      } else {
        simulatedAnswer = `Halo! Saya **Koperasi-AI**, Asisten Teller Cerdas Anda yang kini telah dilengkapi kemampuan transaksi otonom.

Anda dapat memberikan perintah langsung dalam bahasa alami, contohnya:
• **"cari anggota [nama]"** untuk memeriksa CIF dan saldo rekening.
• **"setor 500000"** untuk mencatat setoran tunai dan membentuk jurnal akuntansi seketika.

Ada instruksi transaksi yang ingin Anda jalankan hari ini?`;
      }

      return new Response(createSimulatedStream(simulatedAnswer), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── EKSEKUSI PEMANGGILAN RIIL KE GOOGLE GEMINI DENGAN TOOLS ──
    const systemPrompt = `Anda adalah Asisten AI Core Koperasi mutakhir bernama "Koperasi-AI" dengan peran ganda sebagai Konsultan SOP dan Eksekutor Kasir/Teller.
Tugas Anda adalah:
1. Menjawab pertanyaan operasional dengan ringkas dan profesional.
2. Mengeksekusi pencarian data anggota atau pencatatan setoran tunai HANYA melalui tools yang disediakan jika diminta oleh pengguna.
Selalu sebutkan ID rekening, nominal, dan konfirmasi pembentukan jurnal SSOT ganda setelah eksekusi.`;

    const result = await streamText({
      model: google("gemini-1.5-pro"),
      system: systemPrompt,
      messages,
      tools: cooperativeTools,
    });

    return result.toTextStreamResponse();

  } catch (e) {
    console.error("[AI_CHAT_ROUTE_ERROR]", e);
    const errorFallbackAnswer = `Mohon maaf, peladen utama Google Gemini sedang mengalami penyesuaian jaringan atau limitasi kuota.

Namun sistem otonom lokal tetap siaga. Anda tetap dapat menggunakan antarmuka dasbor utama untuk memproses seluruh transaksi pembukuan ganda secara presisi.`;
    
    return new Response(createSimulatedStream(errorFallbackAnswer), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
