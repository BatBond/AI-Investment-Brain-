import { NextRequest, NextResponse } from "next/server";
import { getLiveHistorical } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  const daysRaw = req.nextUrl.searchParams.get("days");
  const days = daysRaw ? Math.min(Math.max(parseInt(daysRaw, 10) || 180, 30), 730) : 180;
  try {
    const bars = await getLiveHistorical(symbol, days);
    return NextResponse.json({ symbol: symbol.toUpperCase(), days, bars });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
