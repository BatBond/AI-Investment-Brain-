/**
 * Live Market Data Layer
 * ---------------------------------------------------------------
 * Provider abstraction over Yahoo Finance (default), with optional
 * Finnhub / Polygon support and graceful fallback to the mock layer
 * (`./market-data.ts`).
 *
 * Must run server-side only — `yahoo-finance2` hits the network.
 */

import YahooFinance from "yahoo-finance2";
import {
  getTickerData,
  getHistoricalPrices,
  searchTickers,
  formatCurrency,
  formatPct,
  type TickerData,
} from "./market-data";

// yahoo-finance2 default export is a constructor in v3.
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type Provider = "yahoo" | "finnhub" | "polygon" | "mock";

export const ACTIVE_PROVIDER: Provider =
  (process.env.MARKET_DATA_PROVIDER as Provider) || "yahoo";

// ── In-memory cache ────────────────────────────────────────────────
interface CacheEntry {
  data: unknown;
  expires: number;
}
const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    cache.delete(key);
    return null;
  }
  return e.data as T;
}
function setCached(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
  // opportunistic cleanup
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expires) cache.delete(k);
    }
  }
}

const TTL_QUOTE = 60_000; // 60s
const TTL_FUNDAMENTALS = 300_000; // 5min
const TTL_HIST = 3_600_000; // 1h
const TTL_SEARCH = 30_000; // 30s
const TTL_NEWS = 300_000; // 5min

// ── Public types ────────────────────────────────────────────────────
export interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAbs: number;
  volume: number;
  marketCap: number;
  currency: string;
  exchange: string;
  exchangeName: string;
  quoteType: string; // EQUITY | ETF | MUTUALFUND | CRYPTOCURRENCY | etc.
  isLive: boolean;
}

export interface LiveFundamentals {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  peRatio?: number;
  forwardPe?: number;
  pbRatio?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  marketCap: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  revenue?: number;
  revenueGrowthYoY?: number;
  netMargin?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  freeCashFlow?: number;
  fullTimeEmployees?: number;
  isLive: boolean;
}

export interface LiveHistoricalBar {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface TickerNewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string; // EQUITY | ETF | MUTUALFUND | FUTURE | CRYPTOCURRENCY | etc.
  typeDisp: string; // "Equity", "ETF", "Mutual Fund"
}

// ── Helpers ────────────────────────────────────────────────────────
function typeDispFromQuoteType(qt?: string): string {
  if (!qt) return "Equity";
  const map: Record<string, string> = {
    EQUITY: "Equity",
    ETF: "ETF",
    MUTUALFUND: "Mutual Fund",
    FUTURE: "Future",
    CRYPTOCURRENCY: "Crypto",
    INDEX: "Index",
    CURRENCY: "Currency",
    COMMODITY: "Commodity",
  };
  return map[qt] || qt;
}

function mockFallbackSearch(query: string): SearchResult[] {
  return searchTickers(query, 12).map((t) => ({
    symbol: t.symbol,
    name: t.name,
    exchange: t.exchange,
    quoteType: "EQUITY",
    typeDisp: "Equity",
  }));
}

function quoteFromMock(m: TickerData): LiveQuote {
  return {
    symbol: m.symbol,
    name: m.name,
    price: m.price,
    changePct: m.changePct * 100,
    changeAbs: m.change,
    volume: m.volume,
    marketCap: m.marketCap,
    currency: "USD",
    exchange: m.exchange,
    exchangeName: m.exchange,
    quoteType: "EQUITY",
    isLive: false,
  };
}

