import { NextResponse } from "next/server";
import { runCollectibilityJob } from "@/jobs/collectibility";

/**
 * Route Handler pengaman pemanggilan Cron dari eksternal (Vercel Cron).
 * Endpoint: GET /api/jobs/collectibility
 */
export async function GET(request: Request) {
  // 1. Ambil Header Otorisasi
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 2. Tolak akses jika token tidak cocok
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Token otorisasi tidak valid." },
      { status: 401 }
    );
  }

  // 3. Jalankan tugas jika otorisasi lolos
  const result = await runCollectibilityJob();

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
