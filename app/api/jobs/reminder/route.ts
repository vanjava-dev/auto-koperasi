import { NextResponse } from "next/server";
import { runReminderJob } from "@/jobs/reminder";

/**
 * Route Handler pengaman pemanggilan Cron dari eksternal.
 * Endpoint: GET /api/jobs/reminder
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Token otorisasi tidak valid." },
      { status: 401 }
    );
  }

  const result = await runReminderJob();

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
