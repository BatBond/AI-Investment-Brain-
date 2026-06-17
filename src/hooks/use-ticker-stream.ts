"use client";

import { useEffect, useRef, useState } from "react";

export interface TickerStreamData {
  symbol: string;
  price: number;
  changeAbs: number;
  changePct: number;
  dayLow: number;
  dayHigh: number;
  dayVolume: number;
  previousClose: number;
  isLive: boolean;
  timestamp: number;
}

interface TickerStreamState {
  data: TickerStreamData | null;
  status: "polling" | "interpolating" | "stale" | "loading";
  error: string | null;
}

/** Polls /api/ticker/[symbol]/stream every 500ms and applies client-side
 *  interpolation between polls for a smooth "live ticker" feel. */
export function useTickerStream(symbol: string | null | undefined): TickerStreamState {
  const [state, setState] = useState<TickerStreamState>({
    data: null,
    status: "loading",
    error: null,
  });

  const realRef = useRef<TickerStreamData | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Poll every 500ms when symbol changes
  useEffect(() => {
    if (!symbol) {
      setState({ data: null, status: "loading", error: null });
      realRef.current = null;
      return;
    }
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const res = await fetch(`/api/ticker/${encodeURIComponent(symbol!)}/stream`, {
          cache: "no-store",
        });
        if (!active) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TickerStreamData;
        realRef.current = data;
        setState({
          data,
          status: "polling",
          error: null,
        });
      } catch (e) {
        if (!active) return;
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : String(e),
        }));
      } finally {
        if (active) {
          timeoutId = setTimeout(poll, 500);
        }
      }
    }
    poll();
    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [symbol]);

  // Interpolate between polls
  useEffect(() => {
    function tick() {
      const real = realRef.current;
      const now = Date.now();
      const sincePoll = real ? now - real.timestamp : Infinity;
      if (real && sincePoll < 5000) {
        const noise = (Math.random() - 0.5) * real.price * 0.0002;
        const newPrice = real.price + noise;
        setState({
          data: {
            ...real,
            price: newPrice,
            changeAbs: real.previousClose ? newPrice - real.previousClose : real.changeAbs,
            changePct: real.previousClose
              ? ((newPrice - real.previousClose) / real.previousClose) * 100
              : real.changePct,
            timestamp: now,
          },
          status: sincePoll < 300 ? "polling" : "interpolating",
          error: null,
        });
      } else if (real && sincePoll >= 10000) {
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
