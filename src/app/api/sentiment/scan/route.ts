import { NextRequest, NextResponse } from "next/server";
import { runScanInBackground, getScanState, scanSentiment } from "@/lib/sentiment-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/sentiment/scan?ticker=MARKET
 * Triggers a background scan and returns immediately with the scan state.
 * Client polls /api/sentiment/status?ticker=MARKET for progress.
 *
 * Optional query: ?wait=1 to wait synchronously for the scan to finish
 * (useful for the "Start First Scan" button on first visit).
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("ticker") || "MARKET").toUpperCase().trim();
    const wait = url.searchParams.get("wait") === "1";

    if (wait) {
      const articles = await scanSentiment(ticker);
      return NextResponse.json({
        ok: true,
        ticker,
        count: articles.length,
        articles: articles.map((a) => ({
          title: a.title,
          url: a.url,
          source: a.source,
          publisher: a.publisher,
          sentiment: a.sentiment,
          sentimentScore: a.sentimentScore,
          summary: a.summary,
          publishedAt: a.publishedAt.toISOString(),
        })),
      });
    }

    const state = runScanInBackground(ticker);
    return NextResponse.json({
      ok: true,
      ticker,
      status: state.status,
      startedAt: state.startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
