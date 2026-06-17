import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeWatchlistStream } from "@/lib/portfolio";
import { getLiveFundamentals } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await computeWatchlistStream();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = String(body.symbol || "").toUpperCase().trim();
    const name = body.name ? String(body.name).trim() : undefined;
    const notes = body.notes ? String(body.notes).trim() : undefined;
    if (!symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }
    let finalName = name;
    if (!finalName) {
      try {
        const f = await getLiveFundamentals(symbol);
        if (f?.name) finalName = f.name;
      } catch {
        // ignore
      }
    }
    const item = await db.watchlistItem.upsert({
      where: { symbol },
      create: { symbol, name: finalName, notes },
      update: { name: finalName ?? undefined, notes: notes ?? undefined },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
