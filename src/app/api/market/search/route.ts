import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSymbols(query);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
