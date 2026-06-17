"use client";

import { useEffect, useState } from "react";
import { AnalystModuleShell } from "@/components/analyst-module-shell";
import { getTickerData, formatCurrency, formatPct, formatNumber } from "@/lib/market-data";

interface TickerModuleProps {
  sectionId:
    | "ms-dcf"
    | "jpm-earnings"
    | "cit-technical"
    | "ren-patterns"
    | "bain-competitive";
  description: string;
  inputLabel: string;
  placeholder: string;
  initialTicker?: string;
  contextNote?: string;
  /** Build the user message from the ticker. */
  buildUserInput: (ticker: string) => string;
  /** Optional: include ticker fundamentals as `context` payload. */
  includeFundamentals?: boolean;
  generateLabel?: string;
}

export function TickerModule({
  sectionId,
  description,
  inputLabel,
  placeholder,
  initialTicker,
  contextNote,
  buildUserInput,
  includeFundamentals,
  generateLabel,
}: TickerModuleProps) {
  const [ticker, setTicker] = useState(initialTicker ?? "AAPL");

  useEffect(() => {
    if (initialTicker) setTicker(initialTicker);
  }, [initialTicker]);

  const userInput = buildUserInput(ticker);

  // Build optional context payload with mock fundamentals
  let extraPayload: string | undefined;
  if (includeFundamentals) {
    const d = getTickerData(ticker);
    if (d) {
      extraPayload = `Representative sample fundamentals for ${d.symbol} (${d.name}, ${d.sector}):
- Price: ${formatCurrency(d.price)} (52w range ${formatCurrency(d.low52)}–${formatCurrency(d.high52)})
- Market cap: ${formatCurrency(d.marketCap, { compact: true })}
- P/E (TTM): ${d.peRatio || "n/a"} · Fwd P/E: ${d.forwardPe}x · P/B: ${d.pbRatio}x
- EPS: $${d.eps.toFixed(2)} · Beta: ${d.beta.toFixed(2)} · Div yield: ${formatPct(d.dividendYield)}
- Revenue (TTM): ${formatCurrency(d.revenue, { compact: true })} (YoY ${formatPct(d.revenueGrowthYoY, 1)})
- Net margin: ${formatPct(d.netMargin, 1)} · D/E: ${d.debtToEquity.toFixed(2)} · FCF: ${formatCurrency(d.fcf, { compact: true })}
- Avg volume: ${formatNumber(d.avgVolume, { compact: true })} shares`;
    }
  }

  return (
    <AnalystModuleShell
      sectionId={sectionId}
      description={description}
      inputLabel={inputLabel}
      userInput={ticker}
      onUserInputChange={(v) => setTicker(v.toUpperCase())}
      inputPlaceholder={placeholder}
      contextNote={contextNote}
      extraPayload={extraPayload}
      generateLabel={generateLabel}
    />
  );
}
