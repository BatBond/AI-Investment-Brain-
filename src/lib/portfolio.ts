/**
 * Portfolio P&L computation + live quote batching.
 * ---------------------------------------------------------------
 * Server-side only — uses Yahoo Finance via the existing
 * `market-data-live` wrapper, which already in-memory caches quotes
 * for 60s. We add a thin "stream" cache (1.5s TTL) so concurrent
 * polling requests from many browsers share a single computation.
 */

import { db } from "./db";
import {
  getLiveQuote,
  getLiveFundamentals,
  type LiveQuote,
} from "./market-data-live";

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
  /** transient flag set by the client when prices change between polls */
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

// 1.5s in-memory stream cache — Yahoo refreshes ~every few seconds, so
// polling faster than this just hits cached data anyway. Sharing the
// computation across browsers prevents duplicate Yahoo calls.
const STREAM_CACHE_TTL_MS = 1_500;
interface StreamCacheEntry {
  data: PortfolioStreamResponse;
  expires: number;
}
let streamCache: StreamCacheEntry | null = null;

function isFreshStream(): boolean {
  return !!streamCache && Date.now() < streamCache.expires;
}

async function batchQuotes(
  symbols: string[],
  concurrency = 5
): Promise<Record<string, LiveQuote | null>> {
  const out: Record<string, LiveQuote | null> = {};
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map((s) => getLiveQuote(s))
    );
    settled.forEach((r, idx) => {
      const sym = batch[idx];
      out[sym] = r.status === "fulfilled" ? r.value : null;
    });
  }
  return out;
}

/**
 * Compute the full portfolio P&L snapshot. Fetches Yahoo quotes in
 * batches of 5 to be polite to the upstream API.
 */
export async function computePortfolioStream(): Promise<PortfolioStreamResponse> {
  if (isFreshStream() && streamCache) {
    return streamCache.data;
  }

  // Check if db is available (may be null if Prisma failed to init)
  if (!db) {
    throw new Error(
      "Database not initialized. Check that DATABASE_URL is set and the database is reachable."
    );
  }

  const positions = await db.portfolioPosition.findMany({
    orderBy: { costBasisTotal: "desc" },
  });

  if (positions.length === 0) {
    const empty: PortfolioStreamResponse = {
      positions: [],
      totals: {
        costBasis: 0,
        marketValue: 0,
        todayPnl: 0,
        todayPnlPct: 0,
        totalPnl: 0,
        totalPnlPct: 0,
        liveCount: 0,
        totalCount: 0,
        dayLow: 0,
        dayHigh: 0,
      },
      timestamp: Date.now(),
    };
    streamCache = { data: empty, expires: Date.now() + STREAM_CACHE_TTL_MS };
    return empty;
  }

  const symbols = positions.map((p) => p.symbol);
  const quotes = await batchQuotes(symbols, 5);

  let totalCost = 0;
  let totalMarket = 0;
  let totalTodayPnl = 0;
  let totalPrevMarket = 0;
  let liveCount = 0;

  const rows: PortfolioPositionUpdate[] = positions.map((p) => {
    const q = quotes[p.symbol];
    const livePrice = q?.price ?? p.avgCostBasis;
    const prevClose = q?.price ? q.price - (q.changeAbs ?? 0) : p.avgCostBasis;
    const changeAbs = q?.changeAbs ?? 0;
    const changePct = q?.changePct ?? 0;
    const marketValue = livePrice * p.quantity;
    const costBasisTotal = p.costBasisTotal;
    const todayPnl = changeAbs * p.quantity;
    const totalPnl = marketValue - costBasisTotal;

    const prevMarket = prevClose * p.quantity;
    totalPrevMarket += prevMarket;
    totalCost += costBasisTotal;
    totalMarket += marketValue;
    totalTodayPnl += todayPnl;
    if (q?.isLive) liveCount += 1;

    return {
      id: p.id,
      symbol: p.symbol,
      description: p.description,
      quantity: p.quantity,
      avgCostBasis: p.avgCostBasis,
      costBasisTotal,
      type: p.type,
      livePrice,
      previousClose: prevClose,
      changeAbs,
      changePct,
      marketValue,
      todayPnl,
      todayPnlPct: changePct,
      totalPnl,
      totalPnlPct:
        costBasisTotal > 0 ? (totalPnl / costBasisTotal) * 100 : 0,
      percentOfAccount: 0, // filled in after totals known
      dayVolume: q?.volume ?? 0,
      isLive: q?.isLive ?? false,
      _priceChanged: null,
    };
  });

  // Second pass: % of account + day range estimates
  const dayLow = totalPrevMarket;
  const dayHigh = totalMarket;
  rows.forEach((r) => {
    r.percentOfAccount = totalMarket > 0 ? (r.marketValue / totalMarket) * 100 : 0;
  });

  const totals: PortfolioTotals = {
    costBasis: totalCost,
    marketValue: totalMarket,
    todayPnl: totalTodayPnl,
    todayPnlPct: totalPrevMarket > 0 ? (totalTodayPnl / totalPrevMarket) * 100 : 0,
    totalPnl: totalMarket - totalCost,
    totalPnlPct: totalCost > 0 ? ((totalMarket - totalCost) / totalCost) * 100 : 0,
    liveCount,
    totalCount: positions.length,
    dayLow,
    dayHigh,
  };

  const result: PortfolioStreamResponse = {
    positions: rows,
    totals,
    timestamp: Date.now(),
  };
  streamCache = { data: result, expires: Date.now() + STREAM_CACHE_TTL_MS };
  return result;
}

