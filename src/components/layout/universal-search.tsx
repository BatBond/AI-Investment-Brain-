"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
  typeDisp: string;
}

interface UniversalSearchProps {
  collapsed?: boolean;
  onSelect: (symbol: string) => void;
}

export function UniversalSearch({ collapsed, onSelect }: UniversalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [hi, setHi] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      setIsLive(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/market/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = await r.json();
        if (cancelled) return;
        const items: SearchResult[] = data.results ?? [];
        // If the API returned mock fallback (no quoteType filter result names match)
        // we still know it's live unless the provider flagged it.
        const liveFlag = data.error ? false : true;
        setIsLive(liveFlag && items.length > 0);
        setResults(items);
        setOpen(items.length > 0);
        setHi(-1);
      } catch {
        if (!cancelled) {
          setResults([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Click-outside close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(r: SearchResult) {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(r.symbol);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = hi >= 0 ? results[hi] : results[0];
      if (target) pick(target);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={() => inputRef.current?.focus()}
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-amber-300 hover:border-amber-500/60"
        title="Search tickers"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search any ticker…"
          className="h-8 bg-slate-800/70 border-slate-700 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500"
          aria-label="Search tickers (live)"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-amber-400" />
        )}
        {!loading && query && isLive && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-400">
            LIVE
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${i}`}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(r)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition-colors",
                i === hi ? "bg-slate-800" : "hover:bg-slate-800/60"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {r.symbol}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    {r.typeDisp}
                  </span>
                </div>
                <div className="truncate text-[11px] text-slate-400">{r.name}</div>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-500 shrink-0">
                <TrendingUp className="h-2.5 w-2.5" />
                {r.exchange || "—"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