function fundamentalsFromMock(m: TickerData): LiveFundamentals {
  return {
    symbol: m.symbol,
    name: m.name,
    sector: m.sector,
    industry: m.industry,
    description: undefined,
    website: undefined,
    peRatio: m.peRatio || undefined,
    forwardPe: m.forwardPe || undefined,
    pbRatio: m.pbRatio || undefined,
    eps: m.eps,
    beta: m.beta,
    dividendYield: m.dividendYield || undefined,
    marketCap: m.marketCap,
    fiftyTwoWeekHigh: m.high52,
    fiftyTwoWeekLow: m.low52,
    revenue: m.revenue,
    revenueGrowthYoY: m.revenueGrowthYoY,
    netMargin: m.netMargin,
    debtToEquity: m.debtToEquity,
    returnOnEquity: undefined,
    freeCashFlow: m.fcf,
    fullTimeEmployees: undefined,
    isLive: false,
  };
}

// ── Universal search ────────────────────────────────────────────────
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const cached = getCached<SearchResult[]>(`search:${query}`);
  if (cached) return cached;

  if (ACTIVE_PROVIDER === "yahoo") {
    try {
      const r = await yf.search(query, { quotesCount: 12, newsCount: 0 });
      const out: SearchResult[] = (r.quotes || [])
        .filter((q) => q.symbol && q.quoteType)
        .map((q) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchange || "",
          quoteType: q.quoteType || "EQUITY",
          typeDisp: q.typeDisp || typeDispFromQuoteType(q.quoteType),
        }));
      if (out.length > 0) {
        setCached(`search:${query}`, out, TTL_SEARCH);
        return out;
      }
    } catch (e) {
      console.error(
        "[market-data-live] searchSymbols yahoo failed:",
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  // Optional Finnhub
  if (ACTIVE_PROVIDER === "finnhub" && process.env.FINNHUB_API_KEY) {
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`
      );
      const j = await r.json();
      const out: SearchResult[] = (j.result || []).map((x: { symbol: string; description: string; displaySymbol: string }) => ({
        symbol: x.displaySymbol || x.symbol,
        name: x.description || x.symbol,
        exchange: "",
        quoteType: "EQUITY",
        typeDisp: "Equity",
      }));
      if (out.length > 0) {
        setCached(`search:${query}`, out, TTL_SEARCH);
        return out;
      }
    } catch (e) {
      console.error("[market-data-live] searchSymbols finnhub failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // Optional Polygon
  if (ACTIVE_PROVIDER === "polygon" && process.env.POLYGON_API_KEY) {
    try {
      const r = await fetch(
        `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&apiKey=${process.env.POLYGON_API_KEY}`
      );
      const j = await r.json();
      const out: SearchResult[] = (j.results || []).map((x: { ticker: string; name: string; type: string; primary_exchange: string }) => ({
        symbol: x.ticker,
        name: x.name,
        exchange: x.primary_exchange || "",
        quoteType: (x.type || "EQUITY").toUpperCase(),
        typeDisp: x.type || "Equity",
      }));
      if (out.length > 0) {
        setCached(`search:${query}`, out, TTL_SEARCH);
        return out;
      }
    } catch (e) {
      console.error("[market-data-live] searchSymbols polygon failed:", e instanceof Error ? e.message : String(e));
    }
  }

  return mockFallbackSearch(query);
}

// ── Quote ──────────────────────────────────────────────────────────
export async function getLiveQuote(symbol: string): Promise<LiveQuote | null> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return null;
  const cached = getCached<LiveQuote>(`quote:${sym}`);
  if (cached) return cached;

  if (ACTIVE_PROVIDER === "yahoo") {
    try {
      const q = await yf.quote(sym);
      const result: LiveQuote = {
        symbol: q.symbol || sym,
        name: q.shortName || q.longName || sym,
        price: q.regularMarketPrice ?? 0,
        // NOTE: yahoo-finance2 v3 returns regularMarketChangePercent already
        // as a percentage (e.g., -2.26 for -2.26%). Do NOT multiply by 100.
        changePct: q.regularMarketChangePercent ?? 0,
        changeAbs: q.regularMarketChange ?? 0,
        volume: q.regularMarketVolume ?? 0,
        marketCap: q.marketCap ?? 0,
        currency: q.currency || "USD",
        exchange: q.fullExchangeName || q.exchange || "",
        exchangeName: q.exchangeName || "",
        quoteType: q.quoteType || "EQUITY",
        isLive: true,
      };
      setCached(`quote:${sym}`, result, TTL_QUOTE);
      return result;
    } catch (e) {
      console.error("[market-data-live] getLiveQuote yahoo failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // FINNHUB quote
  if (ACTIVE_PROVIDER === "finnhub" && process.env.FINNHUB_API_KEY) {
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${process.env.FINNHUB_API_KEY}`
      );
      const j = await r.json();
      if (j && typeof j.c === "number" && j.c > 0) {
        const result: LiveQuote = {
          symbol: sym,
          name: sym,
          price: j.c,
          changePct: j.dp ?? 0,
          changeAbs: j.d ?? 0,
          volume: 0,
          marketCap: 0,
          currency: "USD",
          exchange: "",
          exchangeName: "",
          quoteType: "EQUITY",
          isLive: true,
        };
        setCached(`quote:${sym}`, result, TTL_QUOTE);
        return result;
      }
    } catch (e) {
      console.error("[market-data-live] getLiveQuote finnhub failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // POLYGON quote
  if (ACTIVE_PROVIDER === "polygon" && process.env.POLYGON_API_KEY) {
    try {
      const r = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(sym)}/prev?apiKey=${process.env.POLYGON_API_KEY}`
      );
      const j = await r.json();
      const bar = j.results?.[0];
      if (bar) {
        const result: LiveQuote = {
          symbol: sym,
          name: sym,
          price: bar.c ?? 0,
          changePct: bar.c && bar.o ? ((bar.c - bar.o) / bar.o) * 100 : 0,
          changeAbs: bar.c && bar.o ? bar.c - bar.o : 0,
          volume: bar.v ?? 0,
          marketCap: 0,
          currency: "USD",
          exchange: "",
          exchangeName: "",
          quoteType: "EQUITY",
          isLive: true,
        };
        setCached(`quote:${sym}`, result, TTL_QUOTE);
        return result;
      }
    } catch (e) {
      console.error("[market-data-live] getLiveQuote polygon failed:", e instanceof Error ? e.message : String(e));
    }
  }

  const mock = getTickerData(sym);
  return mock ? quoteFromMock(mock) : null;
}

// ── Fundamentals ───────────────────────────────────────────────────
export async function getLiveFundamentals(symbol: string): Promise<LiveFundamentals | null> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return null;
  const cached = getCached<LiveFundamentals>(`fund:${sym}`);
  if (cached) return cached;

  if (ACTIVE_PROVIDER === "yahoo") {
    try {
      const sum = await yf.quoteSummary(sym, {
        modules: [
          "summaryDetail",
          "financialData",
          "defaultKeyStatistics",
          "price",
          "summaryProfile",
        ],
      });
      const sd = sum.summaryDetail || {};
      const fd = sum.financialData || {};
      const ks = sum.defaultKeyStatistics || {};
      const pr = sum.price || {};
      const sp = sum.summaryProfile || {};

      const result: LiveFundamentals = {
        symbol: sym,
        name:
          (pr as { longName?: string; shortName?: string }).longName ||
          (pr as { longName?: string; shortName?: string }).shortName ||
          sym,
        sector: sp.sector || undefined,
        industry: sp.industry || undefined,
        description: sp.longBusinessSummary || undefined,
        website: sp.website || undefined,
        peRatio: typeof sd.trailingPE === "number" ? sd.trailingPE : undefined,
        forwardPe: typeof sd.forwardPE === "number" ? sd.forwardPE : undefined,
        pbRatio: typeof ks.priceToBook === "number" ? ks.priceToBook : undefined,
        eps: typeof ks.trailingEps === "number" ? ks.trailingEps : undefined,
        beta: typeof sd.beta === "number" ? sd.beta : undefined,
        dividendYield:
          typeof sd.dividendYield === "number" ? sd.dividendYield : undefined,
        marketCap: typeof pr.marketCap === "number" ? pr.marketCap : 0,
        fiftyTwoWeekHigh:
          typeof sd.fiftyTwoWeekHigh === "number" ? sd.fiftyTwoWeekHigh : undefined,
        fiftyTwoWeekLow:
          typeof sd.fiftyTwoWeekLow === "number" ? sd.fiftyTwoWeekLow : undefined,
        revenue:
          typeof fd.totalRevenue === "number" ? fd.totalRevenue : undefined,
        revenueGrowthYoY:
          typeof fd.revenueGrowth === "number" ? fd.revenueGrowth : undefined,
        netMargin:
          typeof fd.profitMargins === "number" ? fd.profitMargins : undefined,
        debtToEquity:
          typeof fd.debtToEquity === "number" ? fd.debtToEquity : undefined,
        returnOnEquity:
          typeof fd.returnOnEquity === "number" ? fd.returnOnEquity : undefined,
        freeCashFlow:
          typeof fd.freeCashflow === "number" ? fd.freeCashflow : undefined,
        fullTimeEmployees:
          typeof sp.fullTimeEmployees === "number"
            ? sp.fullTimeEmployees
            : undefined,
        isLive: true,
      };
      setCached(`fund:${sym}`, result, TTL_FUNDAMENTALS);
      return result;
    } catch (e) {
      console.error("[market-data-live] getLiveFundamentals yahoo failed:", e instanceof Error ? e.message : String(e));
    }
  }

  const mock = getTickerData(sym);
  return mock ? fundamentalsFromMock(mock) : null;
}

// ── Historical bars ────────────────────────────────────────────────
export async function getLiveHistorical(
  symbol: string,
  days: number = 180
): Promise<LiveHistoricalBar[]> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return [];
  const cached = getCached<LiveHistoricalBar[]>(`hist:${sym}:${days}`);
  if (cached) return cached;

  if (ACTIVE_PROVIDER === "yahoo") {
    try {
      const period1 = new Date();
      period1.setDate(period1.getDate() - days);
      const r = await yf.chart(sym, { period1, interval: "1d" });
      const quotes = (r.quotes || []) as Array<{
        date: Date | string;
        open?: number;
        high?: number;
        low?: number;
        close?: number;
        volume?: number;
        adjClose?: number;
      }>;
      const bars: LiveHistoricalBar[] = quotes
        .filter((b) => typeof b.close === "number")
        .map((b) => ({
          date: new Date(b.date).toISOString().slice(0, 10),
          open: b.open ?? 0,
          high: b.high ?? 0,
          low: b.low ?? 0,
          close: b.close ?? 0,
          volume: b.volume ?? 0,
          adjClose: b.adjClose,
        }));
      if (bars.length > 0) {
        setCached(`hist:${sym}:${days}`, bars, TTL_HIST);
        return bars;
      }
    } catch (e) {
      console.error("[market-data-live] getLiveHistorical yahoo failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // Mock fallback — getHistoricalPrices returns numeric close series
  const mockSeries = getHistoricalPrices(sym, days);
  if (mockSeries.length > 0) {
    const today = new Date();
    const bars: LiveHistoricalBar[] = mockSeries.map((c, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (mockSeries.length - 1 - i));
      return {
        date: d.toISOString().slice(0, 10),
        open: c,
        high: c,
        low: c,
        close: c,
        volume: 0,
        adjClose: c,
      };
    });
    return bars;
  }
  return [];
}

// ── News ────────────────────────────────────────────────────────────
export async function getTickerNews(
  symbol: string
): Promise<TickerNewsItem[]> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return [];
  const cached = getCached<TickerNewsItem[]>(`news:${sym}`);
  if (cached) return cached;

  if (ACTIVE_PROVIDER === "yahoo") {
    try {
      const r = await yf.search(sym, { quotesCount: 0, newsCount: 10 });
      const news = (r.news || []).map((n) => ({
        title: n.title,
        publisher: n.publisher,
        link: n.link,
        publishedAt: new Date(n.providerPublishTime || n.providerPublishTimeUTC || Date.now()).toISOString(),
      }));
      if (news.length > 0) {
        setCached(`news:${sym}`, news, TTL_NEWS);
        return news;
      }
    } catch (e) {
      console.error("[market-data-live] getTickerNews yahoo failed:", e instanceof Error ? e.message : String(e));
    }
  }
  return [];
}

// ── Multi-ticker helpers (used by ticker tape / dashboard) ───────────
export async function getQuotesBatch(
  symbols: string[]
): Promise<LiveQuote[]> {
  const out: LiveQuote[] = [];
  for (const s of symbols) {
    const q = await getLiveQuote(s);
    if (q) out.push(q);
  }
  return out;
}

// ── Build the human-readable fundamentals payload for the LLM ────────
export function formatFundamentalsForLLM(f: LiveFundamentals): string {
  const lines: string[] = [];
  lines.push(`Live market fundamentals for ${f.symbol} (${f.name}):`);
  if (f.sector) lines.push(`- Sector: ${f.sector}${f.industry ? ` / ${f.industry}` : ""}`);
  if (f.marketCap) lines.push(`- Market cap: ${formatCurrency(f.marketCap, { compact: true })}`);
  if (f.peRatio) lines.push(`- P/E (TTM): ${f.peRatio.toFixed(2)}x`);
  if (f.forwardPe) lines.push(`- Forward P/E: ${f.forwardPe.toFixed(2)}x`);
  if (f.pbRatio) lines.push(`- P/B: ${f.pbRatio.toFixed(2)}x`);
  if (f.eps !== undefined) lines.push(`- EPS: $${f.eps.toFixed(2)}`);
  if (f.beta !== undefined) lines.push(`- Beta: ${f.beta.toFixed(2)}`);
  if (f.dividendYield !== undefined)
    lines.push(`- Dividend yield: ${formatPct(f.dividendYield)}`);
  if (f.fiftyTwoWeekHigh !== undefined && f.fiftyTwoWeekLow !== undefined)
    lines.push(
      `- 52w range: ${formatCurrency(f.fiftyTwoWeekLow)} – ${formatCurrency(f.fiftyTwoWeekHigh)}`
    );
  if (f.revenue !== undefined)
    lines.push(`- Revenue (TTM): ${formatCurrency(f.revenue, { compact: true })}`);
  if (f.revenueGrowthYoY !== undefined)
    lines.push(`- Revenue growth YoY: ${formatPct(f.revenueGrowthYoY, 1)}`);
  if (f.netMargin !== undefined)
    lines.push(`- Net margin: ${formatPct(f.netMargin, 1)}`);
  if (f.debtToEquity !== undefined)
    lines.push(`- Debt/Equity: ${f.debtToEquity.toFixed(2)}`);
  if (f.returnOnEquity !== undefined)
    lines.push(`- ROE: ${formatPct(f.returnOnEquity, 1)}`);
  if (f.freeCashFlow !== undefined)
    lines.push(`- Free cash flow: ${formatCurrency(f.freeCashFlow, { compact: true })}`);
  if (f.fullTimeEmployees !== undefined)
    lines.push(`- Employees: ${f.fullTimeEmployees.toLocaleString("en-US")}`);
  if (f.description) {
    const snippet = f.description.slice(0, 600);
    lines.push(`- Business summary: ${snippet}${f.description.length > 600 ? "…" : ""}`);
  }
  lines.push(
    f.isLive
      ? "(Source: Yahoo Finance — live data)"
      : "(Source: representative sample fallback — not live)"
  );
  return lines.join("\n");
}