// ── Watchlist stream ────────────────────────────────────────────────
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

const WATCH_CACHE_TTL_MS = 2_000;
let watchCache: { data: WatchlistStreamResponse; expires: number } | null = null;

export async function computeWatchlistStream(): Promise<WatchlistStreamResponse> {
  if (watchCache && Date.now() < watchCache.expires) {
    return watchCache.data;
  }
  if (!db) {
    throw new Error("Database not initialized. Check DATABASE_URL.");
  }
  const items = await db.watchlistItem.findMany({ orderBy: { addedAt: "asc" } });
  if (items.length === 0) {
    const empty: WatchlistStreamResponse = { items: [], timestamp: Date.now() };
    watchCache = { data: empty, expires: Date.now() + WATCH_CACHE_TTL_MS };
    return empty;
  }
  const quotes = await batchQuotes(items.map((i) => i.symbol), 5);
  const out: WatchlistItemUpdate[] = items.map((it) => {
    const q = quotes[it.symbol];
    return {
      id: it.id,
      symbol: it.symbol,
      name: it.name,
      notes: it.notes,
      price: q?.price ?? 0,
      changeAbs: q?.changeAbs ?? 0,
      changePct: q?.changePct ?? 0,
      isLive: q?.isLive ?? false,
      addedAt: it.addedAt.toISOString(),
    };
  });
  const result: WatchlistStreamResponse = {
    items: out,
    timestamp: Date.now(),
  };
  watchCache = { data: result, expires: Date.now() + WATCH_CACHE_TTL_MS };
  return result;
}

// ── Sector allocation ───────────────────────────────────────────────
export interface SectorAllocation {
  sector: string;
  marketValue: number;
  percent: number;
  symbols: { symbol: string; marketValue: number }[];
}

export interface AllocationResponse {
  sectors: SectorAllocation[];
  totalMarketValue: number;
  asOf: number;
}

const SECTOR_CACHE_TTL_MS = 5 * 60_000; // 5 min — sectors don't change often
const sectorCache = new Map<string, { data: AllocationResponse; expires: number }>();

