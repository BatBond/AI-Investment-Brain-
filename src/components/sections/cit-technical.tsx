"use client";

import { TickerModule } from "./_ticker-module";
import { getTechnicalIndicators } from "@/lib/market-data";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function CitTechnical({ initialTicker }: { initialTicker?: string }) {
  const [ticker, setTicker] = useState(initialTicker ?? "AAPL");

  useEffect(() => {
    if (initialTicker) setTicker(initialTicker);
  }, [initialTicker]);

  const tech = getTechnicalIndicators(ticker);

  return (
    <div className="space-y-5">
      <TickerModule
        sectionId="cit-technical"
        description="Multi-timeframe technical analysis with entry/stop/target and R:R"
        inputLabel="Ticker + Optional Current Position"
        placeholder="e.g. NVDA (long 100 @ $128)"
        initialTicker={ticker}
        includeFundamentals
        contextNote="Enter a ticker. Optional: add a current position in parentheses. The Citadel quant will compute technicals and a trade plan."
        generateLabel="Run Technical Analysis"
        buildUserInput={(t) =>
          `Run a Citadel-grade multi-timeframe technical analysis for ${t.toUpperCase()}. Use representative sample data. Cover trend on daily/weekly/monthly, support/resistance, moving averages (50/100/200d), RSI/MACD/Bollinger Bands with plain-English interpretation, volume analysis, chart pattern identification, Fibonacci levels, and an ideal entry/stop/target with risk-to-reward ratio. End with a STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL confidence rating.`
        }
      />

      {/* Live TradingView chart + computed technicals snapshot */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-50">
            Live Chart &amp; Computed Indicators — {ticker.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["AAPL", "NVDA", "MSFT", "TSLA", "META", "AMZN"].map((s) => (
              <button
                key={s}
                onClick={() => setTicker(s)}
                className={`rounded border px-2 py-1 font-mono text-xs ${
                  ticker === s
                    ? "border-amber-500 bg-amber-500/15 text-amber-300"
                    : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <TradingViewWidget
            symbol={`NASDAQ:${ticker.toUpperCase()}`}
            type="advanced-chart"
            height={380}
            studies={["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            <Ind label="Trend" value={tech.trend.toUpperCase()} />
            <Ind label="RSI 14" value={tech.rsi14.toFixed(1)} />
            <Ind label="SMA 50" value={`$${tech.sma50.toFixed(2)}`} />
            <Ind label="SMA 200" value={`$${tech.sma200.toFixed(2)}`} />
            <Ind label="Support" value={`$${tech.support.toFixed(2)}`} />
            <Ind label="Resistance" value={`$${tech.resistance.toFixed(2)}`} />
            <Ind label="MACD" value={tech.macd.toFixed(3)} />
            <Ind label="BB Upper" value={`$${tech.bbUpper.toFixed(2)}`} />
            <Ind label="BB Lower" value={`$${tech.bbLower.toFixed(2)}`} />
            <Ind label="ATR 14" value={tech.atr14.toFixed(2)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Ind({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}
