"use client";

import { TickerModule } from "./_ticker-module";

export function BainCompetitive({ initialTicker }: { initialTicker?: string }) {
  return (
    <TickerModule
      sectionId="bain-competitive"
      description="Map industry structure, moats, management quality, and competitive dynamics"
      inputLabel="Sector / Industry (or Ticker)"
      placeholder="e.g. Semiconductors, Cloud Software, or AAPL"
      initialTicker={initialTicker}
      contextNote="Enter either a sector/industry name (e.g. 'Semiconductors') or a ticker. The Bain strategist will map the competitive landscape."
      generateLabel="Map Competitive Landscape"
      buildUserInput={(t) =>
        `Run a Bain-style competitive advantage analysis for ${t.toUpperCase()}. Use representative sample data. Cover top 5-7 competitors with market cap & market share, revenue & margin comparison, moat analysis per company, market share trends over 3 years, management quality (capital allocation), innovation pipeline & R&D, biggest threats to the sector, SWOT for the top 2 companies, a single best stock pick with rationale, and 12-month catalysts.`
      }
    />
  );
}
