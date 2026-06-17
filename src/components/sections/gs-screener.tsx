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
import { SECTORS } from "@/lib/market-data";
import { AnalystModuleShell } from "@/components/analyst-module-shell";

export function GsScreener() {
  const [risk, setRisk] = useState("Moderate");
  const [amount, setAmount] = useState("100000");
  const [horizon, setHorizon] = useState("3-5 years");
  const [sectors, setSectors] = useState("Technology, Healthcare, Financial Services");

  const userInput = `Risk tolerance: ${risk}
Investment amount: $${amount}
Time horizon: ${horizon}
Preferred sectors: ${sectors}

Screen the US large-cap universe and return the top 10 stocks that best match these criteria. Use realistic representative names (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, JNJ, WMT, PG, KO, DIS, NFLX, INTC, AMD, CRM, BAC, XOM, CVX, PFE, MRK, ABBV, COST, HD, NKE, PYPL, UBER, SQ) where the sector matches, or invent plausible large-caps otherwise.`;

  return (
    <AnalystModuleShell
      sectionId="gs-screener"
      description="Institutional quant-meets-fundamental stock screener"
      inputLabel="Screening Criteria"
      userInput={userInput}
      onUserInputChange={() => {
        /* controlled by individual inputs below */
      }}
      contextNote="Adjust the criteria below. The combined screening request is sent to the Goldman analyst persona."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Risk Tolerance</Label>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="bg-slate-900/70 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Conservative">Conservative</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Aggressive">Aggressive</SelectItem>
              <SelectItem value="Speculative">Speculative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Investment Amount (USD)</Label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono tabular-nums focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Time Horizon</Label>
          <Select value={horizon} onValueChange={setHorizon}>
            <SelectTrigger className="bg-slate-900/70 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3-12 months">3-12 months</SelectItem>
              <SelectItem value="1-3 years">1-3 years</SelectItem>
              <SelectItem value="3-5 years">3-5 years</SelectItem>
              <SelectItem value="5-10 years">5-10 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Preferred Sectors</Label>
          <input
            type="text"
            value={sectors}
            onChange={(e) => setSectors(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            list="sectors-list"
          />
          <datalist id="sectors-list">
            {SECTORS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
    </AnalystModuleShell>
  );
}
