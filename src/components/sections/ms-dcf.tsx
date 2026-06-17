"use client";

import { TickerModule } from "./_ticker-module";

export function MsDcf({ initialTicker }: { initialTicker?: string }) {
  return (
    <TickerModule
      sectionId="ms-dcf"
      description="Institutional-grade DCF valuation with sensitivity grid"
      inputLabel="Ticker + Company Name"
      placeholder="e.g. AAPL (Apple Inc.)"
      initialTicker={initialTicker}
      includeFundamentals
      contextNote="Enter a ticker (e.g. AAPL). Representative fundamentals are attached to the prompt automatically."
      generateLabel="Build DCF Model"
      buildUserInput={(t) =>
        `Build a full Morgan Stanley-style DCF valuation for ticker ${t.toUpperCase()} (${getCompanyName(t)}). Use representative sample data where you don't have live fundamentals. Include the 5-year revenue projection, operating margin estimates, free cash flow build, WACC breakdown, terminal value (both methods), the sensitivity grid (WACC × terminal growth), DCF-vs-market comparison, and the 3 assumptions most likely to break the model.`
      }
    />
  );
}

const NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms, Inc.",
  TSLA: "Tesla, Inc.",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  JNJ: "Johnson & Johnson",
  WMT: "Walmart Inc.",
  PG: "Procter & Gamble",
  KO: "Coca-Cola Company",
  DIS: "Walt Disney Company",
  NFLX: "Netflix, Inc.",
  INTC: "Intel Corporation",
  AMD: "Advanced Micro Devices",
  CRM: "Salesforce, Inc.",
  BAC: "Bank of America",
  XOM: "Exxon Mobil",
  CVX: "Chevron Corporation",
  PFE: "Pfizer Inc.",
  MRK: "Merck & Co.",
  ABBV: "AbbVie Inc.",
  COST: "Costco Wholesale",
  HD: "Home Depot",
  NKE: "Nike, Inc.",
  PYPL: "PayPal Holdings",
  UBER: "Uber Technologies",
  SQ: "Block, Inc.",
};
function getCompanyName(t: string) {
  return NAMES[t.toUpperCase()] ?? "the company";
}
