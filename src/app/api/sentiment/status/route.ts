import { NextRequest, NextResponse } from "next/server";
import { getScanState } from "@/lib/sentiment-sources";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("ticker") || "MARKET").toUpperCase().trim();
    const state = getScanState(ticker);
    const count = await db.sentimentArticle.count({
      where: { ticker },
    });
    return NextResponse.json({
      ticker,
      status: state.status,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt,
      articleCount: state.articleCount,
      dbCount: count,
      error: state.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
