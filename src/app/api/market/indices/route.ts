import { NextResponse } from "next/server";
import { getQuotesBatch, type LiveQuote } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const maxDuration = 30;

// Yahoo Finance symbols for the major indices + rates shown in the ticker tape.
const INDEX_SYMBOLS: { symbol: string; label: string; kind: "index" | "rate" }[] = [
  { symbol: "^GSPC", label: "S&P 500", kind: "index" },
  { symbol: "^IXIC", label: "Nasdaq", kind: "index" },
  { symbol: "^DJI", label: "Dow Jones", kind: "index" },
  { symbol: "^RUT", label: "Russell 2K", kind: "index" },
  { symbol: "^VIX", label: "VIX", kind: "index" },
  { symbol: "^TNX", label: "10Y Yield", kind: "rate" },
];

// Static fallback if Yahoo is unavailable.
const FALLBACK: (LiveQuote & { label: string })[] = [
  { symbol: "^GSPC", label: "S&P 500", name: "S&P 500", price: 5815.03, changePct: 0.42, changeAbs: 24.21, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "SNP", quoteType: "INDEX", isLive: false },
  { symbol: "^IXIC", label: "Nasdaq", name: "Nasdaq Composite", price: 18342.94, changePct: 0.81, changeAbs: 147.13, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "Nasdaq", quoteType: "INDEX", isLive: false },
  { symbol: "^DJI", label: "Dow Jones", name: "Dow Jones Industrial", price: 42863.86, changePct: -0.19, changeAbs: -81.36, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "DJI", quoteType: "INDEX", isLive: false },
  { symbol: "^RUT", label: "Russell 2K", name: "Russell 2000", price: 2218.71, changePct: -0.63, changeAbs: -14.07, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "RUT", quoteType: "INDEX", isLive: false },
  { symbol: "^VIX", label: "VIX", name: "CBOE Volatility Index", price: 14.82, changePct: -2.34, changeAbs: -0.36, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "CBOE", quoteType: "INDEX", isLive: false },
  { symbol: "^TNX", label: "10Y Yield", name: "10Y Treasury Yield", price: 4.073, changePct: 1.15, changeAbs: 0.046, volume: 0, marketCap: 0, currency: "USD", exchange: "INDEX", exchangeName: "Treas", quoteType: "INDEX", isLive: false },
];

export async function GET() {
  try {
    const quotes = await getQuotesBatch(INDEX_SYMBOLS.map((i) => i.symbol));
    const lookup = new Map(quotes.map((q) => [q.symbol, q]));
    const items = INDEX_SYMBOLS.map((meta) => {
      const q = lookup.get(meta.symbol);
      if (!q) {
        const fb = FALLBACK.find((f) => f.symbol === meta.symbol)!;
        return fb;
      }
      return { ...q, label: meta.label, name: meta.label };
    });
    return NextResponse.json({ items, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ items: FALLBACK, error: message, fetchedAt: new Date().toISOString() });
  }
}
