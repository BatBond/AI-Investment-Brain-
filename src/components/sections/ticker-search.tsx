"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Calculator,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Newspaper,
  ExternalLink,
  Building2,
  Briefcase,
  Globe2,
} from "lucide-react";
import {
  formatCurrency,
  formatPct,
  formatNumber,
} from "@/lib/market-data";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";
import { toast } from "sonner";

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAbs: number;
  volume: number;
  marketCap: number;
  currency: string;
  exchange: string;
  exchangeName: string;
  quoteType: string;
  isLive: boolean;
}

interface LiveFundamentals {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  peRatio?: number;
  forwardPe?: number;
  pbRatio?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  marketCap: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  revenue?: number;
  revenueGrowthYoY?: number;
  netMargin?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  freeCashFlow?: number;
  fullTimeEmployees?: number;
  isLive: boolean;
}

interface LiveSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
  typeDisp: string;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
}

interface TickerSearchProps {
  initialTicker?: string;
  onNavigate: (id: SectionId, ticker?: string) => void;
}

export function TickerSearch({ initialTicker, onNavigate }: TickerSearchProps) {
  const [query, setQuery] = useState(initialTicker ?? "AAPL");
  const [selected, setSelected] = useState<string>(initialTicker ?? "AAPL");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LiveSearchResult[]>([]);
  const [searchLive, setSearchLive] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (initialTicker) {
      setQuery(initialTicker);
      setSelected(initialTicker);
    }
  }, [initialTicker]);

  // Live quote
  const quoteQ = useQuery({
    queryKey: ["quote", selected],
    queryFn: async () => {
      const r = await fetch(`/api/market/quote/${encodeURIComponent(selected)}`);
      if (!r.ok) throw new Error(`Failed to fetch quote`);
      return (await r.json()) as LiveQuote;
    },
    enabled: !!selected,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  // Live fundamentals
  const fundQ = useQuery({
    queryKey: ["fundamentals", selected],
    queryFn: async () => {
      const r = await fetch(`/api/market/fundamentals/${encodeURIComponent(selected)}`);
      if (!r.ok) throw new Error(`Failed to fetch fundamentals`);
      return (await r.json()) as LiveFundamentals;
    },
    enabled: !!selected,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Historical bars
  const histQ = useQuery({
    queryKey: ["historical", selected, 180],
    queryFn: async () => {
      const r = await fetch(`/api/market/historical/${encodeURIComponent(selected)}?days=180`);
      if (!r.ok) throw new Error(`Failed to fetch history`);
      const j = await r.json();
      return (j.bars ?? []) as { date: string; open: number; high: number; low: number; close: number; volume: number; adjClose?: number }[];
    },
    enabled: !!selected,
    staleTime: 60 * 60_000,
    retry: 1,
  });

  // News
  const newsQ = useQuery({
    queryKey: ["news", selected],
    queryFn: async () => {
      const r = await fetch(`/api/market/news/${encodeURIComponent(selected)}`);
      if (!r.ok) throw new Error(`Failed to fetch news`);
      const j = await r.json();
      return (j.news ?? []) as NewsItem[];
    },
    enabled: !!selected,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/market/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = await r.json();
        if (cancelled) return;
        setSearchLive(!data.error);
        setSearchResults((data.results ?? []) as LiveSearchResult[]);
        setSearchOpen(true);
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setSearchOpen(false);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  function selectSymbol(s: string) {
    setSelected(s.toUpperCase());
    setQuery(s.toUpperCase());
    setSearchOpen(false);
    setSearchQuery("");
  }

  const quote = quoteQ.data;
  const fund = fundQ.data;
  const series = useMemo(
    () => (histQ.data ?? []).map((b) => b.close).filter((n) => typeof n === "number" && isFinite(n)),
    [histQ.data]
  );
  const isLive = (quote?.isLive || fund?.isLive) ?? false;

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery || query}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setQuery(e.target.value);
                }}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search any ticker (AAPL, TSLA, BRK.B, SPY...)"
                className="h-10 bg-slate-900/70 border-slate-700 pl-9 font-mono text-base text-slate-100 placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (searchOpen && searchResults.length > 0) {
                      selectSymbol(searchResults[0].symbol);
                    } else if (query.trim()) {
                      selectSymbol(query.trim().split(" ")[0]);
                    }
                  }
                }}
              />
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 z-30 max-h-80 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
                  {searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      onClick={() => selectSymbol(r.symbol)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-amber-400">{r.symbol}</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500">{r.typeDisp}</span>
                        </div>
                        <div className="truncate text-xs text-slate-400">{r.name}</div>
                      </div>
                      <div className="text-[10px] text-slate-500">{r.exchange}</div>
                    </button>
                  ))}
                </div>
              )}
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
        </CardContent>
      </Card>

      {(quoteQ.isLoading || fundQ.isLoading) && (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardContent className="p-8 text-center text-slate-400">
            <Activity className="mx-auto h-6 w-6 animate-pulse text-amber-400" />
            <p className="mt-3 text-sm">Loading live market data for {selected}…</p>
          </CardContent>
        </Card>
      )}

      {(quoteQ.error || fundQ.error) && !quote && !fund && (
        <Card className="border-rose-700/60 bg-rose-900/20 text-rose-200">
          <CardContent className="p-6 text-sm">
            Failed to load data for {selected}. Try a different ticker or check your connection.
          </CardContent>
        </Card>
      )}

      {quote && fund && (
        <>
          {/* Header card */}
          <Card className="border-slate-700 bg-slate-800/60 card-glow">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-3xl font-bold text-amber-400">
                      {fund.symbol}
                    </span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      {quote.exchangeName || quote.exchange || fund.sector || "—"}
                    </Badge>
                    {fund.sector && (
                      <Badge variant="outline" className="border-cyan-700/60 bg-cyan-900/20 text-cyan-300">
                        {fund.sector}
                      </Badge>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold",
                        isLive
                          ? "bg-emerald-900/40 text-emerald-400"
                          : "bg-amber-900/40 text-amber-400"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-emerald-400" : "bg-amber-400", isLive && "live-dot")} />
                      {isLive ? "LIVE" : "MOCK"}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-300 truncate">{fund.name}</div>
                  {fund.industry && <div className="text-xs text-slate-500">{fund.industry}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-3xl font-bold text-slate-50 tabular-nums">
                    {formatCurrency(quote.price)}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-base font-medium tabular-nums",
                      quote.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {quote.changePct >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {quote.changeAbs >= 0 ? "+" : ""}
                    {quote.changeAbs.toFixed(2)} ({quote.changePct >= 0 ? "+" : ""}
                    {quote.changePct.toFixed(2)}%)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Vol {formatNumber(quote.volume, { compact: true })} · Mkt{" "}
                    {formatCurrency(quote.marketCap, { compact: true })}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Stat label="Mkt Cap" value={formatCurrency(fund.marketCap, { compact: true })} />
                <Stat label="P/E (TTM)" value={fund.peRatio ? `${fund.peRatio.toFixed(1)}x` : "n/a"} />
                <Stat label="Fwd P/E" value={fund.forwardPe ? `${fund.forwardPe.toFixed(1)}x` : "n/a"} />
                <Stat label="EPS" value={fund.eps !== undefined ? `$${fund.eps.toFixed(2)}` : "n/a"} />
                <Stat label="Beta" value={fund.beta !== undefined ? fund.beta.toFixed(2) : "n/a"} />
                <Stat label="Div Yield" value={fund.dividendYield !== undefined ? formatPct(fund.dividendYield) : "—"} />
                <Stat label="52w High" value={fund.fiftyTwoWeekHigh !== undefined ? `$${fund.fiftyTwoWeekHigh.toFixed(2)}` : "n/a"} />
                <Stat label="52w Low" value={fund.fiftyTwoWeekLow !== undefined ? `$${fund.fiftyTwoWeekLow.toFixed(2)}` : "n/a"} />
                <Stat label="Rev (TTM)" value={fund.revenue !== undefined ? formatCurrency(fund.revenue, { compact: true }) : "n/a"} />
                <Stat label="Rev YoY" value={fund.revenueGrowthYoY !== undefined ? formatPct(fund.revenueGrowthYoY, 1) : "n/a"} tone={fund.revenueGrowthYoY && fund.revenueGrowthYoY >= 0 ? "up" : "down"} />
                <Stat label="Net Margin" value={fund.netMargin !== undefined ? formatPct(fund.netMargin, 1) : "n/a"} />
                <Stat label="D/E" value={fund.debtToEquity !== undefined ? fund.debtToEquity.toFixed(2) : "n/a"} />
                <Stat label="P/B" value={fund.pbRatio !== undefined ? `${fund.pbRatio.toFixed(2)}x` : "n/a"} />
                <Stat label="ROE" value={fund.returnOnEquity !== undefined ? formatPct(fund.returnOnEquity, 1) : "n/a"} />
                <Stat label="FCF" value={fund.freeCashFlow !== undefined ? formatCurrency(fund.freeCashFlow, { compact: true }) : "n/a"} />
                <Stat label="Employees" value={fund.fullTimeEmployees !== undefined ? formatNumber(fund.fullTimeEmployees, { compact: true }) : "n/a"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => onNavigate("personas", fund.symbol)}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Run 5-Persona Advisory
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("ms-dcf", fund.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <Calculator className="mr-1.5 h-3.5 w-3.5" />
                  DCF Valuation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("cit-technical", fund.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <LineChartIcon className="mr-1.5 h-3.5 w-3.5" />
                  Citadel Technical
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("jpm-earnings", fund.symbol)}
                  className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
                >
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                  Earnings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("ren-patterns", fund.symbol)}
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
                  TradingView · {fund.symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradingViewWidget
                  symbol={`${quote.exchange || "NASDAQ"}:${fund.symbol}`}
                  type="advanced-chart"
                  height={440}
                />
              </CardContent>
            </Card>

            {/* Trend + fundamentals summary */}
            <div className="space-y-5">
              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-50">180-Day Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-24">
                    {series.length > 0 ? (
                      <Sparkline
                        data={series}
                        height={96}
                        color={quote.changePct >= 0 ? "#34d399" : "#fb7185"}
                        fill={quote.changePct >= 0 ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)"}
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center text-xs text-slate-500">
                        No historical data
                      </div>
                    )}
                  </div>
                  {series.length > 0 && (
                    <div className="mt-3 flex justify-between text-xs text-slate-400">
                      <span>L: {formatCurrency(Math.min(...series))}</span>
                      <span>H: {formatCurrency(Math.max(...series))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {fund.description && (
                <Card className="border-slate-700 bg-slate-800/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-400" />
                      Company Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex flex-wrap gap-3 text-slate-300">
                      {fund.sector && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-slate-500" />
                          {fund.sector}
                        </span>
                      )}
                      {fund.industry && (
                        <span className="inline-flex items-center gap-1">
                          <Globe2 className="h-3 w-3 text-slate-500" />
                          {fund.industry}
                        </span>
                      )}
                      {fund.website && (
                        <a
                          href={fund.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {fund.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed line-clamp-6">
                      {fund.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* News */}
          <Card className="border-slate-700 bg-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-amber-400" />
                Latest News
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Recent headlines for {fund.symbol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newsQ.isLoading ? (
                <p className="text-xs text-slate-500">Loading news…</p>
              ) : newsQ.data && newsQ.data.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto space-y-2 aib-scroll pr-1">
                  {newsQ.data.map((n, i) => (
                    <li key={i}>
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block rounded-md border border-slate-700/50 bg-slate-900/40 p-2.5 text-xs hover:border-amber-500/60 hover:bg-amber-500/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">{n.publisher}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.publishedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-200 leading-snug">{n.title}</div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No recent news available.</p>
              )}
            </CardContent>
          </Card>
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
