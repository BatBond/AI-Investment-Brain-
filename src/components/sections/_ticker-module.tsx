"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalystModuleShell } from "@/components/analyst-module-shell";
import {
  getTickerData,
  formatCurrency,
  formatPct,
  formatNumber,
} from "@/lib/market-data";
import type { LiveFundamentals } from "@/lib/market-data-live";

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

  // Fetch live fundamentals when includeFundamentals is on
  const fundQ = useQuery({
    queryKey: ["fundamentals", ticker],
    queryFn: async () => {
      const r = await fetch(`/api/market/fundamentals/${encodeURIComponent(ticker)}`);
      if (!r.ok) return null;
      return (await r.json()) as LiveFundamentals;
    },
    enabled: !!includeFundamentals && !!ticker,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Build optional context payload — live data if available, mock fallback otherwise
  let extraPayload: string | undefined;
  if (includeFundamentals) {
    const live = fundQ.data;
    if (live && live.isLive) {
      const lines: string[] = [];
      lines.push(`Live market fundamentals for ${live.symbol} (${live.name}):`);
      if (live.sector) lines.push(`- Sector: ${live.sector}${live.industry ? ` / ${live.industry}` : ""}`);
      if (live.marketCap) lines.push(`- Market cap: ${formatCurrency(live.marketCap, { compact: true })}`);
      if (live.peRatio) lines.push(`- P/E (TTM): ${live.peRatio.toFixed(2)}x`);
      if (live.forwardPe) lines.push(`- Forward P/E: ${live.forwardPe.toFixed(2)}x`);
      if (live.pbRatio) lines.push(`- P/B: ${live.pbRatio.toFixed(2)}x`);
      if (live.eps !== undefined) lines.push(`- EPS: $${live.eps.toFixed(2)}`);
      if (live.beta !== undefined) lines.push(`- Beta: ${live.beta.toFixed(2)}`);
      if (live.dividendYield !== undefined) lines.push(`- Dividend yield: ${formatPct(live.dividendYield)}`);
      if (live.fiftyTwoWeekHigh !== undefined && live.fiftyTwoWeekLow !== undefined)
        lines.push(`- 52w range: ${formatCurrency(live.fiftyTwoWeekLow)} – ${formatCurrency(live.fiftyTwoWeekHigh)}`);
      if (live.revenue !== undefined) lines.push(`- Revenue (TTM): ${formatCurrency(live.revenue, { compact: true })}`);
      if (live.revenueGrowthYoY !== undefined) lines.push(`- Revenue growth YoY: ${formatPct(live.revenueGrowthYoY, 1)}`);
      if (live.netMargin !== undefined) lines.push(`- Net margin: ${formatPct(live.netMargin, 1)}`);
      if (live.debtToEquity !== undefined) lines.push(`- Debt/Equity: ${live.debtToEquity.toFixed(2)}`);
      if (live.returnOnEquity !== undefined) lines.push(`- ROE: ${formatPct(live.returnOnEquity, 1)}`);
      if (live.freeCashFlow !== undefined) lines.push(`- Free cash flow: ${formatCurrency(live.freeCashFlow, { compact: true })}`);
      if (live.fullTimeEmployees !== undefined) lines.push(`- Employees: ${formatNumber(live.fullTimeEmployees, { compact: true })}`);
      lines.push("(Source: Yahoo Finance — LIVE data)");
      extraPayload = lines.join("\n");
    } else {
      // Mock fallback
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
