import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("ticker") || "MARKET").toUpperCase().trim();
    const sourceParam = url.searchParams.get("source") || "all";
    const sentimentParam = url.searchParams.get("sentiment") || "all";
    const hours = parseInt(url.searchParams.get("hours") || "24", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const since = new Date(Date.now() - hours * 3600 * 1000);

    const where: Record<string, unknown> = {
      fetchedAt: { gte: since },
    };
    if (ticker !== "ALL" && ticker !== "MARKET") {
      where.ticker = ticker;
    }
    if (sourceParam !== "all") {
      where.source = sourceParam;
    }
    if (sentimentParam !== "all") {
      where.sentiment = sentimentParam;
    }

    const articles = await db.sentimentArticle.findMany({
      where,
      orderBy: { fetchedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.sentimentArticle.count({ where });

    return NextResponse.json({
      articles: articles.map((a) => ({
        id: a.id,
        ticker: a.ticker,
        source: a.source,
        title: a.title,
        url: a.url,
        summary: a.summary,
        sentiment: a.sentiment,
        sentimentScore: a.sentimentScore,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        fetchedAt: a.fetchedAt.toISOString(),
      })),
      total,
      offset,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
