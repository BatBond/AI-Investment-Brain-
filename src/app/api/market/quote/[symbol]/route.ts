import { NextRequest, NextResponse } from "next/server";
import { getLiveQuote } from "@/lib/market-data-live";

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
    const quote = await getLiveQuote(symbol);
    if (!quote) {
      return NextResponse.json(
        { error: `No data available for ${symbol}` },
        { status: 404 }
      );
    }
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
