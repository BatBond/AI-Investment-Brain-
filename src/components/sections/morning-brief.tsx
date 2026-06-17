"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sunrise,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Newspaper,
  Bell,
  Globe2,
  DollarSign,
} from "lucide-react";
import {
  getAllTickers,
  formatCurrency,
  formatPct,
  formatNumber,
} from "@/lib/market-data";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";

interface MorningBriefProps {
  onNavigate: (id: SectionId) => void;
  onSelectTicker: (ticker: string) => void;
}

const FUTURES = [
  { name: "S&P 500 Fut", value: 5_827.25, changePct: 0.0021 },
  { name: "Nasdaq 100 Fut", value: 20_412.5, changePct: 0.0043 },
  { name: "Dow Fut", value: 42_910.0, changePct: -0.0011 },
  { name: "Russell 2k Fut", value: 2_224.3, changePct: -0.0032 },
];

const GLOBAL = [
  { name: "Nikkei 225", value: 38_925.41, changePct: 0.0124 },
  { name: "Hang Seng", value: 20_842.65, changePct: -0.0031 },
  { name: "FTSE 100", value: 8_247.18, changePct: 0.0025 },
  { name: "DAX", value: 19_512.84, changePct: 0.0041 },
  { name: "Stoxx 600", value: 514.27, changePct: 0.0032 },
  { name: "Shanghai Comp", value: 3_287.91, changePct: -0.0019 },
];

const NEWS = [
  {
    ticker: "NVDA",
    headline: "NVIDIA's Blackwell Ultra GPUs sell out preorders; demand exceeds supply into Q1",
    sentiment: "positive",
    time: "5:42 AM",
  },
  {
    ticker: "TSLA",
    headline: "Tesla robotaxi event underwhelms analysts; price target cuts begin",
    sentiment: "negative",
    time: "5:18 AM",
  },
  {
    ticker: "JPM",
    headline: "JPMorgan reports record trading revenue; beats on Q3 EPS",
    sentiment: "positive",
    time: "5:05 AM",
  },
  {
    ticker: "AAPL",
    headline: "Apple's Vision Pro 2 supply chain ramps in Vietnam; launch pegged for spring",
    sentiment: "positive",
    time: "4:50 AM",
  },
  {
    ticker: "XOM",
    headline: "Crude oil slides 1.2% on demand-growth worries; energy sector set to lag",
    sentiment: "negative",
    time: "4:31 AM",
  },
  {
    ticker: "PFE",
    headline: "Pfizer guides Seagen integration savings higher; oncology franchise in focus",
    sentiment: "neutral",
    time: "4:15 AM",
  },
];

