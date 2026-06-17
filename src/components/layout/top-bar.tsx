"use client";

import { useEffect, useState } from "react";
import { Menu, Settings, Activity } from "lucide-react";
import { SECTION_MAP, type SectionId } from "@/lib/sections";
import { cn } from "@/lib/utils";

interface TickerTapeItem {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
  isLive: boolean;
}

interface TopBarProps {
  activeSection: SectionId;
  onMenuClick: () => void;
  showMenu: boolean;
}

export function TopBar({ activeSection, onMenuClick, showMenu }: TopBarProps) {
  const section = SECTION_MAP[activeSection];
  const [now, setNow] = useState<Date | null>(null);
  const [tape, setTape] = useState<TickerTapeItem[]>([]);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/market/indices", { cache: "no-store" });
        const data = await r.json();
        if (cancelled) return;
        const items: TickerTapeItem[] = (data.items || []).map((i: TickerTapeItem & { symbol: string; label: string; price: number; changePct: number; isLive: boolean }) => ({
          symbol: i.symbol,
          label: i.label,
          price: i.price,
          changePct: i.changePct,
          isLive: i.isLive,
        }));
        setTape(items);
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
  }, []);

  const marketOpen = now
    ? (() => {
        const day = now.getDay();
        const totalMin = now.getHours() * 60 + now.getMinutes();
        const isWeekday = day >= 1 && day <= 5;
        return isWeekday && totalMin >= 570 && totalMin <= 960;
      })()
    : false;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-3">
        {showMenu && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-amber-300"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="min-w-0 shrink-0">
          <div className="text-sm font-semibold text-slate-50 leading-none truncate">
            {section?.label}
          </div>
          <div className="text-[10px] text-amber-400/80 truncate">
            {section?.firm ? `${section.firm} · ` : ""}
            AI Investment Brain
          </div>
        </div>

        {/* Ticker tape */}
        <div className="flex-1 overflow-hidden mx-2 hidden sm:block">
          <div className="flex items-center gap-4 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tape.length === 0 ? (
              <span className="text-[10px] text-slate-500">Loading tape…</span>
            ) : (
              tape.map((t) => {
                const up = t.changePct >= 0;
                return (
                  <div
                    key={t.symbol}
                    className="flex shrink-0 items-center gap-1.5 text-[11px]"
                  >
                    <span className="text-slate-500">{t.label}</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatPrice(t)}
                    </span>
                    <span
                      className={cn(
                        "font-mono tabular-nums font-medium",
                        up ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {up ? "+" : ""}
                      {t.changePct.toFixed(2)}%
                    </span>
                    {t.isLive && (
                      <span className="rounded-sm bg-emerald-900/40 px-0.5 text-[8px] font-bold text-emerald-400">
                        LIVE
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-300">
            <Activity className="h-3 w-3 text-cyan-400" />
            {now ? now.toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium",
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
            <span className="hidden sm:inline">
              {marketOpen ? "Open" : "Closed"}
            </span>
          </span>
          <button
            aria-label="Settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-amber-300"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function formatPrice(t: TickerTapeItem): string {
  if (t.symbol === "^TNX") return `${t.price.toFixed(3)}%`;
  if (t.price > 1000) return t.price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return t.price.toFixed(2);
}
