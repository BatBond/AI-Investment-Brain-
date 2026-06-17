"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalystModuleShell } from "@/components/analyst-module-shell";

export function BwRisk() {
  const [portfolio, setPortfolio] = useState(
    "AAPL 25%, NVDA 20%, MSFT 15%, JPM 10%, JNJ 10%, XOM 10%, TSLA 10%"
  );
  const [totalValue, setTotalValue] = useState("500000");

  const userInput = `Portfolio holdings (ticker + allocation %):
${portfolio}

Total portfolio value: $${totalValue}

Run a Bridgewater-style all-weather risk framework on this portfolio. Use representative sample data. Cover: risk heat map summary, correlation matrix between holdings, sector concentration, geographic & currency exposure, interest rate sensitivity, recession stress test (drawdown per holding), liquidity risk rating (1-5), 3 named tail risk scenarios with probability & portfolio impact, hedging strategies for top 3 risks, and specific rebalancing suggestions.`;

  return (
    <AnalystModuleShell
      sectionId="bw-risk"
      description="All-weather portfolio risk framework: correlations, stress tests, hedges"
      contextNote="Enter your portfolio as 'TICKER %, TICKER %, ...'. Use any of the 30 supported tickers or generic large-caps."
      userInput={userInput}
      onUserInputChange={() => {}}
    >
      <div className="grid grid-cols-1 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Portfolio Holdings (ticker + % allocation)
          </Label>
          <textarea
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Total Portfolio Value (USD)
          </Label>
          <input
            type="text"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono tabular-nums focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
    </AnalystModuleShell>
  );
}
