"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Upload,
  Download,
  X,
  Search,
  Loader2,
  Eye,
  Trash2,
  Activity,
  LayoutGrid,
  Table as TableIcon,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Treemap,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/lib/sections";
import {
  usePortfolioStream,
  useWatchlistStream,
  type PortfolioPositionUpdate,
  type PortfolioStreamResponse,
} from "@/hooks/use-portfolio-stream";

interface PortfolioProps {
  onNavigate: (id: SectionId, ticker?: string) => void;
  onSelectTicker: (ticker: string) => void;
}

// ── Color helpers ────────────────────────────────────────────────────

/** HSL color from red (0) → gray → green (120) based on % change.
 *  Clamps input to ±3%. */
function heatColor(pct: number): string {
  const clamped = Math.max(-3, Math.min(3, pct));
  if (Math.abs(clamped) < 0.05) {
    // gray
    return "hsl(220, 8%, 30%)";
  }
  // Positive: green hue 120; Negative: red hue 0
  // Saturation ramps with magnitude
  const intensity = Math.abs(clamped) / 3; // 0..1
  const hue = clamped > 0 ? 140 : 0;
  const sat = 30 + intensity * 55; // 30..85
  const light = 25 + intensity * 25; // 25..50
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function textColorFor(pct: number): string {
  const a = Math.abs(pct);
  if (a < 0.4) return "#cbd5e1"; // slate-300
  return a > 1.5 ? "#ffffff" : "#f1f5f9";
}

const fmtMoney = (n: number, dp = 2) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
const fmtPct = (n: number, dp = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`;
const fmtNum = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

// ── Sparkline for KPI cards (last 60 updates) ────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="h-[30px]" />;
  }
  return (
    <div className="h-[30px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  subUp,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subUp?: boolean;
  sparkData: number[];
  sparkColor: string;
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/60 overflow-hidden">
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <div className="mt-1 font-mono text-2xl tabular-nums font-bold text-slate-50">
          {value}
        </div>
        {sub && (
          <div
            className={cn(
              "mt-0.5 text-xs font-medium flex items-center gap-1",
              subUp ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {subUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {sub}
          </div>
        )}
        <div className="mt-2">
          <MiniSparkline data={sparkData} color={sparkColor} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Summary strip ────────────────────────────────────────────────────
function SummaryStrip({ data }: { data: PortfolioStreamResponse }) {
  const [totalMvHistory, setTotalMvHistory] = useState<number[]>([]);
  const [todayPnlHistory, setTodayPnlHistory] = useState<number[]>([]);
  const [totalPnlHistory, setTotalPnlHistory] = useState<number[]>([]);
  const [dayRangeHistory, setDayRangeHistory] = useState<number[]>([]);

  // Track rolling 60-update history
  useEffect(() => {
    const push = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, arr: T[], v: T): T[] => {
      const next = [...arr, v];
      if (next.length > 60) next.shift();
      return next;
    };
    setTotalMvHistory((prev) => push(setTotalMvHistory, prev, data.totals.marketValue));
    setTodayPnlHistory((prev) => push(setTodayPnlHistory, prev, data.totals.todayPnl));
    setTotalPnlHistory((prev) => push(setTotalPnlHistory, prev, data.totals.totalPnl));
    setDayRangeHistory((prev) =>
      push(setDayRangeHistory, prev, (data.totals.dayLow + data.totals.dayHigh) / 2)
    );
  }, [data]);

  const todayUp = data.totals.todayPnl >= 0;
  const totalUp = data.totals.totalPnl >= 0;
  const liveCount = data.totals.liveCount;
  const totalCount = data.totals.totalCount;
  const range = data.totals.dayHigh - data.totals.dayLow;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total Market Value"
        value={fmtMoney(data.totals.marketValue)}
        sub={`${liveCount}/${totalCount} LIVE`}
        subUp={true}
        sparkData={totalMvHistory}
        sparkColor="#22d3ee"
      />
      <KpiCard
        label="Today's P&L"
        value={`${todayUp ? "+" : ""}${fmtMoney(data.totals.todayPnl)}`}
        sub={fmtPct(data.totals.todayPnlPct)}
        subUp={todayUp}
        sparkData={todayPnlHistory}
        sparkColor={todayUp ? "#10b981" : "#ef4444"}
      />
      <KpiCard
        label="Total P&L"
        value={`${totalUp ? "+" : ""}${fmtMoney(data.totals.totalPnl)}`}
        sub={fmtPct(data.totals.totalPnlPct)}
        subUp={totalUp}
        sparkData={totalPnlHistory}
        sparkColor={totalUp ? "#10b981" : "#ef4444"}
      />
      <KpiCard
        label="Day Range"
        value={fmtMoney(range, 0)}
        sub={`${fmtMoney(data.totals.dayLow, 0)} – ${fmtMoney(data.totals.dayHigh, 0)}`}
        subUp={true}
        sparkData={dayRangeHistory}
        sparkColor="#a78bfa"
      />
    </div>
  );
}

// ── Heatmap tile ─────────────────────────────────────────────────────
function HeatTile({
  p,
  onClick,
}: {
  p: PortfolioPositionUpdate;
  onClick: () => void;
}) {
  const bg = heatColor(p.changePct);
  const fg = textColorFor(p.changePct);
  const up = p.changePct >= 0;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="heatmap-tile relative flex flex-col items-center justify-center rounded-md border border-slate-900/80 px-2 py-1.5 text-center min-w-[80px] min-h-[60px]"
            style={{ backgroundColor: bg, color: fg }}
          >
            <div className="text-sm font-bold leading-none">{p.symbol}</div>
            <div className="mt-1 text-xs font-mono tabular-nums leading-none">
              {up ? "+" : ""}
              {p.changePct.toFixed(2)}%
            </div>
            <div className="mt-0.5 text-[10px] font-mono tabular-nums leading-none opacity-90">
              {up ? "+" : ""}
              {fmtMoney(p.todayPnl, 0)}
            </div>
            {!p.isLive && (
              <span className="absolute top-0.5 right-0.5 text-[7px] text-slate-400/70">
                ◐
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border border-slate-700 text-slate-100 text-xs">
          <div className="font-bold text-amber-300">{p.symbol}</div>
          <div className="text-slate-300">{p.description}</div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums">
            <span className="text-slate-400">Qty:</span>
            <span>{p.quantity}</span>
            <span className="text-slate-400">Avg cost:</span>
            <span>{fmtMoney(p.avgCostBasis)}</span>
            <span className="text-slate-400">Last:</span>
            <span>{fmtMoney(p.livePrice)}</span>
            <span className="text-slate-400">Mkt val:</span>
            <span>{fmtMoney(p.marketValue, 0)}</span>
            <span className="text-slate-400">Today:</span>
            <span className={up ? "text-emerald-400" : "text-rose-400"}>
              {up ? "+" : ""}
              {fmtMoney(p.todayPnl, 0)} ({fmtPct(p.todayPnlPct)})
            </span>
            <span className="text-slate-400">Total:</span>
            <span className={p.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {p.totalPnl >= 0 ? "+" : ""}
              {fmtMoney(p.totalPnl, 0)} ({fmtPct(p.totalPnlPct)})
            </span>
            <span className="text-slate-400">% acct:</span>
            <span>{p.percentOfAccount.toFixed(2)}%</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Portfolio Heatmap ────────────────────────────────────────────────
function PortfolioHeatmap({
  positions,
  onSelectTicker,
}: {
  positions: PortfolioPositionUpdate[];
  onSelectTicker: (s: string) => void;
}) {
  // Group tiny positions (<1.5% of account) into "Others"
  const { main, others } = useMemo(() => {
    const main: PortfolioPositionUpdate[] = [];
    const others: PortfolioPositionUpdate[] = [];
    let othersMv = 0;
    let othersTodayPnl = 0;
    positions.forEach((p) => {
      if (p.percentOfAccount < 1.5) {
        others.push(p);
        othersMv += p.marketValue;
        othersTodayPnl += p.todayPnl;
      } else {
        main.push(p);
      }
    });
    return { main, others: othersMv > 0 ? [{ mv: othersMv, pnl: othersTodayPnl, count: others.length }] : [] };
  }, [positions]);

  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <Activity className="h-4 w-4 text-amber-400" />
          Real-Time P&amp;L Heatmap
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Tile size ∝ position market value · color = today&apos;s % change (±3%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No positions. Add one to see the heatmap.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {main.map((p) => (
              <HeatTile
                key={p.symbol}
                p={p}
                onClick={() => onSelectTicker(p.symbol)}
              />
            ))}
            {others.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="heatmap-tile flex flex-col items-center justify-center rounded-md border border-slate-900/80 px-2 py-1.5 text-center min-w-[80px] min-h-[60px]"
                      style={{
                        backgroundColor: heatColor(others[0].mv > 0 ? 0.5 : -0.5),
                        color: "#f1f5f9",
                      }}
                    >
                      <div className="text-sm font-bold leading-none">
                        +{others[0].count} Others
                      </div>
                      <div className="mt-1 text-xs font-mono tabular-nums leading-none">
                        {fmtMoney(others[0].mv, 0)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border border-slate-700 text-slate-100 text-xs">
                    Smallest {others[0].count} positions grouped
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Market Heatmap (sector ETFs) ─────────────────────────────────────
interface MarketHeatTile {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  isLive: boolean;
}

function MarketHeatmap({
  tiles,
  onSelectTicker,
}: {
  tiles: MarketHeatTile[];
  onSelectTicker: (s: string) => void;
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <LayoutGrid className="h-4 w-4 text-cyan-400" />
          Market Heatmap — Sector ETFs
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          S&amp;P 500 sector ETFs · live from Yahoo Finance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tiles.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">Loading market heatmap…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {tiles.map((t) => {
              const bg = heatColor(t.changePct);
              const fg = textColorFor(t.changePct);
              const up = t.changePct >= 0;
              return (
                <TooltipProvider key={t.symbol}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectTicker(t.symbol)}
                        className="heatmap-tile flex flex-col items-start justify-between rounded-md border border-slate-900/80 px-2 py-1.5 text-left min-w-[80px] min-h-[60px]"
                        style={{ backgroundColor: bg, color: fg }}
                      >
                        <div className="text-xs font-bold leading-none">
                          {t.symbol}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider opacity-80">
                          {t.name}
                        </div>
                        <div className="text-xs font-mono tabular-nums leading-none">
                          {up ? "+" : ""}
                          {t.changePct.toFixed(2)}%
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border border-slate-700 text-slate-100 text-xs">
                      <div className="font-bold text-amber-300">
                        {t.symbol} — {t.name}
                      </div>
                      <div className="font-mono tabular-nums">
                        Price: {fmtMoney(t.price)}
                      </div>
                      <div
                        className={cn(
                          "font-mono tabular-nums",
                          up ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        Change: {up ? "+" : ""}
                        {t.changePct.toFixed(2)}%
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Holdings Table ───────────────────────────────────────────────────
type SortKey =
  | "symbol"
  | "description"
  | "quantity"
  | "avgCostBasis"
  | "livePrice"
  | "marketValue"
  | "todayPnl"
  | "todayPnlPct"
  | "totalPnl"
  | "totalPnlPct"
  | "percentOfAccount";

function HoldingsTable({
  positions,
  onRemove,
  onSelectTicker,
  onAddToWatchlist,
  onAnalyzeWithAgent,
}: {
  positions: PortfolioPositionUpdate[];
  onRemove: (id: string, symbol: string) => void;
  onSelectTicker: (s: string) => void;
  onAddToWatchlist: (s: string) => void;
  onAnalyzeWithAgent: (s: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...positions];
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [positions, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <TableIcon className="h-4 w-4 text-emerald-400" />
          Holdings ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto rounded-md border border-slate-700 aib-scroll">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                {[
                  ["symbol", "Symbol"],
                  ["description", "Description"],
                  ["quantity", "Qty"],
                  ["avgCostBasis", "Avg Cost"],
                  ["livePrice", "Last"],
                  ["marketValue", "Mkt Value"],
                  ["todayPnl", "Today $"],
                  ["todayPnlPct", "Today %"],
                  ["totalPnl", "Total $"],
                  ["totalPnlPct", "Total %"],
                  ["percentOfAccount", "% Acct"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key as SortKey)}
                    className="px-2 py-2 text-left cursor-pointer hover:text-amber-300 select-none whitespace-nowrap"
                  >
                    {label}
                    {sortKey === key && (
                      <span className="ml-0.5 text-amber-400">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const up = p.todayPnl >= 0;
                const totalUp = p.totalPnl >= 0;
                return (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger asChild>
                      <tr className="border-t border-slate-700/60 hover:bg-slate-800/60">
                        <td className="px-2 py-1.5 font-bold text-amber-300 whitespace-nowrap">
                          <button
                            onClick={() => onSelectTicker(p.symbol)}
                            className="hover:underline"
                          >
                            {p.symbol}
                          </button>
                          {!p.isLive && (
                            <span className="ml-1 text-[8px] text-slate-500">
                              ◐
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-slate-300 max-w-[160px] truncate">
                          {p.description}
                        </td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">
                          {p.quantity}
                        </td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-300">
                          {fmtMoney(p.avgCostBasis)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 font-mono tabular-nums",
                            p._interpolated ? "text-slate-300" : "text-slate-100",
                            p._priceChanged === "up" && "flash-up",
                            p._priceChanged === "down" && "flash-down"
                          )}
                        >
                          {fmtMoney(p.livePrice)}
                          <span
                            className={cn(
                              "ml-1 text-[10px]",
                              p.changeAbs >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}
                          >
                            {p.changeAbs >= 0 ? "▲" : "▼"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">
                          {fmtMoney(p.marketValue, 0)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 font-mono tabular-nums",
                            up ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {up ? "+" : ""}
                          {fmtMoney(p.todayPnl, 0)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 font-mono tabular-nums",
                            up ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {fmtPct(p.todayPnlPct)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 font-mono tabular-nums",
                            totalUp ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {totalUp ? "+" : ""}
                          {fmtMoney(p.totalPnl, 0)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 font-mono tabular-nums",
                            totalUp ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {fmtPct(p.totalPnlPct)}
                        </td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-300">
                          {p.percentOfAccount.toFixed(2)}%
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            onClick={() => onRemove(p.id, p.symbol)}
                            className="text-slate-500 hover:text-rose-400"
                            title="Remove from portfolio"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="bg-slate-900 border-slate-700 text-slate-100 text-xs">
                      <ContextMenuItem
                        onClick={() => onSelectTicker(p.symbol)}
                        className="hover:bg-slate-800 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" /> View in Ticker Search
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onAnalyzeWithAgent(p.symbol)}
                        className="hover:bg-slate-800 cursor-pointer"
                      >
                        <Activity className="h-3.5 w-3.5 mr-2" /> Analyze with AI Agent
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onAddToWatchlist(p.symbol)}
                        className="hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-2" /> Add to Watchlist
                      </ContextMenuItem>
                      <ContextMenuSeparator className="bg-slate-700" />
                      <ContextMenuItem
                        onClick={() => onRemove(p.id, p.symbol)}
                        className="hover:bg-rose-900/40 text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from Portfolio
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Allocation Pie ───────────────────────────────────────────────────
const SECTOR_COLORS = [
  "#f59e0b", "#22d3ee", "#10b981", "#a78bfa", "#ef4444",
  "#f97316", "#ec4899", "#84cc16", "#06b6d4", "#fbbf24",
  "#8b5cf6", "#14b8a6", "#f43f5e", "#0ea5e9",
];

interface SectorData {
  sector: string;
  marketValue: number;
  percent: number;
  symbols: { symbol: string; marketValue: number }[];
}

function AllocationPie({ sectors }: { sectors: SectorData[] }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sectors.length > 0) setLoading(false);
  }, [sectors]);

  if (loading && sectors.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/40">
        <CardContent className="p-4 text-sm text-slate-500 text-center">
          Loading allocation…
        </CardContent>
      </Card>
    );
  }
  if (sectors.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/40">
        <CardContent className="p-4 text-sm text-slate-500 text-center">
          No positions to allocate.
        </CardContent>
      </Card>
    );
  }

  const pieData = sectors.map((s) => ({
    name: s.sector,
    value: s.marketValue,
    percent: s.percent,
  }));

  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <PieIcon className="h-4 w-4 text-violet-400" />
          Allocation by Sector
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={1}
                  stroke="#0f172a"
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, _name: string, item: { payload?: { percent?: number; name?: string } }) => [
                    `${fmtMoney(value, 0)} (${(item.payload?.percent ?? 0).toFixed(1)}%)`,
                    item.payload?.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {sectors.map((s, i) => (
              <div
                key={s.sector}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{
                    backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
                  }}
                />
                <span className="text-slate-300 flex-1 truncate">{s.sector}</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {fmtMoney(s.marketValue, 0)}
                </span>
                <span className="font-mono tabular-nums text-slate-400 w-12 text-right">
                  {s.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Watchlist Card ───────────────────────────────────────────────────
function WatchlistCard({
  items,
  onAdd,
  onRemove,
  onSelectTicker,
}: {
  items: { id: string; symbol: string; name?: string | null; price: number; changeAbs: number; changePct: number; isLive: boolean }[];
  onAdd: (symbol: string) => void;
  onRemove: (id: string) => void;
  onSelectTicker: (s: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch("/api/market/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const j = await r.json();
        setResults((j.results || []).slice(0, 8));
        setShowResults(true);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (sym: string) => {
    onAdd(sym);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <Card className="border-slate-700 bg-slate-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <Eye className="h-4 w-4 text-cyan-400" />
          Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Add to watchlist…"
              className="h-8 pl-7 pr-7 text-xs bg-slate-900/60 border-slate-700"
            />
            {searching && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-slate-500" />
            )}
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-xl max-h-60 overflow-auto aib-scroll">
              {results.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => pick(r.symbol)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-800"
                >
                  <span className="font-bold text-amber-300">{r.symbol}</span>
                  <span className="text-slate-400 truncate flex-1">{r.name}</span>
                  <Plus className="h-3 w-3 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1 max-h-[280px] overflow-y-auto aib-scroll">
          {items.length === 0 && (
            <div className="text-xs text-slate-500 py-3 text-center">
              No watchlist items yet.
            </div>
          )}
          {items.map((it) => {
            const up = it.changePct >= 0;
            return (
              <div
                key={it.id}
                className="group flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 hover:border-slate-600"
              >
                <button
                  onClick={() => onSelectTicker(it.symbol)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                >
                  <span className="text-xs font-bold text-amber-300 w-12 shrink-0">
                    {it.symbol}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate flex-1">
                    {it.name || ""}
                  </span>
                  <span className="font-mono tabular-nums text-xs text-slate-200">
                    {it.price > 0 ? fmtMoney(it.price) : "—"}
                  </span>
                  <span
                    className={cn(
                      "font-mono tabular-nums text-[10px] w-14 text-right",
                      up ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {up ? "+" : ""}
                    {it.changePct.toFixed(2)}%
                  </span>
                </button>
                <button
                  onClick={() => onRemove(it.id)}
                  className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Add Position Dialog ──────────────────────────────────────────────
function AddPositionDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [type, setType] = useState("Cash");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch("/api/market/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const j = await r.json();
        setResults((j.results || []).slice(0, 8));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (sym: string, name: string) => {
    setSymbol(sym);
    setQuery(`${sym} — ${name}`);
    setResults([]);
  };

  const submit = async () => {
    if (!symbol || !quantity || !avgCost) {
      toast.error("Fill in symbol, quantity, and avg cost basis");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/portfolio/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          quantity: parseFloat(quantity),
          avgCostBasis: parseFloat(avgCost),
          type,
        }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Failed to add position");
      }
      toast.success(`Added ${symbol} to portfolio`);
      setOpen(false);
      setSymbol("");
      setQuery("");
      setQuantity("");
      setAvgCost("");
      setType("Cash");
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Position
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Portfolio Position</DialogTitle>
          <DialogDescription className="text-slate-400">
            Search any ticker via Yahoo Finance, then enter your holding details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="add-symbol" className="text-xs text-slate-400">
              Symbol
            </Label>
            <div className="relative">
              <Input
                id="add-symbol"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSymbol("");
                }}
                placeholder="Type a name or ticker (e.g. Tesla, AAPL)"
                className="bg-slate-800/60 border-slate-700 text-sm"
              />
              {searching && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-500" />
              )}
              {results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-xl max-h-60 overflow-auto aib-scroll">
                  {results.map((r) => (
                    <button
                      key={r.symbol}
                      onClick={() => pick(r.symbol, r.name)}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-800"
                    >
                      <span className="font-bold text-amber-300">{r.symbol}</span>
                      <span className="text-slate-400 truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {symbol && (
              <div className="text-[11px] text-emerald-400 mt-0.5">
                Selected: <span className="font-mono font-bold">{symbol}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="add-qty" className="text-xs text-slate-400">
                Quantity
              </Label>
              <Input
                id="add-qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
                step="any"
                placeholder="100"
                className="bg-slate-800/60 border-slate-700 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-cost" className="text-xs text-slate-400">
                Avg Cost Basis
              </Label>
              <Input
                id="add-cost"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                type="number"
                step="any"
                placeholder="150.00"
                className="bg-slate-800/60 border-slate-700 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-type" className="text-xs text-slate-400">
              Type
            </Label>
            <select
              id="add-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="Cash">Cash</option>
              <option value="Margin">Margin</option>
              <option value="Short">Short</option>
              <option value="Option">Option</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={submitting || !symbol}
            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-1" />
            )}
            Add Position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import / Export buttons ──────────────────────────────────────────
function ImportExportButtons({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/portfolio/import", {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Import failed");
      toast.success(
        `Imported ${j.upserted} positions (${j.totalParsed} rows parsed)`
      );
      onImported();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleExport = () => {
    window.open("/api/portfolio/export", "_blank");
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImport(f);
        }}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8"
      >
        {importing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <Upload className="h-3.5 w-3.5 mr-1" />
        )}
        Import
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8"
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        Export CSV
      </Button>
    </div>
  );
}

// ── Main Portfolio section ───────────────────────────────────────────
export function Portfolio({ onNavigate, onSelectTicker }: PortfolioProps) {
  const portfolioStream = usePortfolioStream();
  const watchlistStream = useWatchlistStream();
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [marketHeat, setMarketHeat] = useState<MarketHeatTile[]>([]);
  const [scanTick, setScanTick] = useState(0);

  // Refresh allocation whenever portfolio totals change substantially
  const lastMvRef = useRef(0);
  useEffect(() => {
    if (!portfolioStream.data) return;
    const mv = portfolioStream.data.totals.marketValue;
    // refetch allocation if market value drifts by >2% or scanTick changes
    if (Math.abs(mv - lastMvRef.current) / Math.max(lastMvRef.current || 1, 1) > 0.02 || scanTick > 0) {
      lastMvRef.current = mv;
    }
  }, [portfolioStream.data, scanTick]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/portfolio/allocation", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled && j.sectors) setSectors(j.sectors);
      } catch {
        // ignore
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [portfolioStream.data?.totals.totalCount, scanTick]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/portfolio/heatmap", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled && j.tiles) setMarketHeat(j.tiles);
      } catch {
        // ignore
      }
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const onRemove = useCallback(async (id: string, symbol: string) => {
    try {
      const r = await fetch(`/api/portfolio/holdings/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to remove");
      toast.success(`Removed ${symbol} from portfolio`);
      setScanTick((t) => t + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onAddToWatchlist = useCallback(async (symbol: string) => {
    try {
      const r = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!r.ok) throw new Error("Failed to add");
      toast.success(`Added ${symbol} to watchlist`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onRemoveWatch = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to remove");
      toast.success("Removed from watchlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onAnalyzeWithAgent = useCallback(
    (symbol: string) => {
      onNavigate("ai-agent", symbol);
    },
    [onNavigate]
  );

  const data = portfolioStream.data;
  const loading = portfolioStream.loading && !data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-50">Portfolio</h1>
            {data && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  portfolioStream.status === "stale"
                    ? "border-amber-700/60 bg-amber-900/20 text-amber-300"
                    : portfolioStream.status === "interpolating"
                      ? "border-cyan-700/60 bg-cyan-900/20 text-cyan-300"
                      : "border-emerald-700/60 bg-emerald-900/30 text-emerald-300"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full mr-1",
                    portfolioStream.status === "stale"
                      ? "bg-amber-400"
                      : portfolioStream.status === "interpolating"
                        ? "bg-cyan-400 animate-pulse"
                        : "bg-emerald-400 live-dot"
                  )}
                />
                {portfolioStream.status === "stale"
                  ? `STALE · last ${Math.max(0, Math.round((Date.now() - portfolioStream.lastUpdate) / 1000))}s ago`
                  : portfolioStream.status === "interpolating"
                    ? "LIVE · interpolating"
                    : `LIVE · polling · ${data.totals.liveCount}/${data.totals.totalCount}`}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time P&amp;L · 1-second polling with client-side interpolation · Yahoo Finance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddPositionDialog onAdded={() => setScanTick((t) => t + 1)} />
          <ImportExportButtons onImported={() => setScanTick((t) => t + 1)} />
        </div>
      </div>

      {loading && (
        <Card className="border-slate-700 bg-slate-800/40">
          <CardContent className="p-8 text-center text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading live portfolio data…
          </CardContent>
        </Card>
      )}

      {!loading && !data && (
        <Card className="border-amber-700/50 bg-amber-950/20">
          <CardContent className="p-8">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-amber-200 font-semibold mb-1">
                  No portfolio data available
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  {portfolioStream.error
                    ? `API error: ${portfolioStream.error}`
                    : "Your portfolio is empty or the database isn't connected."}
                </p>
                <div className="text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Make sure <code className="px-1 py-0.5 bg-slate-800 rounded text-amber-300">DATABASE_URL</code> is set in
                      Vercel env vars (PostgreSQL connection string)
                    </li>
                    <li>
                      Push the schema: <code className="px-1 py-0.5 bg-slate-800 rounded text-amber-300">DATABASE_URL="..." bun run db:push</code>
                    </li>
                    <li>
                      Seed your portfolio: <code className="px-1 py-0.5 bg-slate-800 rounded text-amber-300">DATABASE_URL="..." node scripts/seed-portfolio-prod.js</code>
                    </li>
                  </ol>
                  <p className="mt-3 text-slate-500">
                    Or click <strong className="text-slate-300">Add Position</strong> above to manually add holdings.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.positions.length === 0 && (
        <Card className="border-slate-700 bg-slate-800/40">
          <CardContent className="p-8 text-center">
            <Wallet className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-300 mb-1">Your portfolio is empty.</p>
            <p className="text-xs text-slate-500">
              Click <strong className="text-amber-300">Add Position</strong> above to start tracking holdings,
              or use <strong className="text-amber-300">Import</strong> to upload an xlsx.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.positions.length > 0 && (
        <>
          <SummaryStrip data={data} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <PortfolioHeatmap
                positions={data.positions}
                onSelectTicker={onSelectTicker}
              />
              <MarketHeatmap tiles={marketHeat} onSelectTicker={onSelectTicker} />
              <HoldingsTable
                positions={data.positions}
                onRemove={onRemove}
                onSelectTicker={onSelectTicker}
                onAddToWatchlist={onAddToWatchlist}
                onAnalyzeWithAgent={onAnalyzeWithAgent}
              />
            </div>
            <div className="space-y-4">
              <WatchlistCard
                items={watchlistStream.data?.items || []}
                onAdd={onAddToWatchlist}
                onRemove={onRemoveWatch}
                onSelectTicker={onSelectTicker}
              />
              <AllocationPie sectors={sectors} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
