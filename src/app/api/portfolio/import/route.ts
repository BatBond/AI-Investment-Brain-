import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveFundamentals } from "@/lib/market-data-live";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ParsedRow {
  symbol: string;
  description?: string;
  quantity: number;
  avgCostBasis: number;
  type?: string;
}

function findColumn(
  row: Record<string, unknown>,
  candidates: string[]
): unknown | undefined {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const lc = cand.toLowerCase();
    const found = keys.find((k) => k.toLowerCase().trim() === lc);
    if (found) return row[found];
  }
  // fuzzy contains
  for (const cand of candidates) {
    const lc = cand.toLowerCase();
    const found = keys.find((k) => k.toLowerCase().includes(lc));
    if (found) return row[found];
  }
  return undefined;
}

function parseRowsFromSheet(
  sheet: XLSX.WorkSheet
): ParsedRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  const out: ParsedRow[] = [];
  for (const row of rows) {
    const symbolRaw = findColumn(row, ["Symbol", "Ticker", "symbol", "ticker"]);
    const qtyRaw = findColumn(row, ["Quantity", "Qty", "Shares", "quantity", "qty", "shares"]);
    const costRaw = findColumn(row, [
      "Avg Cost Basis",
      "AvgCostBasis",
      "Average Cost",
      "Cost Basis",
      "avgCostBasis",
      "averageCost",
      "costBasis",
      "avg_cost",
      "cost",
    ]);
    const descRaw = findColumn(row, ["Description", "Name", "Company", "description", "name"]);
    const typeRaw = findColumn(row, ["Type", "Asset Type", "type", "assetType"]);

    if (!symbolRaw) continue;
    const symbol = String(symbolRaw).toUpperCase().trim();
    const quantity = parseFloat(String(qtyRaw ?? "").replace(/[,$]/g, ""));
    const avgCostBasis = parseFloat(String(costRaw ?? "").replace(/[,$]/g, ""));
    if (!symbol || isNaN(quantity) || isNaN(avgCostBasis) || quantity <= 0) continue;

    out.push({
      symbol,
      description: descRaw ? String(descRaw).trim() : undefined,
      quantity,
      avgCostBasis,
      type: typeRaw ? String(typeRaw).trim() : "Cash",
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Use field name 'file'." },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Workbook has no sheets." }, { status: 400 });
    }
    const sheet = wb.Sheets[sheetName];
    const parsed = parseRowsFromSheet(sheet);
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Expected columns: Symbol, Quantity, Avg Cost Basis." },
        { status: 400 }
      );
    }

    // Fetch descriptions from Yahoo for any missing
    let enriched = 0;
    for (const r of parsed) {
      if (!r.description) {
        try {
          const f = await getLiveFundamentals(r.symbol);
          if (f?.name) {
            r.description = f.name;
            enriched += 1;
          }
        } catch {
          // ignore
        }
      }
      if (!r.description) r.description = r.symbol;
    }

    // Bulk upsert
    let upserted = 0;
    for (const r of parsed) {
      const costBasisTotal = r.quantity * r.avgCostBasis;
      await db.portfolioPosition.upsert({
        where: { symbol: r.symbol },
        create: {
          symbol: r.symbol,
          description: r.description || r.symbol,
          quantity: r.quantity,
          avgCostBasis: r.avgCostBasis,
          costBasisTotal,
          type: r.type || "Cash",
          source: "imported",
        },
        update: {
          description: r.description || r.symbol,
          quantity: r.quantity,
          avgCostBasis: r.avgCostBasis,
          costBasisTotal,
          type: r.type || "Cash",
          source: "imported",
        },
      });
      upserted += 1;
    }

    return NextResponse.json({
      ok: true,
      upserted,
      enrichedDescriptions: enriched,
      totalParsed: parsed.length,
      symbols: parsed.map((p) => p.symbol),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
