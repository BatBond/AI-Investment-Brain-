import { NextRequest, NextResponse } from "next/server";
import { runPersonas } from "@/lib/zai";
import { PERSONA_PROMPTS } from "@/lib/analyst-prompts";
import { getTickerData, getTechnicalIndicators } from "@/lib/market-data";

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

  const data = getTickerData(ticker);
  // We pass either real mock data or a generic stub so the LLM still works
  // for tickers outside our 30-stock universe.
  const tech = data ? getTechnicalIndicators(ticker) : null;

  const payload = `Analyze the stock **${ticker}**${
    data ? ` (${data.name}, ${data.sector})` : ""
  } using these representative fundamentals:

${
  data
    ? JSON.stringify(
        {
          symbol: data.symbol,
          name: data.name,
          sector: data.sector,
          industry: data.industry,
          price: data.price,
          marketCap: data.marketCap,
          peRatio: data.peRatio,
          forwardPe: data.forwardPe,
          pbRatio: data.pbRatio,
          eps: data.eps,
          beta: data.beta,
          dividendYield: data.dividendYield,
          payoutRatio: data.payoutRatio,
          high52: data.high52,
          low52: data.low52,
          revenue: data.revenue,
          revenueGrowthYoY: data.revenueGrowthYoY,
          netMargin: data.netMargin,
          debtToEquity: data.debtToEquity,
          fcf: data.fcf,
          esgScore: data.esgScore,
          piotroskiF: data.piotroskiF,
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
      )
    : `No detailed mock data is available for ${ticker}. Use your best judgment and representative sample data consistent with a company of this profile.`
}

Return your verdict JSON now.`;

  try {
    const personas = await runPersonas(PERSONA_PROMPTS, payload);
    return NextResponse.json({ ticker, personas });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Persona generation failed: ${message}` },
      { status: 500 }
    );
  }
}
