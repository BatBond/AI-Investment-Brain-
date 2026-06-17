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

export function BrPortfolio() {
  const [age, setAge] = useState("35");
  const [income, setIncome] = useState("180000");
  const [savings, setSavings] = useState("250000");
  const [goal, setGoal] = useState("Retire at 60 with $3M");
  const [risk, setRisk] = useState("Growth");
  const [account, setAccount] = useState("401k");

  const userInput = `Client profile:
- Age: ${age}
- Annual income: $${income}
- Current investable savings: $${savings}
- Goals: ${goal}
- Risk tolerance: ${risk}
- Account type: ${account}

Build a BlackRock-style goals-based portfolio construction model. Use representative sample data and BlackRock Capital Market Assumptions. Cover: asset allocation donut (US/Intl equity, fixed income, alternatives, cash), specific ETF/fund recommendations with tickers, core vs satellite split, expected annual return range, expected max drawdown in a bad year, rebalancing schedule & trigger rules, tax efficiency strategy specific to a ${account} account, DCA plan if investing $5,000/month, benchmark, and a one-page Investment Policy Statement in a callout box.`;

  return (
    <AnalystModuleShell
      sectionId="br-portfolio"
      description="Goals-based portfolio construction with ETF recommendations and IPS"
      contextNote="Fill in the client profile. The BlackRock strategist will produce a full portfolio construction model."
      userInput={userInput}
      onUserInputChange={() => {}}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        <Field label="Age">
          <input
            type="text"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
            className={inputCls}
          />
        </Field>
        <Field label="Annual Income (USD)">
          <input
            type="text"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))}
            className={inputCls}
          />
        </Field>
        <Field label="Investable Savings (USD)">
          <input
            type="text"
            value={savings}
            onChange={(e) => setSavings(e.target.value.replace(/[^0-9]/g, ""))}
            className={inputCls}
          />
        </Field>
        <Field label="Goals" full>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Risk Tolerance">
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className={selectCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Capital Preservation">Capital Preservation</SelectItem>
              <SelectItem value="Income">Income</SelectItem>
              <SelectItem value="Balanced">Balanced</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Aggressive Growth">Aggressive Growth</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Account Type">
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className={selectCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="401k">401(k)</SelectItem>
              <SelectItem value="IRA">IRA</SelectItem>
              <SelectItem value="Roth IRA">Roth IRA</SelectItem>
              <SelectItem value="Taxable">Taxable (Brokerage)</SelectItem>
              <SelectItem value="Trust">Trust</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </AnalystModuleShell>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono tabular-nums focus:border-amber-500 focus:outline-none";
const selectCls = "bg-slate-900/70 border-slate-700 text-slate-100";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <Label className="text-[11px] uppercase tracking-wider text-slate-400">{label}</Label>
      {children}
    </div>
  );
}
