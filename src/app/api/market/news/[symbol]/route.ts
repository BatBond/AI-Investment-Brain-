import { NextRequest, NextResponse } from "next/server";
import { getTickerNews } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  try {
    const news = await getTickerNews(symbol);
    return NextResponse.json({ symbol: symbol.toUpperCase(), news });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, news: [] }, { status: 200 });
  }
}
