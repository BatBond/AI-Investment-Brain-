"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calculator,
  LineChart,
} from "lucide-react";
import {
  searchTickers,
  getTickerData,
  getHistoricalPrices,
  getTechnicalIndicators,
  formatCurrency,
  formatPct,
  formatNumber,
} from "@/lib/market-data";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";

interface TickerSearchProps {
  initialTicker?: string;
  onNavigate: (id: SectionId, ticker?: string) => void;
}

export function TickerSearch({ initialTicker, onNavigate }: TickerSearchProps) {
  const [query, setQuery] = useState(initialTicker ?? "AAPL");
  const [selected, setSelected] = useState<string>(initialTicker ?? "AAPL");

  useEffect(() => {
    if (initialTicker) {
      setQuery(initialTicker);
      setSelected(initialTicker);
    }
  }, [initialTicker]);

  const results = useMemo(() => searchTickers(query, 8), [query]);
  const data = useMemo(() => getTickerData(selected), [selected]);
  const series = useMemo(
    () => (data ? getHistoricalPrices(selected, 180) : []),
    [selected, data]
  );
  const tech = useMemo(
    () => (data ? getTechnicalIndicators(selected) : null),
    [selected, data]
  );

  function selectSymbol(s: string) {
    setSelected(s);
    setQuery(s);
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Type a ticker (AAPL, MSFT, NVDA...) or company name"
                className="h-10 bg-slate-900/70 border-slate-700 pl-9 font-mono text-base text-slate-100 placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) selectSymbol(results[0].symbol);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["AAPL", "NVDA", "TSLA", "MSFT", "AMZN"].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => selectSymbol(s)}
                  className="border-slate-700 bg-slate-900/40 font-mono text-xs hover:border-amber-500/60 hover:text-amber-300"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          {query && results.length > 0 && results[0].symbol !== selected && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {results.slice(0, 6).map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => selectSymbol(t.symbol)}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/40 px-2 py-1 text-xs hover:border-amber-500/60 hover:text-amber-300"
                >
                  <span className="font-mono font-semibold text-amber-400">{t.symbol}</span>
                  <span className="text-slate-400 truncate max-w-[120px]">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!data ? (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardContent className="p-8 text-center text-slate-400">
            No mock data available for{" "}
            <span className="font-mono text-amber-400">{selected}</span>. Try one of the 30 supported
            tickers (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, JNJ, ...).
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header card */}
          <Card className="border-slate-700 bg-slate-800/60 card-glow">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-3xl font-bold text-amber-400">
                      {data.symbol}
                    </span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      {data.exchange}
                    </Badge>
                    <Badge variant="outline" className="border-cyan-700/60 bg-cyan-900/20 text-cyan-300">
                      {data.sector}
                    </Badge>
                  </div>
                  <div className="mt-1 text-slate-300">{data.name}</div>
                  <div className="text-xs text-slate-500">{data.industry}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-slate-50 tabular-nums">
                    {formatCurrency(data.price)}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-base font-medium tabular-nums",
                      data.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {data.changePct >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {data.change >= 0 ? "+" : ""}
                    {data.change.toFixed(2)} ({data.changePct >= 0 ? "+" : ""}
                    {formatPct(data.changePct)})
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Vol {formatNumber(data.volume, { compact: true })} · Avg{" "}
                    {formatNumber(data.avgVolume, { compact: true })}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Stat label="Mkt Cap" value={formatCurrency(data.marketCap, { compact: true })} />
                <Stat label="P/E (TTM)" value={data.peRatio ? `${data.peRatio.toFixed(1)}x` : "n/a"} />
                <Stat label="Fwd P/E" value={`${data.forwardPe.toFixed(1)}x`} />
                <Stat label="EPS" value={`$${data.eps.toFixed(2)}`} />
                <Stat label="Beta" value={data.beta.toFixed(2)} />
                <Stat label="Div Yield" value={data.dividendYield ? formatPct(data.dividendYield) : "—"} />
                <Stat label="52w High" value={`$${data.high52.toFixed(2)}`} />
                <Stat label="52w Low" value={`$${data.low52.toFixed(2)}`} />
                <Stat label="Rev (TTM)" value={formatCurrency(data.revenue, { compact: true })} />
                <Stat label="Rev YoY" value={formatPct(data.revenueGrowthYoY, 1)} tone={data.revenueGrowthYoY >= 0 ? "up" : "down"} />
                <Stat label="Net Margin" value={formatPct(data.netMargin, 1)} />
                <Stat label="D/E" value={data.debtToEquity.toFixed(2)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => onNavigate("personas", data.symbol)}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Run 5-Persona Advisory
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("ms-dcf", data.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <Calculator className="mr-1.5 h-3.5 w-3.5" />
                  DCF Valuation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("cit-technical", data.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <LineChart className="mr-1.5 h-3.5 w-3.5" />
                  Citadel Technical
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("jpm-earnings", data.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                  Earnings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("ren-patterns", data.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <Activity className="mr-1.5 h-3.5 w-3.5" />
                  Pattern Finder
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart */}
            <Card className="lg:col-span-2 border-slate-700 bg-slate-800/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  Advanced Chart
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  TradingView · {data.exchange}:{data.symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradingViewWidget
                  symbol={`${data.exchange}:${data.symbol}`}
                  type="advanced-chart"
                  height={440}
                />
              </CardContent>
            </Card>

            {/* Technicals + sparkline */}
            <div className="space-y-5">
              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-50">180-Day Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-24">
                    <Sparkline
                      data={series}
                      height={96}
                      color={data.changePct >= 0 ? "#34d399" : "#fb7185"}
                      fill={
                        data.changePct >= 0
                          ? "rgba(52,211,153,0.12)"
                          : "rgba(251,113,133,0.12)"
                      }
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>L: {formatCurrency(Math.min(...series))}</span>
                    <span>H: {formatCurrency(Math.max(...series))}</span>
                  </div>
                </CardContent>
              </Card>

              {tech && (
                <Card className="border-slate-700 bg-slate-800/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-50">
                      Quick Technicals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-xs">
                    <TechRow label="Trend" value={tech.trend.toUpperCase()} tone={tech.trend === "up" ? "up" : tech.trend === "down" ? "down" : "neutral"} />
                    <TechRow label="RSI (14)" value={tech.rsi14.toFixed(1)} tone={tech.rsi14 > 70 ? "down" : tech.rsi14 < 30 ? "up" : "neutral"} />
                    <TechRow label="SMA 50" value={`$${tech.sma50.toFixed(2)}`} />
                    <TechRow label="SMA 200" value={`$${tech.sma200.toFixed(2)}`} />
                    <TechRow label="MACD" value={tech.macd.toFixed(3)} tone={tech.macd >= 0 ? "up" : "down"} />
                    <TechRow label="Support" value={`$${tech.support.toFixed(2)}`} />
                    <TechRow label="Resistance" value={`$${tech.resistance.toFixed(2)}`} />
                    <TechRow label="ATR (14)" value={tech.atr14.toFixed(2)} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-semibold tabular-nums",
          tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-slate-100"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function TechRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/40 pb-1">
      <span className="text-slate-400">{label}</span>
      <span
        className={cn(
          "font-mono font-medium tabular-nums",
          tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-slate-100"
        )}
      >
        {value}
      </span>
    </div>
  );
}
