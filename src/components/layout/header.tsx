"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  searchTickers,
  formatCurrency,
  formatPct,
  type TickerData,
} from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSelectTicker: (ticker: string) => void;
  onOpenTickerSearch: () => void;
}

export function Header({ onSelectTicker, onOpenTickerSearch }: HeaderProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // hydrate time on client to avoid SSR mismatch
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const results = useMemo<TickerData[]>(() => {
    if (!query.trim()) return [];
    return searchTickers(query, 8);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setOpen(false);
      return;
    }
    // Close if user typed something that yields no results
    if (results.length === 0) setOpen(false);
  }, [query, results]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const marketOpen = now
    ? (() => {
        const day = now.getDay();
        const hours = now.getHours();
        const mins = now.getMinutes();
        const totalMin = hours * 60 + mins;
        const isWeekday = day >= 1 && day <= 5;
        const isSession = totalMin >= 570 && totalMin <= 960; // 9:30 - 16:00 ET (mock local)
        return isWeekday && isSession;
      })()
    : false;

  function pick(t: TickerData) {
    setQuery("");
    setOpen(false);
    onSelectTicker(t.symbol);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:gap-4 sm:px-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-slate-950 font-black">
            AI
          </div>
          <div className="hidden sm:block leading-none">
            <div className="text-[15px] font-bold tracking-tight text-slate-50">
              AI Investment Brain
            </div>
            <div className="text-[10px] uppercase tracking-widest text-amber-400">
              Equity Research Terminal
            </div>
          </div>
        </div>

        {/* Search */}
        <div ref={boxRef} className="relative flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(!!e.target.value.trim());
              }}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search ticker (AAPL, MSFT, NVDA...) or company name"
              className="h-9 bg-slate-800/70 border-slate-700 pl-9 font-mono text-sm text-slate-100 placeholder:text-slate-500"
              aria-label="Search tickers"
            />
            <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-400">
              ↵
            </kbd>
          </div>
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
              {results.map((t) => {
                const up = t.changePct >= 0;
                return (
                  <button
                    key={t.symbol}
                    onClick={() => pick(t)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          {t.symbol}
                        </span>
                        <span className="truncate text-xs text-slate-400">
                          {t.name}
                        </span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        {t.exchange} · {t.sector}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm tabular-nums text-slate-100">
                        {formatCurrency(t.price)}
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 text-xs font-medium tabular-nums",
                          up ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {up ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {up ? "+" : ""}
                        {formatPct(t.changePct)}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenTickerSearch();
                }}
                className="block w-full border-t border-slate-700 px-3 py-2 text-center text-xs text-amber-400 hover:bg-slate-800/80"
              >
                Open full ticker search →
              </button>
            </div>
          )}
        </div>

        {/* Status pills */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            <Activity className="h-3 w-3 text-cyan-400" />
            {now
              ? now.toLocaleTimeString("en-US", { hour12: false })
              : "--:--:--"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              marketOpen
                ? "border-emerald-700/60 bg-emerald-900/30 text-emerald-300"
                : "border-rose-700/60 bg-rose-900/30 text-rose-300"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full live-dot",
                marketOpen ? "bg-emerald-400" : "bg-rose-400"
              )}
            />
            {marketOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
      </div>
    </header>
  );
}
