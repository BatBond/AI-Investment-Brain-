"use client";

import { useEffect, useRef, useState } from "react";

export interface PortfolioPositionUpdate {
  id: string;
  symbol: string;
  description: string;
  quantity: number;
  avgCostBasis: number;
  costBasisTotal: number;
  type: string;
  livePrice: number;
  previousClose: number;
  changeAbs: number;
  changePct: number;
  marketValue: number;
  todayPnl: number;
  todayPnlPct: number;
  totalPnl: number;
  totalPnlPct: number;
  percentOfAccount: number;
  dayVolume: number;
  isLive: boolean;
  _priceChanged?: "up" | "down" | null;
}

export interface PortfolioTotals {
  costBasis: number;
  marketValue: number;
  todayPnl: number;
  todayPnlPct: number;
  totalPnl: number;
  totalPnlPct: number;
  liveCount: number;
  totalCount: number;
  dayLow: number;
  dayHigh: number;
}

export interface PortfolioStreamResponse {
  positions: PortfolioPositionUpdate[];
  totals: PortfolioTotals;
  timestamp: number;
}

export interface WatchlistItemUpdate {
  id: string;
  symbol: string;
  name?: string | null;
  notes?: string | null;
  price: number;
  changeAbs: number;
  changePct: number;
  isLive: boolean;
  addedAt: string;
}

export interface WatchlistStreamResponse {
  items: WatchlistItemUpdate[];
  timestamp: number;
}

interface StreamState<D> {
  data: D | null;
  lastUpdate: number;
  error: string | null;
  loading: boolean;
}

function useStream<D>(endpoint: string, intervalMs: number): StreamState<D> {
  const [state, setState] = useState<StreamState<D>>({
    data: null,
    lastUpdate: 0,
    error: null,
    loading: true,
  });
  const prevPricesRef = useRef<Record<string, number>>({});
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const update = (await res.json()) as D & {
          positions?: PortfolioPositionUpdate[];
        };
        if (!activeRef.current) return;
        // Track price changes for flash effect on portfolio positions
        if (update.positions) {
          update.positions.forEach((p) => {
            const prev = prevPricesRef.current[p.symbol];
            if (prev !== undefined && p.livePrice !== prev) {
              p._priceChanged = p.livePrice > prev ? "up" : "down";
            } else {
              p._priceChanged = null;
            }
            prevPricesRef.current[p.symbol] = p.livePrice;
          });
        }
        setState({
          data: update as D,
          lastUpdate: Date.now(),
          error: null,
          loading: false,
        });
      } catch (e) {
        if (!activeRef.current) return;
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : String(e),
          loading: false,
        }));
      } finally {
        if (activeRef.current) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      }
    }
    poll();
    return () => {
      activeRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [endpoint, intervalMs]);

  return state;
}

export function usePortfolioStream() {
  return useStream<PortfolioStreamResponse>("/api/portfolio/stream", 2000);
}

export function useWatchlistStream() {
  return useStream<WatchlistStreamResponse>("/api/watchlist/stream", 2000);
}
