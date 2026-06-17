"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Radar,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Bot,
  Newspaper,
  Activity,
  Filter as FilterIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";

interface SentimentArticleRow {
  id: string;
  ticker: string;
  source: "yahoo" | "google" | "reddit" | "twitter" | "rss";
  title: string;
  url: string;
  summary: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  publishedAt: string | null;
  fetchedAt: string;
}

interface Overview {
  marketSentiment: string;
  marketScore: number;
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  topBullish: { ticker: string; avgScore: number; count: number } | null;
  topBearish: { ticker: string; avgScore: number; count: number } | null;
  asOf: number;
}

interface TrendingTicker {
  ticker: string;
  avgScore: number;
  mentions: number;
  bullish: number;
  bearish: number;
}

interface TrendPoint {
  ts: string;
  score: number;
  count: number;
}

const SOURCE_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  yahoo: { label: "Yahoo", color: "text-cyan-300", bg: "bg-cyan-900/40 border-cyan-700/40" },
  google: { label: "Google", color: "text-blue-300", bg: "bg-blue-900/40 border-blue-700/40" },
  reddit: { label: "Reddit", color: "text-orange-300", bg: "bg-orange-900/40 border-orange-700/40" },
  twitter: { label: "Twitter", color: "text-slate-200", bg: "bg-slate-700/40 border-slate-600/40" },
  rss: { label: "RSS", color: "text-emerald-300", bg: "bg-emerald-900/40 border-emerald-700/40" },
};

const SENTIMENT_META: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof TrendingUp }
> = {
  bullish: { label: "Bullish", color: "text-emerald-300", bg: "bg-emerald-900/40 border-emerald-700/40", icon: TrendingUp },
  bearish: { label: "Bearish", color: "text-rose-300", bg: "bg-rose-900/40 border-rose-700/40", icon: TrendingDown },
  neutral: { label: "Neutral", color: "text-slate-300", bg: "bg-slate-700/40 border-slate-600/40", icon: Minus },
};

