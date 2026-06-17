"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  Newspaper,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from "lucide-react";
import {
  getAllTickers,
  getHistoricalPrices,
  formatCurrency,
  formatPct,
  formatNumber,
  type TickerData,
} from "@/lib/market-data";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";

interface DashboardProps {
  onNavigate: (id: SectionId) => void;
  onSelectTicker: (ticker: string) => void;
}

const WATCHLIST = ["AAPL", "NVDA", "MSFT", "TSLA", "META", "AMZN"];

export function Dashboard({ onNavigate, onSelectTicker }: DashboardProps) {
  const tickers = useMemo(() => getAllTickers(), []);
  const watchlist = useMemo(
    () => WATCHLIST.map((s) => tickers.find((t) => t.symbol === s)!).filter(Boolean),
    [tickers]
  );

  const gainers = useMemo(
    () => [...tickers].sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    [tickers]
  );
  const losers = useMemo(
    () => [...tickers].sort((a, b) => a.changePct - b.changePct).slice(0, 5),
    [tickers]
  );
  const mostActive = useMemo(
    () => [...tickers].sort((a, b) => b.volume - a.volume).slice(0, 5),
    [tickers]
  );

  const indices = [
    { name: "S&P 500", value: 5_815.03, changePct: 0.0042 },
    { name: "Nasdaq", value: 18_342.94, changePct: 0.0081 },
    { name: "Dow Jones", value: 42_863.86, changePct: -0.0019 },
    { name: "Russell 2k", value: 2_218.71, changePct: -0.0063 },
    { name: "VIX", value: 14.82, changePct: -0.0234 },
    { name: "10Y Yield", value: 4.073, changePct: 0.0115 },
  ];

  return (
    <div className="space-y-5">
      {/* Hero strip */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-amber-400">
                  Live Terminal · Pre-Market
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
                  Streaming
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-50">
                Good morning, Analyst.
              </h2>
              <p className="text-sm text-slate-400">
                Markets tilted risk-on overnight. Semis lead, energy lags.{" "}
                <button
                  onClick={() => onNavigate("morning-brief")}
                  className="text-amber-400 underline-offset-2 hover:underline"
                >
                  Read today&apos;s brief →
                </button>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <KPI label="Signals Today" value="42" delta="+11" tone="up" />
              <KPI label="Watchlist Avg" value="+0.84%" delta="vs SPX +0.42%" tone="up" />
              <KPI label="High-Risk Flags" value="3" delta="2 new" tone="down" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indices ticker */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {indices.map((idx) => {
          const up = idx.changePct >= 0;
          return (
            <Card key={idx.name} className="border-slate-700 bg-slate-800/40">
              <CardContent className="p-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  {idx.name}
                </div>
                <div className="font-mono text-base font-semibold text-slate-100 tabular-nums">
                  {idx.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium tabular-nums",
                    up ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {up ? "+" : ""}
                  {formatPct(idx.changePct)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Watchlist */}
        <Card className="lg:col-span-2 border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-50">
                <Activity className="h-4 w-4 text-cyan-400" />
                Watchlist
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Real-time mock quotes with 30-day sparkline
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-600 text-slate-400">
              {watchlist.length} symbols
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Symbol</th>
                    <th className="px-4 py-2 text-right font-medium">Last</th>
                    <th className="px-4 py-2 text-right font-medium">Chg%</th>
                    <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">Vol</th>
                    <th className="px-4 py-2 text-left font-medium hidden md:table-cell">30D Trend</th>
                    <th className="px-4 py-2 text-right font-medium hidden lg:table-cell">Mkt Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((t) => (
                    <WatchlistRow
                      key={t.symbol}
                      t={t}
                      onSelect={() => onSelectTicker(t.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Signals & alerts */}
        <div className="space-y-5">
          <Card className="border-slate-700 bg-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-50">
                <Zap className="h-4 w-4 text-amber-400" />
                Today&apos;s Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SignalRow
                icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                ticker="NVDA"
                text="RSI breakout above 70 on 2.4x volume"
                tone="up"
                onClick={() => onSelectTicker("NVDA")}
              />
              <SignalRow
                icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                ticker="TSLA"
                text="Death cross forming (50d < 200d)"
                tone="warn"
                onClick={() => onSelectTicker("TSLA")}
              />
              <SignalRow
                icon={<TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
                ticker="INTC"
                text="Below support at $23.40, gap-down risk"
                tone="down"
                onClick={() => onSelectTicker("INTC")}
              />
              <SignalRow
                icon={<Flame className="h-3.5 w-3.5 text-amber-400" />}
                ticker="META"
                text="Golden cross + breakout above $560"
                tone="up"
                onClick={() => onSelectTicker("META")}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-50">
                <Bell className="h-4 w-4 text-violet-400" />
                Watchlist Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  <span className="font-mono text-amber-400">AAPL</span> crossed above $225 resistance
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  <span className="font-mono text-emerald-400">MSFT</span> MACD bullish crossover
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>
                  <span className="font-mono text-rose-400">AMZN</span> broke 50d SMA on heavy volume
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Movers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MoversCard
          title="Top Gainers"
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          rows={gainers}
          onSelect={onSelectTicker}
          tone="up"
        />
        <MoversCard
          title="Top Losers"
          icon={<TrendingDown className="h-4 w-4 text-rose-400" />}
          rows={losers}
          onSelect={onSelectTicker}
          tone="down"
        />
        <MoversCard
          title="Most Active"
          icon={<Activity className="h-4 w-4 text-cyan-400" />}
          rows={mostActive}
          onSelect={onSelectTicker}
          tone="neutral"
        />
      </div>

      {/* News + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-50">
              <Newspaper className="h-4 w-4 text-amber-400" />
              News Catalysts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <NewsItem
              ticker="NVDA"
              headline="NVIDIA unveils next-gen Blackwell Ultra GPUs; pre-orders exceed supply"
              time="2h ago"
              onClick={() => onSelectTicker("NVDA")}
            />
            <NewsItem
              ticker="TSLA"
              headline="Tesla robotaxi event underwhelms; shares slip in pre-market"
              time="3h ago"
              onClick={() => onSelectTicker("TSLA")}
            />
            <NewsItem
              ticker="JPM"
              headline="JPMorgan beats on trading revenue; CEO flags 'resilient' consumer"
              time="5h ago"
              onClick={() => onSelectTicker("JPM")}
            />
            <NewsItem
              ticker="AAPL"
              headline="Apple Vision Pro 2 leaked; supply chain ramps in Vietnam"
              time="6h ago"
              onClick={() => onSelectTicker("AAPL")}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-50">Quick Links</CardTitle>
            <CardDescription className="text-xs">
              Jump straight to a deep-dive module
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <QuickLink label="5-Persona Advisory" onClick={() => onNavigate("personas")} />
            <QuickLink label="AI Agent Chat" onClick={() => onNavigate("ai-agent")} />
            <QuickLink label="Morning Brief" onClick={() => onNavigate("morning-brief")} />
            <QuickLink label="DCF Valuation" onClick={() => onNavigate("ms-dcf")} />
            <QuickLink label="Citadel Technical" onClick={() => onNavigate("cit-technical")} />
            <QuickLink label="Risk Framework" onClick={() => onNavigate("bw-risk")} />
            <QuickLink label="Earnings" onClick={() => onNavigate("jpm-earnings")} />
            <QuickLink label="Portfolio Builder" onClick={() => onNavigate("br-portfolio")} />
            <QuickLink label="Macro Impact" onClick={() => onNavigate("mck-macro")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="font-mono text-lg font-bold text-slate-50 tabular-nums">
        {value}
      </div>
      <div
        className={cn(
          "text-[11px] tabular-nums",
          tone === "up" ? "text-emerald-400" : "text-rose-400"
        )}
      >
        {delta}
      </div>
    </div>
  );
}

function WatchlistRow({ t, onSelect }: { t: TickerData; onSelect: () => void }) {
  const series = getHistoricalPrices(t.symbol, 30);
  const up = t.changePct >= 0;
  return (
    <tr
      onClick={onSelect}
      className="border-t border-slate-700/50 hover:bg-amber-500/5 cursor-pointer transition-colors"
    >
      <td className="px-4 py-2">
        <div className="font-mono font-semibold text-amber-400">{t.symbol}</div>
        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{t.name}</div>
      </td>
      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-100">
        {formatCurrency(t.price)}
      </td>
      <td
        className={cn(
          "px-4 py-2 text-right font-mono tabular-nums font-medium",
          up ? "text-emerald-400" : "text-rose-400"
        )}
      >
        {up ? "+" : ""}
        {formatPct(t.changePct)}
      </td>
      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-400 hidden sm:table-cell">
        {formatNumber(t.volume, { compact: true })}
      </td>
      <td className="px-4 py-2 hidden md:table-cell">
        <div className="w-24 h-8">
          <Sparkline
            data={series}
            color={up ? "#34d399" : "#fb7185"}
            fill={up ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)"}
          />
        </div>
      </td>
      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-400 hidden lg:table-cell">
        {formatCurrency(t.marketCap, { compact: true })}
      </td>
    </tr>
  );
}

function SignalRow({
  icon,
  ticker,
  text,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  ticker: string;
  text: string;
  tone: "up" | "down" | "warn";
  onClick: () => void;
}) {
  const accent =
    tone === "up"
      ? "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/20"
      : tone === "down"
        ? "border-rose-700/40 bg-rose-900/10 hover:bg-rose-900/20"
        : "border-amber-700/40 bg-amber-900/10 hover:bg-amber-900/20";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left text-xs transition-colors",
        accent
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-mono font-semibold text-slate-100">{ticker}</div>
        <div className="text-slate-400">{text}</div>
      </div>
    </button>
  );
}

function MoversCard({
  title,
  icon,
  rows,
  onSelect,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  rows: TickerData[];
  onSelect: (t: string) => void;
  tone: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-50">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((t, i) => {
              const up = t.changePct >= 0;
              return (
                <tr
                  key={t.symbol}
                  onClick={() => onSelect(t.symbol)}
                  className="border-t border-slate-700/50 hover:bg-amber-500/5 cursor-pointer"
                >
                  <td className="px-4 py-2 text-slate-500 tabular-nums w-8">{i + 1}</td>
                  <td className="px-2 py-2">
                    <span className="font-mono font-semibold text-amber-400">{t.symbol}</span>
                    <span className="ml-2 text-xs text-slate-500 truncate">{t.name}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-100">
                    {formatCurrency(t.price)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 text-right font-mono tabular-nums font-medium",
                      tone === "neutral"
                        ? up
                          ? "text-emerald-400"
                          : "text-rose-400"
                        : tone === "up"
                          ? "text-emerald-400"
                          : "text-rose-400"
                    )}
                  >
                    {up ? "+" : ""}
                    {formatPct(t.changePct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function NewsItem({
  ticker,
  headline,
  time,
  onClick,
}: {
  ticker: string;
  headline: string;
  time: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-slate-900/40 transition-colors"
    >
      <span className="mt-0.5 inline-flex h-7 min-w-[3rem] items-center justify-center rounded bg-amber-500/15 px-1.5 font-mono text-xs font-bold text-amber-400">
        {ticker}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 leading-snug">{headline}</p>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{time}</span>
      </div>
    </button>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-left text-xs font-medium text-slate-300 hover:border-amber-500/60 hover:bg-amber-500/5 hover:text-amber-300 transition-colors"
    >
      {label}
    </button>
  );
}
