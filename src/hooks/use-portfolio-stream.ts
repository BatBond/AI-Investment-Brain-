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
  /** True when this position's price came from client-side interpolation, not a real poll. */
  _interpolated?: boolean;
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

type StreamStatus = "polling" | "interpolating" | "stale";

interface PortfolioStreamState {
  data: PortfolioStreamResponse | null;
  lastUpdate: number; // ms timestamp of last real poll
  status: StreamStatus;
  error: string | null;
  loading: boolean;
}

interface WatchlistStreamState {
  data: WatchlistStreamResponse | null;
  lastUpdate: number;
  error: string | null;
  loading: boolean;
}

/** Polls /api/portfolio/stream every 1s and applies client-side interpolation
 *  between polls (random walk ±0.01% per tick) to give a "live ticker" feel.
 *  Real polls overwrite interpolated prices and trigger flash animations. */
export function usePortfolioStream(): PortfolioStreamState {
  const [state, setState] = useState<PortfolioStreamState>({
    data: null,
    lastUpdate: 0,
    status: "stale",
    error: null,
    loading: true,
  });

  const targetPricesRef = useRef<Record<string, number>>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const realPollRef = useRef<PortfolioStreamResponse | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // 1. Poll every 1 second.
  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const res = await fetch("/api/portfolio/stream", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const update = (await res.json()) as PortfolioStreamResponse;
        if (!active) return;
        // Track real price changes for flash effect
        update.positions.forEach((p) => {
          const prev = prevPricesRef.current[p.symbol];
          if (prev !== undefined && p.livePrice !== prev) {
            p._priceChanged = p.livePrice > prev ? "up" : "down";
          } else {
            p._priceChanged = null;
          }
          prevPricesRef.current[p.symbol] = p.livePrice;
          targetPricesRef.current[p.symbol] = p.livePrice;
          p._interpolated = false;
        });
        realPollRef.current = update;
        const now = Date.now();
        setState((s) => ({
          data: update,
          lastUpdate: now,
          status: "polling",
          error: null,
          loading: false,
        }));
      } catch (e) {
        if (!active) return;
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : String(e),
          loading: false,
        }));
      } finally {
        if (active) {
          timeoutId = setTimeout(poll, 1000);
        }
      }
    }
    poll();
    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 2. Client-side "live tick" interpolation between polls.
  useEffect(() => {
    function tick() {
      const real = realPollRef.current;
      const now = Date.now();
      const sincePoll = real ? now - real.timestamp : Infinity;
      if (real && sincePoll < 5000) {
        // Interpolate: tiny random walk around the target price
        const newPositions = real.positions.map((p) => {
          if (!p.livePrice) return p;
          const target = targetPricesRef.current[p.symbol] ?? p.livePrice;
          // 5% pull toward target each tick (mean-reverting)
          const drift = (target - p.livePrice) * 0.05;
          // ±0.01% noise
          const noise = (Math.random() - 0.5) * p.livePrice * 0.0001;
          const newPrice = p.livePrice + drift + noise;
          return {
            ...p,
            livePrice: newPrice,
            marketValue: newPrice * p.quantity,
            changeAbs: p.previousClose ? newPrice - p.previousClose : p.changeAbs,
            changePct: p.previousClose
              ? ((newPrice - p.previousClose) / p.previousClose) * 100
              : p.changePct,
            todayPnl: p.previousClose ? (newPrice - p.previousClose) * p.quantity : p.todayPnl,
            todayPnlPct: p.previousClose
              ? ((newPrice - p.previousClose) / p.previousClose) * 100
              : p.todayPnlPct,
            totalPnl: newPrice * p.quantity - p.costBasisTotal,
            totalPnlPct: p.costBasisTotal
              ? ((newPrice * p.quantity - p.costBasisTotal) / p.costBasisTotal) * 100
              : 0,
            _interpolated: true,
            _priceChanged: null, // never flash on interpolation
          };
        });
        const newTotals: PortfolioTotals = {
          ...real.totals,
          marketValue: newPositions.reduce((s, p) => s + (p.marketValue || 0), 0),
          todayPnl: newPositions.reduce((s, p) => s + (p.todayPnl || 0), 0),
          totalPnl: newPositions.reduce((s, p) => s + (p.totalPnl || 0), 0),
        };
        newTotals.todayPnlPct = newTotals.marketValue
          ? (newTotals.todayPnl / (newTotals.marketValue - newTotals.todayPnl)) * 100
          : 0;
        newTotals.totalPnlPct = newTotals.costBasis
          ? (newTotals.totalPnl / newTotals.costBasis) * 100
          : 0;
        setState((s) => ({
          ...s,
          data: { ...real, positions: newPositions, totals: newTotals, timestamp: now },
          status: sincePoll < 500 ? "polling" : "interpolating",
        }));
      } else if (real && sincePoll >= 10000) {
        // Stale: no poll in 10s — don't fake it
        setState((s) => (s.status === "stale" ? s : { ...s, status: "stale" }));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}

/** Watchlist stream — keeps the simple 2s polling (interpolation is overkill here). */
export function useWatchlistStream(): WatchlistStreamState {
  const [state, setState] = useState<WatchlistStreamState>({
    data: null,
    lastUpdate: 0,
    error: null,
    loading: true,
  });
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const res = await fetch("/api/watchlist/stream", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const update = (await res.json()) as WatchlistStreamResponse;
        if (!activeRef.current) return;
        setState({
          data: update,
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
          timeoutId = setTimeout(poll, 2000);
        }
      }
    }
    poll();
    return () => {
      activeRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
