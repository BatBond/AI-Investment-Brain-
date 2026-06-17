"use client";

import { TickerModule } from "./_ticker-module";

export function RenPatterns({ initialTicker }: { initialTicker?: string }) {
  return (
    <TickerModule
      sectionId="ren-patterns"
      description="Statistical pattern detection: seasonal, behavioral, options-implied edges"
      inputLabel="Ticker + Time Period"
      placeholder="e.g. AAPL over the last 5 years"
      initialTicker={initialTicker}
      includeFundamentals
      contextNote="Enter a ticker and an optional time horizon (default: 5 years). The RenTec quant will hunt for quantifiable, repeatable edges."
      generateLabel="Hunt for Patterns"
      buildUserInput={(t) =>
        `Run a Renaissance Technologies-style pattern detection pass on ${t.toUpperCase()} over the last 5 years. Use representative sample data. Cover seasonal patterns (best/worst months with hit rate), day-of-week effects, correlation with macro events (Fed, CPI, NFP), insider buying/selling, institutional ownership trend, short interest & squeeze potential, unusual options activity, earnings price behavior, sector rotation signal, and a top-3 statistical edge summary with sample size and confidence interval.`
      }
    />
  );
}
