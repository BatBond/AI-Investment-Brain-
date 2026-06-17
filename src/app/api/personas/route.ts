import { NextRequest, NextResponse } from "next/server";
import { runPersonas } from "@/lib/zai";
import { PERSONA_PROMPTS } from "@/lib/analyst-prompts";
import {
  getTickerData,
  getTechnicalIndicators,
} from "@/lib/market-data";
import {
  getLiveFundamentals,
  formatFundamentalsForLLM,
} from "@/lib/market-data-live";

export const runtime = "nodejs";
export const maxDuration = 60;

interface PersonasRequestBody {
  ticker: string;
}

export async function POST(req: NextRequest) {
  let body: PersonasRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ticker = (body.ticker ?? "").toUpperCase().trim();
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required." }, { status: 400 });
  }

  // Try live fundamentals first; fall back to mock
  const live = await getLiveFundamentals(ticker);
  const mock = getTickerData(ticker);
  const tech = mock ? getTechnicalIndicators(ticker) : null;

  let payload: string;
  if (live) {
    const lines: string[] = [
      formatFundamentalsForLLM(live),
      "",
      "Technical indicators (computed from representative historical data):",
    ];
    if (tech) {
      lines.push(
        JSON.stringify(
          {
            sma50: tech.sma50,
            sma200: tech.sma200,
            rsi14: tech.rsi14,
            macd: tech.macd,
            trend: tech.trend,
            support: tech.support,
            resistance: tech.resistance,
          },
          null,
          2
        )
      );
    } else {
      lines.push("No technical data available — use representative values consistent with this profile.");
    }
    payload = `Analyze the stock **${ticker}** using these fundamentals:\n\n${lines.join("\n")}\n\nReturn your verdict JSON now.`;
  } else if (mock) {
    payload = `Analyze the stock **${ticker}** (${mock.name}, ${mock.sector}) using these representative fundamentals:

${JSON.stringify(
  {
    symbol: mock.symbol,
    name: mock.name,
    sector: mock.sector,
    industry: mock.industry,
    price: mock.price,
    marketCap: mock.marketCap,
    peRatio: mock.peRatio,
    forwardPe: mock.forwardPe,
    pbRatio: mock.pbRatio,
    eps: mock.eps,
    beta: mock.beta,
    dividendYield: mock.dividendYield,
    payoutRatio: mock.payoutRatio,
    high52: mock.high52,
    low52: mock.low52,
    revenue: mock.revenue,
    revenueGrowthYoY: mock.revenueGrowthYoY,
    netMargin: mock.netMargin,
    debtToEquity: mock.debtToEquity,
    fcf: mock.fcf,
    esgScore: mock.esgScore,
    piotroskiF: mock.piotroskiF,
    technicals: tech
      ? {
          sma50: tech.sma50,
          sma200: tech.sma200,
          rsi14: tech.rsi14,
          macd: tech.macd,
          trend: tech.trend,
          support: tech.support,
          resistance: tech.resistance,
        }
      : undefined,
  },
  null,
  2
)}

Return your verdict JSON now.`;
  } else {
    payload = `Analyze the stock **${ticker}**. No detailed mock data is available — use your best judgment and representative sample data consistent with a company of this profile. Return your verdict JSON now.`;
  }

  try {
    const personas = await runPersonas(PERSONA_PROMPTS, payload);
    return NextResponse.json({ ticker, personas, liveData: !!live });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Persona generation failed: ${message}` },
      { status: 500 }
    );
  }
}