const fmtTime = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const fmtRelative = (iso: string | null): string => {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

interface SentimentRadarProps {
  onNavigate: (id: SectionId, ticker?: string) => void;
}

export function SentimentRadar({ onNavigate }: SentimentRadarProps) {
  const [articles, setArticles] = useState<SentimentArticleRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trending, setTrending] = useState<TrendingTicker[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<number | null>(null);

  // Filters
  const [tickerFilter, setTickerFilter] = useState("MARKET");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [hours, setHours] = useState(24);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  // Ticker search input
  const [tickerInput, setTickerInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch articles with filters
  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const params = new URLSearchParams({
        ticker: tickerFilter,
        source: sourceFilter,
        sentiment: sentimentFilter,
        hours: String(hours),
        limit: String(LIMIT),
        offset: String(offset),
      });
      const r = await fetch(`/api/sentiment/articles?${params.toString()}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Failed to load articles");
      const j = await r.json();
      setArticles(j.articles || []);
      setTotal(j.total || 0);
    } catch (e) {
      console.error("Failed to fetch articles", e);
    } finally {
      setLoadingArticles(false);
    }
  }, [tickerFilter, sourceFilter, sentimentFilter, hours, offset]);

  // Fetch overview / trending / trend on mount + every 60s
  const fetchAggregates = useCallback(async () => {
    try {
      const [o, t, tr] = await Promise.all([
        fetch("/api/sentiment/overview", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/sentiment/trending-tickers", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/sentiment/trend?days=7", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setOverview(o);
      setTrending(t.tickers || []);
      setTrend(tr.series || []);
    } catch (e) {
      console.error("Failed to fetch aggregates", e);
    }
  }, []);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    void fetchAggregates();
    const t = setInterval(fetchAggregates, 60_000);
    return () => clearInterval(t);
  }, [fetchAggregates]);

  // Debounced ticker input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const v = tickerInput.trim().toUpperCase();
      setTickerFilter(v || "MARKET");
      setOffset(0);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tickerInput]);

  // Trigger a scan
  const triggerScan = useCallback(async () => {
    setScanning(true);
    try {
      // Synchronous scan (wait=1) — returns articles once done
      const r = await fetch(
        `/api/sentiment/scan?ticker=${encodeURIComponent(tickerFilter)}&wait=1`,
        { method: "POST" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Scan failed");
      toast.success(
        `Scan complete: ${j.count} articles processed for ${tickerFilter}`
      );
      setLastScan(Date.now());
      void fetchArticles();
      void fetchAggregates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setScanning(false);
    }
  }, [tickerFilter, fetchArticles, fetchAggregates]);

  // Status poller while scanning
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/sentiment/status?ticker=${encodeURIComponent(tickerFilter)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (j.status === "done" && !cancelled) {
          void fetchArticles();
          void fetchAggregates();
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [scanning, tickerFilter, fetchArticles, fetchAggregates]);

  const sources = ["all", "yahoo", "google", "reddit", "twitter", "rss"];
  const sentiments = ["all", "bullish", "bearish", "neutral"];
  const hourOptions = [1, 6, 24, 168];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-amber-400" />
                <h1 className="text-xl font-bold text-slate-50">
                  Sentiment Radar
                </h1>
                <Badge
                  variant="outline"
                  className="border-cyan-700/60 bg-cyan-900/30 text-cyan-300 text-[10px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 live-dot mr-1" />
                  AI BRAIN
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Real-time aggregation from Yahoo Finance, Google News, Reddit
                (stocks / investing / wallstreetbets / StockMarket), and
                Twitter/X via Nitter — each article scored by an LLM-powered
                sentiment classifier.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Last scan: {lastScan ? fmtRelative(new Date(lastScan).toISOString()) : "never"}
                {overview && (
                  <> · {overview.total} articles in last 24h</>
                )}
              </p>
            </div>
            <Button
              onClick={triggerScan}
              disabled={scanning}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 h-9"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              {scanning ? "Scanning…" : "Scan Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <OverviewCard
          label="Market Sentiment"
          value={overview?.marketSentiment || "—"}
          sub={
            overview
              ? `Score ${overview.marketScore >= 0 ? "+" : ""}${overview.marketScore.toFixed(2)}`
              : ""
          }
          tone={
            !overview
              ? "neutral"
              : overview.marketScore > 0.1
                ? "up"
                : overview.marketScore < -0.1
                  ? "down"
                  : "neutral"
          }
          icon={<Activity className="h-4 w-4" />}
        />
        <OverviewCard
          label="Top Bullish"
          value={overview?.topBullish?.ticker || "—"}
          sub={
            overview?.topBullish
              ? `+${overview.topBullish.avgScore.toFixed(2)} (${overview.topBullish.count} arts)`
              : ""
          }
          tone="up"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <OverviewCard
          label="Top Bearish"
          value={overview?.topBearish?.ticker || "—"}
          sub={
            overview?.topBearish
              ? `${overview.topBearish.avgScore.toFixed(2)} (${overview.topBearish.count} arts)`
              : ""
          }
          tone="down"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <OverviewCard
          label="Articles (24h)"
          value={overview ? String(overview.total) : "—"}
          sub={
            overview
              ? `${overview.bullish}↑ / ${overview.bearish}↓ / ${overview.neutral}=`
              : ""
          }
          tone="neutral"
          icon={<Newspaper className="h-4 w-4" />}
        />
      </div>

      {/* Filter bar */}
      <Card className="border-slate-700 bg-slate-800/40">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <FilterIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1">
            <Input
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="Ticker (blank = MARKET)"
              className="h-7 w-32 text-xs bg-slate-900/60 border-slate-700"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {sources.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSourceFilter(s);
                  setOffset(0);
                }}
                className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium border transition-colors",
                  sourceFilter === s
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                )}
              >
                {s === "all" ? "All sources" : SOURCE_META[s]?.label || s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {sentiments.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSentimentFilter(s);
                  setOffset(0);
                }}
                className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium border transition-colors capitalize",
                  sentimentFilter === s
                    ? s === "bullish"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : s === "bearish"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-slate-500/20 border-slate-400 text-slate-200"
                    : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {hourOptions.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setHours(h);
                  setOffset(0);
                }}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                  hours === h
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                    : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                )}
              >
                {h < 24 ? `${h}h` : `${h / 24}d`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main grid: articles feed + ticker sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-slate-700 bg-slate-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-100">
                Articles ({total})
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Filtered by ticker{" "}
                <span className="font-mono text-amber-300">
                  {tickerFilter}
                </span>{" "}
                · last {hours < 24 ? `${hours}h` : `${hours / 24}d`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingArticles && articles.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading articles…
                </div>
              ) : articles.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center space-y-3">
                  <Radar className="h-8 w-8 mx-auto text-slate-600" />
                  <div>
                    No articles yet. Click{" "}
                    <span className="font-bold text-amber-300">Scan Now</span>{" "}
                    to start the radar.
                  </div>
                  <Button
                    size="sm"
                    onClick={triggerScan}
                    disabled={scanning}
                    className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    {scanning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Start First Scan
                  </Button>
                </div>
              ) : (
                <>
                  {articles.map((a) => {
                    const sm = SENTIMENT_META[a.sentiment] || SENTIMENT_META.neutral;
                    const smSrc = SOURCE_META[a.source] || SOURCE_META.rss;
                    const SentIcon = sm.icon;
                    return (
                      <div
                        key={a.id}
                        className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 hover:border-slate-600"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] px-1 py-0 h-4 border",
                                  smSrc.bg,
                                  smSrc.color
                                )}
                              >
                                {smSrc.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] px-1 py-0 h-4 border flex items-center gap-0.5",
                                  sm.bg,
                                  sm.color
                                )}
                              >
                                <SentIcon className="h-2.5 w-2.5" />
                                {sm.label} {a.sentimentScore >= 0 ? "+" : ""}
                                {a.sentimentScore.toFixed(2)}
                              </Badge>
                              {a.ticker && a.ticker !== "MARKET" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-slate-700 text-amber-300"
                                >
                                  ${a.ticker}
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-500 ml-auto">
                                {fmtRelative(a.publishedAt || a.fetchedAt)}
                              </span>
                            </div>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-slate-100 hover:text-amber-300 line-clamp-2"
                            >
                              {a.title}
                              <ExternalLink className="inline-block h-3 w-3 ml-1 opacity-60" />
                            </a>
                            {a.summary && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {a.summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onNavigate("ai-agent", a.ticker)}
                            className="h-6 text-[10px] text-slate-400 hover:text-amber-300 hover:bg-slate-800 px-2"
                          >
                            <Bot className="h-3 w-3 mr-1" />
                            Analyze with AI Agent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {offset + LIMIT < total && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset((o) => o + LIMIT)}
                      className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Load more ({total - offset - LIMIT} remaining)
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar: trending tickers */}
        <div className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Trending Tickers (24h)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Top 10 by mention count
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto aib-scroll">
              {trending.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No ticker data yet. Run a scan.
                </div>
              ) : (
                trending.map((t) => {
                  const up = t.avgScore >= 0;
                  const pct = Math.min(100, Math.abs(t.avgScore) * 100);
                  return (
                    <button
                      key={t.ticker}
                      onClick={() => {
                        setTickerInput(t.ticker);
                        setTickerFilter(t.ticker);
                        setOffset(0);
                      }}
                      className="w-full text-left rounded-md border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 hover:border-slate-600"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300">
                          ${t.ticker}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {t.mentions} mentions
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              up ? "bg-emerald-500" : "bg-rose-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "font-mono tabular-nums text-[10px] w-12 text-right",
                            up ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {up ? "+" : ""}
                          {t.avgScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[9px] text-slate-500">
                        <span className="text-emerald-500">↑{t.bullish}</span>
                        <span className="text-rose-500">↓{t.bearish}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sentiment trend chart */}
      <Card className="border-slate-700 bg-slate-800/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <Activity className="h-4 w-4 text-cyan-400" />
            Sentiment Trend (7 days · hourly buckets)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No trend data yet — scans populate this chart over time.
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="sentArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="ts"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    minTickGap={40}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v) => new Date(v).toLocaleString("en-US")}
                    formatter={(value: number) => [value.toFixed(3), "Sentiment"]}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                    fill="url(#sentArea)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            {label}
          </div>
          <div
            className={cn(
              tone === "up"
                ? "text-emerald-400"
                : tone === "down"
                  ? "text-rose-400"
                  : "text-slate-400"
            )}
          >
            {icon}
          </div>
        </div>
        <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-50">
          {value}
        </div>
        {sub && (
          <div
            className={cn(
              "text-[10px] mt-0.5 font-mono tabular-nums",
              tone === "up"
                ? "text-emerald-400"
                : tone === "down"
                  ? "text-rose-400"
                  : "text-slate-500"
            )}
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
