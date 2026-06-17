/**
 * Vercel Cron: Run sentiment radar scan
 *
 * Vercel Cron invokes this endpoint every 30 minutes (see vercel.json).
 * Replaces the in-process node-cron scheduler.
 *
 * Scans "MARKET" for general market sentiment + rotates through portfolio
 * holdings so each ticker gets scanned periodically.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scanSentiment } from "@/lib/sentiment-sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { ticker: string; articles: number; error?: string }[] = [];

  // 1. Always scan general market sentiment
  try {
    const articles = await scanSentiment("MARKET");
    results.push({ ticker: "MARKET", articles: articles.length });
  } catch (e: any) {
    results.push({ ticker: "MARKET", articles: 0, error: e.message });
  }

  // 2. Rotate through portfolio holdings — pick 1 random ticker each invocation
  //    (so each gets scanned every ~24 ticks = ~12 hours)
  try {
    const positions = await db.portfolioPosition.findMany();
    if (positions.length > 0) {
      const idx = Math.floor(Math.random() * positions.length);
      const ticker = positions[idx].symbol;
      const articles = await scanSentiment(ticker);
      results.push({ ticker, articles: articles.length });
    }
  } catch (e: any) {
    // Skip on error
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    scans: results,
  });
}
