import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveFundamentals } from "@/lib/market-data-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const positions = await db.portfolioPosition.findMany({
      orderBy: { costBasisTotal: "desc" },
    });
    return NextResponse.json({ positions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = String(body.symbol || "").toUpperCase().trim();
    const quantity = Number(body.quantity);
    const avgCostBasis = Number(body.avgCostBasis);
    const type = String(body.type || "Cash").trim();
    const description = String(body.description || "").trim();

    if (!symbol || !quantity || !avgCostBasis || quantity <= 0 || avgCostBasis <= 0) {
      return NextResponse.json(
        { error: "symbol, quantity (>0), and avgCostBasis (>0) are required" },
        { status: 400 }
      );
    }

    // Try to fetch the description from Yahoo if not supplied
    let finalDescription = description;
    if (!finalDescription) {
      try {
        const f = await getLiveFundamentals(symbol);
        if (f?.name) finalDescription = f.name;
      } catch {
        // ignore
      }
    }
    if (!finalDescription) finalDescription = symbol;

    const costBasisTotal = quantity * avgCostBasis;
    const position = await db.portfolioPosition.upsert({
      where: { symbol },
      create: {
        symbol,
        description: finalDescription,
        quantity,
        avgCostBasis,
        costBasisTotal,
        type,
        source: "manual",
      },
      update: {
        description: finalDescription,
        quantity,
        avgCostBasis,
        costBasisTotal,
        type,
      },
    });
    return NextResponse.json({ position }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