export async function getSectorAllocation(): Promise<AllocationResponse> {
  const cached = sectorCache.get("default");
  if (cached && Date.now() < cached.expires) return cached.data;

  if (!db) {
    throw new Error("Database not initialized. Check DATABASE_URL.");
  }
  const positions = await db.portfolioPosition.findMany();
  if (positions.length === 0) {
    const empty: AllocationResponse = {
      sectors: [],
      totalMarketValue: 0,
      asOf: Date.now(),
    };
    sectorCache.set("default", { data: empty, expires: Date.now() + SECTOR_CACHE_TTL_MS });
    return empty;
  }

  const quotes = await batchQuotes(positions.map((p) => p.symbol), 5);

  // Fetch fundamentals (cached 5min inside market-data-live) for sector
  const fundMap: Record<string, string> = {};
  const fundResults = await Promise.allSettled(
    positions.map((p) => getLiveFundamentals(p.symbol))
  );
  fundResults.forEach((r, idx) => {
    const sym = positions[idx].symbol;
    if (r.status === "fulfilled" && r.value?.sector) {
      fundMap[sym] = r.value.sector;
    }
  });

  // Fallback sector map for common tickers missing from Yahoo
  const FALLBACK: Record<string, string> = {
    SPY: "Index", QQQ: "Index", IWM: "Index", DIA: "Index", VIX: "Index",
    XLK: "Technology", XLF: "Financials", XLE: "Energy", XLV: "Healthcare",
    XLI: "Industrials", XLY: "Consumer Discretionary", XLP: "Consumer Staples",
    XLU: "Utilities", XLRE: "Real Estate", XLB: "Materials", XLC: "Communication Services",
  };

  const sectorMap = new Map<string, SectorAllocation>();
  let totalMarketValue = 0;
  for (const p of positions) {
    const q = quotes[p.symbol];
    const mv = (q?.price ?? p.avgCostBasis) * p.quantity;
    totalMarketValue += mv;
    const sector = fundMap[p.symbol] || FALLBACK[p.symbol] || "Other";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, {
        sector,
        marketValue: 0,
        percent: 0,
        symbols: [],
      });
    }
    const sec = sectorMap.get(sector)!;
    sec.marketValue += mv;
    sec.symbols.push({ symbol: p.symbol, marketValue: mv });
  }

  const sectors = Array.from(sectorMap.values());
  sectors.forEach((s) => {
    s.percent = totalMarketValue > 0 ? (s.marketValue / totalMarketValue) * 100 : 0;
    s.symbols.sort((a, b) => b.marketValue - a.marketValue);
  });
  sectors.sort((a, b) => b.marketValue - a.marketValue);

  const result: AllocationResponse = {
    sectors,
    totalMarketValue,
    asOf: Date.now(),
  };
  sectorCache.set("default", { data: result, expires: Date.now() + SECTOR_CACHE_TTL_MS });
  return result;
}

// ── Market heatmap (sector ETFs) ────────────────────────────────────
export interface MarketHeatmapTile {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  marketCap?: number;
  isLive: boolean;
}

const MARKET_HEATMAP_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLV", name: "Healthcare" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLY", name: "Consumer Disc" },
  { symbol: "XLP", name: "Consumer Staples" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLC", name: "Comm Services" },
  { symbol: "XME", name: "Metals & Mining" },
];

let marketHeatmapCache: { data: MarketHeatmapTile[]; expires: number } | null = null;
const MARKET_HEATMAP_TTL = 30_000;

export async function getMarketHeatmap(): Promise<MarketHeatmapTile[]> {
  if (marketHeatmapCache && Date.now() < marketHeatmapCache.expires) {
    return marketHeatmapCache.data;
  }
  const quotes = await batchQuotes(MARKET_HEATMAP_SYMBOLS.map((s) => s.symbol), 5);
  const tiles: MarketHeatmapTile[] = MARKET_HEATMAP_SYMBOLS.map((s) => {
    const q = quotes[s.symbol];
    return {
      symbol: s.symbol,
      name: s.name,
      price: q?.price ?? 0,
      changePct: q?.changePct ?? 0,
      marketCap: q?.marketCap,
      isLive: q?.isLive ?? false,
    };
  });
  marketHeatmapCache = { data: tiles, expires: Date.now() + MARKET_HEATMAP_TTL };
  return tiles;
}
