import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const articles = await db.sentimentArticle.findMany({
      where: { fetchedAt: { gte: since } },
      select: { ticker: true, sentimentScore: true },
    });

    const map = new Map<string, { sum: number; count: number; bull: number; bear: number }>();
    for (const a of articles) {
      if (a.ticker === "MARKET") continue;
      const cur = map.get(a.ticker) || { sum: 0, count: 0, bull: 0, bear: 0 };
      cur.sum += a.sentimentScore;
      cur.count += 1;
      if (a.sentimentScore > 0.2) cur.bull += 1;
      else if (a.sentimentScore < -0.2) cur.bear += 1;
      map.set(a.ticker, cur);
    }
    const out = Array.from(map.entries())
      .map(([ticker, v]) => ({
        ticker,
        avgScore: v.count > 0 ? v.sum / v.count : 0,
        mentions: v.count,
        bullish: v.bull,
        bearish: v.bear,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    return NextResponse.json({ tickers: out });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
