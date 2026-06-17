import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "7", 10), 30);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const articles = await db.sentimentArticle.findMany({
      where: { fetchedAt: { gte: since } },
      select: { sentimentScore: true, fetchedAt: true },
      orderBy: { fetchedAt: "asc" },
    });

    // Bucket by hour
    const buckets = new Map<string, { sum: number; count: number }>();
    const bucketMs = 3600 * 1000; // 1 hour
    const startBucket = Math.floor(since.getTime() / bucketMs) * bucketMs;

    for (let t = startBucket; t <= Date.now(); t += bucketMs) {
      const key = new Date(t).toISOString();
      buckets.set(key, { sum: 0, count: 0 });
    }
    for (const a of articles) {
      const bucketTime = Math.floor(a.fetchedAt.getTime() / bucketMs) * bucketMs;
      const key = new Date(bucketTime).toISOString();
      const cur = buckets.get(key) || { sum: 0, count: 0 };
      cur.sum += a.sentimentScore;
      cur.count += 1;
      buckets.set(key, cur);
    }

    const series = Array.from(buckets.entries())
      .map(([iso, v]) => ({
        ts: iso,
        score: v.count > 0 ? v.sum / v.count : 0,
        count: v.count,
      }))
      .sort((a, b) => (a.ts < b.ts ? -1 : 1));

    return NextResponse.json({ series, days });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
