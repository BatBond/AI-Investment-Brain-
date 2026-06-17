"use client";

import { TickerModule } from "./_ticker-module";

export function JpmEarnings({ initialTicker }: { initialTicker?: string }) {
  return (
    <TickerModule
      sectionId="jpm-earnings"
      description="Earnings preview & reaction desk: beats, implied move, post-print reaction"
      inputLabel="Company + Optional Earnings Date"
      placeholder="e.g. AAPL (earnings 2025-01-30)"
      initialTicker={initialTicker}
      includeFundamentals
      contextNote="Enter a ticker. Optional: append an earnings date in parentheses. The JPMorgan analyst will produce a full earnings breakdown."
      generateLabel="Build Earnings Brief"
      buildUserInput={(t) =>
        `Build a JPMorgan-level earnings breakdown for ${t.toUpperCase()}. Use representative sample data for the last 4 quarters, consensus estimates for the upcoming quarter, segment breakdown, options-implied move, historical post-earnings reactions, and bull/bear scenarios. End with a clear BUY BEFORE / SELL BEFORE / WAIT decision at the top.`
      }
    />
  );
}
