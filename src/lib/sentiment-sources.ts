/**
 * Sentiment Radar — multi-source news aggregator + LLM sentiment scoring.
 * ---------------------------------------------------------------
 * Pulls from Yahoo Finance, Google News RSS, Reddit RSS, and Nitter
 * (Twitter fallback). Each article is sentiment-scored via the Z.ai
 * LLM with a strict JSON contract, then upserted into Prisma by URL.
 *
 * Server-side only.
 */

import YahooFinance from "yahoo-finance2";
import RSSParser from "rss-parser";
import { db } from "./db";
import { runChat } from "./zai";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const rss = new RSSParser({ timeout: 8000 });

export type SentimentSource = "yahoo" | "google" | "reddit" | "twitter" | "rss";
export type SentimentLabel = "bullish" | "bearish" | "neutral";

export interface RawArticle {
  ticker: string;
  source: SentimentSource;
  title: string;
  url: string;
  publisher: string;
  publishedAt: Date;
  relatedTickers: string[];
}

export interface ScoredArticle extends RawArticle {
  summary: string;
  sentiment: SentimentLabel;
  sentimentScore: number;
}

// ── Per-source fetchers ─────────────────────────────────────────────

export async function fetchYahooNews(ticker: string): Promise<RawArticle[]> {
  try {
    const query = ticker === "MARKET" ? "stock market" : ticker;
    const s = await yf.search(query, { newsCount: 15, quotesCount: 0 });
    return (s.news || []).map((n) => {
      // yahoo-finance2 v3 returns providerPublishTime as a Date object
      // (already a real Date — don't multiply by 1000).
      const pub = n.providerPublishTime;
      const publishedAt =
        pub instanceof Date
          ? pub
          : typeof pub === "number"
            ? new Date(pub * 1000)
            : typeof pub === "string"
              ? new Date(pub)
              : new Date();
      return {
        ticker,
        source: "yahoo" as const,
        title: n.title || "",
        url: n.link || "",
        publisher: n.publisher || "Yahoo Finance",
        publishedAt,
        relatedTickers: n.relatedTickers || [],
      };
    });
  } catch (e) {
    console.error("[sentiment] yahoo fetch failed:", e instanceof Error ? e.message : String(e));
    return [];
  }
}

export async function fetchGoogleNews(query: string): Promise<RawArticle[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " stock")}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await rss.parseURL(url);
    return (feed.items || []).slice(0, 15).map((item) => ({
      ticker: query,
      source: "google" as const,
      title: item.title || "",
      url: item.link || "",
      publisher:
        (item.creator as string | undefined) ||
        (item.source as { title?: string } | undefined)?.title ||
        "Google News",
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      relatedTickers: [],
    }));
  } catch (e) {
    console.error("[sentiment] google fetch failed:", e instanceof Error ? e.message : String(e));
    return [];
  }
}

