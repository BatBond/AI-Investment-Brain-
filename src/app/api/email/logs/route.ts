import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/email/logs?limit=50
export async function GET(req: NextRequest) {
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200) : 50;
  const logs = await db.emailLog.findMany({
    orderBy: { sentAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ logs });
}
