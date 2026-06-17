import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  try {
    const positions = await db.portfolioPosition.findMany({
      orderBy: { costBasisTotal: "desc" },
    });
    const header = [
      "Symbol",
      "Description",
      "Quantity",
      "Avg Cost Basis",
      "Cost Basis Total",
      "Type",
      "Source",
    ];
    const lines = [header.join(",")];
    for (const p of positions) {
      lines.push(
        [
          csvEscape(p.symbol),
          csvEscape(p.description),
          csvEscape(p.quantity),
          csvEscape(p.avgCostBasis.toFixed(4)),
          csvEscape(p.costBasisTotal.toFixed(2)),
          csvEscape(p.type),
          csvEscape(p.source),
        ].join(",")
      );
    }
    const csv = lines.join("\n");
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
