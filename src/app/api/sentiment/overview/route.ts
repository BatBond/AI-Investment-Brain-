import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const articles = await db.sentimentArticle.findMany({
      where: { fetchedAt: { gte: since } },
      select: { sentiment: true, sentimentScore: true, ticker: true, source: true },
    });

    const total = articles.length;
    let bullish = 0, bearish = 0, neutral = 0;
    let sumScore = 0;
    const tickerScores = new Map<string, { sum: number; count: number }>();

    for (const a of articles) {
      sumScore += a.sentimentScore;
      if (a.sentiment === "bullish") bullish += 1;
      else if (a.sentiment === "bearish") bearish += 1;
      else neutral += 1;

      if (a.ticker !== "MARKET") {
        const cur = tickerScores.get(a.ticker) || { sum: 0, count: 0 };
        cur.sum += a.sentimentScore;
        cur.count += 1;
        tickerScores.set(a.ticker, cur);
      }
    }

    const avgScore = total > 0 ? sumScore / total : 0;
    const sentimentLabel =
      avgScore > 0.1 ? "Bullish" : avgScore < -0.1 ? "Bearish" : "Neutral";

    const tickerAgg = Array.from(tickerScores.entries())
      .map(([ticker, v]) => ({
        ticker,
        avgScore: v.count > 0 ? v.sum / v.count : 0,
        count: v.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const topBullish = tickerAgg[0] || null;
    const topBearish = tickerAgg[tickerAgg.length - 1] || null;

    return NextResponse.json({
      marketSentiment: sentimentLabel,
      marketScore: avgScore,
      bullish,
      bearish,
      neutral,
      total,
      topBullish,
      topBearish,
      asOf: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