export function MorningBrief({ onNavigate, onSelectTicker }: MorningBriefProps) {
  const tickers = getAllTickers();
  const gainers = [...tickers].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...tickers].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const active = [...tickers].sort((a, b) => b.volume - a.volume).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sunrise className="h-5 w-5 text-amber-400" />
                <span className="text-[11px] uppercase tracking-widest text-amber-400">
                  Daily Morning Brief
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-50">
                Pre-Market Open — Risk-On Tone
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                US equity futures point higher led by Nasdaq. Asian markets mixed (Nikkei +1.2%, HSI -0.3%).
                European session firmer. Today&apos;s catalysts: JPM earnings, CPI print, NVDA product launch.
              </p>
            </div>
            <button
              onClick={() => onNavigate("ai-agent")}
              className="rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
            >
              Ask AI Agent about today →
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Futures + global */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-50">
              <DollarSign className="h-4 w-4 text-amber-400" />
              US Futures (Pre-Market)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              As of 7:00 AM ET · snapshot
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {FUTURES.map((f) => {
              const up = f.changePct >= 0;
              return (
                <div key={f.name} className="rounded-md border border-slate-700 bg-slate-900/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{f.name}</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-slate-100">
                    {f.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium tabular-nums",
                      up ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? "+" : ""}
                    {formatPct(f.changePct)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-50">
              <Globe2 className="h-4 w-4 text-cyan-400" />
              Global Markets Overnight
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Asian & European closes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Index</th>
                  <th className="px-4 py-2 text-right font-medium">Close</th>
                  <th className="px-4 py-2 text-right font-medium">Chg%</th>
                </tr>
              </thead>
              <tbody>
                {GLOBAL.map((g) => {
                  const up = g.changePct >= 0;
                  return (
                    <tr key={g.name} className="border-t border-slate-700/50">
                      <td className="px-4 py-2 text-slate-300">{g.name}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-100">
                        {g.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums font-medium",
                          up ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {up ? "+" : ""}
                        {formatPct(g.changePct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Movers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MoversCard
          title="Top Gainers (Pre-Mkt)"
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          rows={gainers}
          onSelect={onSelectTicker}
          tone="up"
        />
        <MoversCard
          title="Top Losers (Pre-Mkt)"
          icon={<TrendingDown className="h-4 w-4 text-rose-400" />}
          rows={losers}
          onSelect={onSelectTicker}
          tone="down"
        />
        <MoversCard
          title="Most Active"
          icon={<Activity className="h-4 w-4 text-cyan-400" />}
          rows={active}
          onSelect={onSelectTicker}
          tone="neutral"
        />
      </div>

      {/* News + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-50">
              <Newspaper className="h-4 w-4 text-amber-400" />
              News Catalysts
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Headlines tagged with ticker symbols
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {NEWS.map((n, i) => (
              <button
                key={i}
                onClick={() => onSelectTicker(n.ticker)}
                className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-slate-900/40"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-7 min-w-[3rem] items-center justify-center rounded px-1.5 font-mono text-xs font-bold",
                    n.sentiment === "positive"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : n.sentiment === "negative"
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-slate-500/15 text-slate-300"
                  )}
                >
                  {n.ticker}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-snug">{n.headline}</p>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{n.time} ET</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-50">
              <Bell className="h-4 w-4 text-violet-400" />
              Watchlist Alerts
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Signals triggered overnight
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AlertRow tone="up" ticker="AAPL" text="Price crossed above $225 resistance (now $226.40)" onClick={() => onSelectTicker("AAPL")} />
            <AlertRow tone="up" ticker="MSFT" text="MACD bullish crossover on daily chart" onClick={() => onSelectTicker("MSFT")} />
            <AlertRow tone="down" ticker="AMZN" text="Broke 50d SMA on 1.4x avg volume" onClick={() => onSelectTicker("AMZN")} />
            <AlertRow tone="warn" ticker="TSLA" text="RSI < 30 — oversold; bounce setup forming" onClick={() => onSelectTicker("TSLA")} />
            <AlertRow tone="up" ticker="NVDA" text="Gap up pre-market; volume surge 2.4x" onClick={() => onSelectTicker("NVDA")} />
            <AlertRow tone="warn" ticker="META" text="Approaching upper Bollinger Band ($565)" onClick={() => onSelectTicker("META")} />
            <AlertRow tone="down" ticker="INTC" text="Below $23 support; downside risk to $20" onClick={() => onSelectTicker("INTC")} />
          </CardContent>
        </Card>
      </div>

      {/* Economic calendar */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-50">
            <Flame className="h-4 w-4 text-amber-400" />
            Today&apos;s Economic Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Time (ET)</th>
                <th className="px-4 py-2 text-left font-medium">Event</th>
                <th className="px-4 py-2 text-left font-medium">Consensus</th>
                <th className="px-4 py-2 text-left font-medium">Prior</th>
                <th className="px-4 py-2 text-left font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              <CalRow time="8:30 AM" event="CPI YoY" consensus="2.6%" prior="2.9%" impact="High" />
              <CalRow time="8:30 AM" event="Core CPI MoM" consensus="0.3%" prior="0.4%" impact="High" />
              <CalRow time="10:00 AM" event="JPMorgan Q3 EPS" consensus="$4.06" prior="$4.37" impact="High" />
              <CalRow time="10:30 AM" event="Crude Oil Inventories" consensus="-1.8M" prior="+3.9M" impact="Med" />
              <CalRow time="2:00 PM" event="FOMC Minutes" consensus="—" prior="—" impact="High" />
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
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
  rows: ReturnType<typeof getAllTickers>;
  onSelect: (t: string) => void;
  tone: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-50">{icon}{title}</CardTitle>
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
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-500 hidden sm:table-cell">
                    {formatNumber(t.volume, { compact: true })}
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

function AlertRow({
  tone,
  ticker,
  text,
  onClick,
}: {
  tone: "up" | "down" | "warn";
  ticker: string;
  text: string;
  onClick: () => void;
}) {
  const accent =
    tone === "up"
      ? "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/20"
      : tone === "down"
        ? "border-rose-700/40 bg-rose-900/10 hover:bg-rose-900/20"
        : "border-amber-700/40 bg-amber-900/10 hover:bg-amber-900/20";
  const dot =
    tone === "up" ? "bg-emerald-400" : tone === "down" ? "bg-rose-400" : "bg-amber-400";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border p-2.5 text-left text-xs transition-colors",
        accent
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      <span className="font-mono font-semibold text-slate-100">{ticker}</span>
      <span className="flex-1 text-slate-300">{text}</span>
    </button>
  );
}

function CalRow({
  time,
  event,
  consensus,
  prior,
  impact,
}: {
  time: string;
  event: string;
  consensus: string;
  prior: string;
  impact: string;
}) {
  return (
    <tr className="border-t border-slate-700/50">
      <td className="px-4 py-2 font-mono text-xs text-slate-400">{time}</td>
      <td className="px-4 py-2 text-slate-200">{event}</td>
      <td className="px-4 py-2 font-mono tabular-nums text-slate-100">{consensus}</td>
      <td className="px-4 py-2 font-mono tabular-nums text-slate-400">{prior}</td>
      <td className="px-4 py-2">
        <Badge
          variant="outline"
          className={cn(
            impact === "High"
              ? "border-rose-700/60 bg-rose-900/20 text-rose-300"
              : "border-amber-700/60 bg-amber-900/20 text-amber-300"
          )}
        >
          {impact}
        </Badge>
      </td>
    </tr>
  );
}
