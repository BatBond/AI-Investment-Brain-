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

export function HvDividend() {
  const [amount, setAmount] = useState("500000");
  const [goal, setGoal] = useState("2000");
  const [account, setAccount] = useState("Taxable");
  const [bracket, setBracket] = useState("32%");

  const userInput = `Dividend portfolio construction:
- Total investment amount: $${amount}
- Monthly income goal: $${goal}
- Account type: ${account}
- Tax bracket: ${bracket}

Build a Harvard-endowment-style dividend strategy. Use representative sample data and realistic US large-cap dividend payers (JNJ, PG, KO, JPM, V, XOM, CVX, MRK, ABBV, PFE, WMT, HD, COST, PEAK, etc.). Cover: 15-20 dividend stock picks with current yield, dividend safety score (1-10), consecutive years of dividend growth, payout ratio analysis with sustainability flags, monthly income projection vs goal, sector diversification, 5-year dividend growth rate estimate, 10-year DRIP reinvestment projection table, tax implications for a ${account} account at the ${bracket} bracket, and a final ranking from safest to most aggressive.`;

  return (
    <AnalystModuleShell
      sectionId="hv-dividend"
      description="Endowment-style dividend portfolio with safety scoring and DRIP projections"
      contextNote="Enter your investment amount, income goal, account type, and tax bracket."
      userInput={userInput}
      onUserInputChange={() => {}}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Field label="Total Investment (USD)">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className={inputCls}
          />
        </Field>
        <Field label="Monthly Income Goal (USD)">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value.replace(/[^0-9]/g, ""))}
            className={inputCls}
          />
        </Field>
        <Field label="Account Type">
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className={selectCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Taxable">Taxable (Brokerage)</SelectItem>
              <SelectItem value="IRA">Traditional IRA</SelectItem>
              <SelectItem value="Roth IRA">Roth IRA</SelectItem>
              <SelectItem value="401k">401(k)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tax Bracket">
          <Select value={bracket} onValueChange={setBracket}>
            <SelectTrigger className={selectCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12%">12%</SelectItem>
              <SelectItem value="22%">22%</SelectItem>
              <SelectItem value="24%">24%</SelectItem>
              <SelectItem value="32%">32%</SelectItem>
              <SelectItem value="37%">37%</SelectItem>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-slate-400">{label}</Label>
      {children}
    </div>
  );
}
