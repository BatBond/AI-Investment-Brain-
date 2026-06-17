# BUILD-003 — Portfolio + Sentiment Radar

## Task
Add 3 features to existing AI Investment Brain Next.js 16 app:
1. Portfolio section (Bloomberg-style, real-time P&L, heatmap, allocation pie, watchlist)
2. Real-time P&L heatmap (inside Portfolio) + Market sector ETF heatmap
3. Sentiment Radar (Twitter/Reddit/Google/Yahoo scraping + LLM sentiment scoring)

## Outcome
- Code was already 95% written by a prior BUILD-003 attempt. This pass was an audit + bug-fix + verification cycle.
- Found and fixed the rate-limit cascade in `src/lib/sentiment-sources.ts`:
  - Capped LLM-scored articles per scan to 12 (was unlimited, causing 116s scans)
  - Skip articles whose URL already exists in DB (was re-scoring all 40 every time)
  - Increased inter-call delay 800ms → 1200ms
  - Result: scan time 116s → 25s, and new articles now get real bullish/bearish scores
    (previously all landed as neutral fallbacks due to 429s)
- Verified end-to-end via agent-browser:
  - Sidebar shows "PORTFOLIO & MARKETS" group at top with Portfolio + Sentiment Radar
  - Portfolio loads 24 seeded positions with LIVE Yahoo quotes (24/24)
  - Heatmap tiles use correct HSL gradient: TSM +3.19% → rgb(19,236,91) bright green,
    FSELX -4.71% → rgb(236,19,19) bright red (clamped at ±3%)
  - Holdings table renders 24 rows with all 11 sortable columns
  - Allocation pie shows 8 sectors (Technology 67.2%, Consumer Cyclical 13.8%, etc.)
  - Watchlist shows SPY/QQQ/IWM/VIX/DIA with live prices
  - Add Position dialog: typing "Tesla" returns 5 Yahoo autocomplete results (TSLA, etc.)
  - Sentiment Radar: "Scan Now" completes in 25s, adds 5 new articles with real
    sentiment scores (1 bullish +0.60, 1 bearish -0.60, 3 neutral)
- Lint: 0 errors

## Files Touched
- Modified: `src/lib/sentiment-sources.ts` (rate-limit optimization)
- Verified (no changes needed): `src/lib/sections.ts`, `src/lib/portfolio.ts`,
  `src/lib/scheduler.ts`, `src/lib/scheduler-init.ts`, `src/hooks/use-portfolio-stream.ts`,
  `src/components/sections/portfolio.tsx`, `src/components/sections/sentiment-radar.tsx`,
  `src/components/layout/sidebar.tsx`, `src/app/page.tsx`, `src/app/globals.css`,
  `prisma/schema.prisma`, all 11 API routes under `/api/portfolio/*`, `/api/watchlist/*`,
  `/api/sentiment/*`

## Screenshots
- `download/screenshot_v3_portfolio.png` — full Portfolio page
- `download/screenshot_v3_portfolio_heatmap.png` — colored heatmap tiles close-up
- `download/screenshot_v3_sentiment_radar.png` — full Sentiment Radar page
