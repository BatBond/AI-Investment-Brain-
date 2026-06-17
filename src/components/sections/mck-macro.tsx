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

const CONCERNS = [
  "Persistent inflation",
  "Fed hiking cycle",
  "US dollar strength",
  "Geopolitical conflict escalation",
  "AI bubble / tech valuation",
  "Recession risk",
  "Energy supply shock",
];

export function MckMacro() {
  const [portfolio, setPortfolio] = useState(
    "AAPL 20%, NVDA 15%, MSFT 15%, JPM 10%, JNJ 10%, XOM 10%, TSLA 10%, Cash 10%"
  );
  const [concern, setConcern] = useState(CONCERNS[0]);

  const userInput = `Portfolio holdings (ticker + allocation %):
${portfolio}

Biggest economic concern: ${concern}

Run a McKinsey-style macro impact assessment on this portfolio. Use representative sample data. Cover: USD strength impact per holding, rate environment impact on growth vs value, inflation trend winners/losers, GDP growth & earnings implications, employment & consumer spending, Fed policy outlook (6-12 months), global risk factors, specific portfolio adjustments to consider now, sector rotation recommendation based on economic cycle phase, and a macro timeline (1Q/2Q/2H) with key events and portfolio impact. End with an Action Plan Summary at the top.`;

  return (
    <AnalystModuleShell
      sectionId="mck-macro"
      description="Connect macro shifts (rates, USD, inflation, GDP) to concrete portfolio moves"
      contextNote="Enter your portfolio and select your biggest economic concern."
      userInput={userInput}
      onUserInputChange={() => {}}
    >
      <div className="grid grid-cols-1 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Portfolio Holdings
          </Label>
          <textarea
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          />
        </div>
        <div className="space-y-1.5 max-w-md">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Biggest Economic Concern
          </Label>
          <Select value={concern} onValueChange={setConcern}>
            <SelectTrigger className="bg-slate-900/70 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONCERNS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </AnalystModuleShell>
  );
}