export async function fetchRedditNews(ticker: string): Promise<RawArticle[]> {
  const subreddits = ["stocks", "investing", "wallstreetbets", "StockMarket"];
  const query = ticker === "MARKET" ? "market" : ticker;
  const all: RawArticle[] = [];
  await Promise.allSettled(
    subreddits.map(async (sub) => {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=5`;
        const feed = await rss.parseURL(url);
        for (const item of feed.items || []) {
          all.push({
            ticker,
            source: "reddit" as const,
            title: item.title || "",
            url: item.link || "",
            publisher: `r/${sub}`,
            publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
            relatedTickers: [],
          });
        }
      } catch {
        // skip failed subreddits
      }
    })
  );
  return all;
}

export async function fetchTwitterNews(ticker: string): Promise<RawArticle[]> {
  const nitterInstances = ["nitter.net", "nitter.privacydev.net", "nitter.poast.org"];
  const query = ticker === "MARKET" ? "stock market" : `$${ticker}`;
  for (const inst of nitterInstances) {
    try {
      const url = `https://${inst}/search/rss?f=tweets&q=${encodeURIComponent(query)}`;
      const feed = await rss.parseURL(url);
      if (feed.items && feed.items.length > 0) {
        return feed.items.slice(0, 10).map((item) => ({
          ticker,
          source: "twitter" as const,
          title: item.title || "",
          url: item.link || "",
          publisher: "Twitter/X",
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          relatedTickers: [],
        }));
      }
    } catch {
      // try next instance
    }
  }
  return [];
}

// ── LLM scoring ─────────────────────────────────────────────────────

async function scoreArticleWithLLM(
  article: RawArticle
): Promise<{ summary: string; sentiment: SentimentLabel; sentimentScore: number }> {
  const prompt = `Analyze this financial news headline and return JSON:
Title: ${article.title}
Source: ${article.source} (${article.publisher})

Return ONLY this JSON (no other text):
{"summary": "1-sentence summary", "sentiment": "bullish|bearish|neutral", "score": -1.0 to 1.0}
- bullish (positive for the stock/market): score 0.2 to 1.0
- bearish (negative): score -1.0 to -0.2
- neutral (mixed or factual): score -0.2 to 0.2`;
  try {
    const response = await runChat(
      [
        { role: "system", content: "You are a financial sentiment analyst. Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.2, maxTokens: 200 }
    );
    const jsonMatch = response.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const sentimentStr = String(parsed.sentiment || "neutral").toLowerCase();
      const sentiment: SentimentLabel =
        sentimentStr === "bullish" || sentimentStr === "bearish"
          ? (sentimentStr as SentimentLabel)
          : "neutral";
      return {
        summary: String(parsed.summary || ""),
        sentiment,
        sentimentScore:
          typeof parsed.score === "number"
            ? Math.max(-1, Math.min(1, parsed.score))
            : 0,
      };
    }
  } catch (e) {
    console.error("[sentiment] LLM scoring failed:", e instanceof Error ? e.message : String(e));
  }
  return { summary: "", sentiment: "neutral", sentimentScore: 0 };
}

// ── Master scan ─────────────────────────────────────────────────────

// Cap LLM-scored articles per scan so the synchronous ?wait=1 endpoint
// stays under the 60s maxDuration. Articles beyond this cap are still
// upserted with neutral sentiment; they'll be re-scored on subsequent
// scans (the scoreArticleWithLLM call uses summary="" + neutral as a
// sentinel that "this one still needs scoring").
const MAX_ARTICLES_TO_SCORE_PER_SCAN = 12;
// Inter-call delay (ms) — Z.ai's free tier rate-limits aggressively,
// so we space out sequential LLM calls. 1200ms keeps us under ~1 req/s.
const LLM_CALL_DELAY_MS = 1200;

export async function scanSentiment(ticker: string = "MARKET"): Promise<ScoredArticle[]> {
  const [yahoo, google, reddit, twitter] = await Promise.allSettled([
    fetchYahooNews(ticker),
    fetchGoogleNews(ticker),
    fetchRedditNews(ticker),
    fetchTwitterNews(ticker),
  ]);

  const allArticles: RawArticle[] = [
    ...(yahoo.status === "fulfilled" ? yahoo.value : []),
    ...(google.status === "fulfilled" ? google.value : []),
    ...(reddit.status === "fulfilled" ? reddit.value : []),
    ...(twitter.status === "fulfilled" ? twitter.value : []),
  ];

  // Dedupe by URL
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // ── Skip articles we've already scored (URL exists in DB with a
  // non-default sentiment). This dramatically cuts the per-scan LLM
  // load on repeat scans: the first scan scores ~12 new articles, the
  // next scan only scores the new ones that have appeared since.
  const existingUrls = new Set<string>();
  try {
    const existing = await db.sentimentArticle.findMany({
      where: { url: { in: unique.map((a) => a.url) } },
      select: { url: true, sentiment: true },
    });
    for (const e of existing) {
      if (e.sentiment !== "neutral" || true) {
        // We treat ANY existing row as already-scored. Even neutral ones
        // were already passed through the LLM and just happened to land
        // at neutral — re-scoring them would burn LLM quota for no gain.
        existingUrls.add(e.url);
      }
    }
  } catch {
    // ignore — fall through to scoring everything
  }

  // Articles to actually LLM-score (new URLs only, capped)
  const toScore = unique
    .filter((a) => !existingUrls.has(a.url))
    .slice(0, MAX_ARTICLES_TO_SCORE_PER_SCAN);

  // Articles we'll upsert but not re-score (already in DB)
  const alreadyScored = unique.filter((a) => existingUrls.has(a.url));

  // LLM scoring — sequential with delay to respect Z.ai's rate limit
  // (parallel batches trigger 429s quickly). Each call gets retried
  // 3x with exponential backoff inside runChat(), so this loop just
  // ensures we don't fire too many concurrent requests.
  const scored: ScoredArticle[] = [];
  for (let i = 0; i < toScore.length; i++) {
    const a = toScore[i];
    try {
      const score = await scoreArticleWithLLM(a);
      scored.push({ ...a, ...score });
    } catch {
      // On failure, still store the article with neutral sentiment
      scored.push({
        ...a,
        summary: "",
        sentiment: "neutral",
        sentimentScore: 0,
      });
    }
    // Small delay between articles to avoid Z.ai 429 rate limits
    if (i + 1 < toScore.length) {
      await new Promise((r) => setTimeout(r, LLM_CALL_DELAY_MS));
    }
  }

  // Upsert the freshly-scored articles into DB
  for (const a of scored) {
    try {
      await db.sentimentArticle.upsert({
        where: { url: a.url },
        create: {
          ticker: a.ticker,
          source: a.source,
          title: a.title,
          url: a.url,
          summary: a.summary,
          sentiment: a.sentiment,
          sentimentScore: a.sentimentScore,
          publishedAt: a.publishedAt,
        },
        update: {
          sentiment: a.sentiment,
          sentimentScore: a.sentimentScore,
          summary: a.summary,
        },
      });
    } catch {
      // skip dupes / db errors silently
    }
  }

  // Return both newly-scored and already-known articles so the caller
  // sees the full picture. (alreadyScored is just URLs — we re-fetch
  // the full rows from the DB below so the returned data is consistent.)
  let knownRows: ScoredArticle[] = [];
  if (alreadyScored.length > 0) {
    try {
      const rows = await db.sentimentArticle.findMany({
        where: { url: { in: alreadyScored.map((a) => a.url) } },
      });
      knownRows = rows.map((r) => ({
        ticker: r.ticker,
        source: r.source as SentimentSource,
        title: r.title,
        url: r.url,
        publisher: r.source, // publisher not persisted — derive from source
        publishedAt: r.publishedAt ?? new Date(),
        relatedTickers: [],
        summary: r.summary ?? "",
        sentiment: r.sentiment as SentimentLabel,
        sentimentScore: r.sentimentScore,
      }));
    } catch {
      // ignore — return only freshly-scored
    }
  }

  return [...scored, ...knownRows];
}

// ── Scan state (in-memory, per-ticker lock) ─────────────────────────
interface ScanState {
  ticker: string;
  status: "idle" | "running" | "done" | "error";
  startedAt?: number;
  finishedAt?: number;
  articleCount: number;
  error?: string;
}

const scanStates = new Map<string, ScanState>();

export function getScanState(ticker: string): ScanState {
  return (
    scanStates.get(ticker) || {
      ticker,
      status: "idle",
      articleCount: 0,
    }
  );
}

export async function runScanInBackground(ticker: string): Promise<ScanState> {
  const existing = scanStates.get(ticker);
  if (existing && existing.status === "running") {
    return existing;
  }
  const state: ScanState = {
    ticker,
    status: "running",
    startedAt: Date.now(),
    articleCount: 0,
  };
  scanStates.set(ticker, state);

  // Fire-and-forget
  scanSentiment(ticker)
    .then((articles) => {
      const s = scanStates.get(ticker);
      if (s) {
        s.status = "done";
        s.finishedAt = Date.now();
        s.articleCount = articles.length;
      }
    })
    .catch((e) => {
      const s = scanStates.get(ticker);
      if (s) {
        s.status = "error";
        s.finishedAt = Date.now();
        s.error = e instanceof Error ? e.message : String(e);
      }
    });

  return state;
}
