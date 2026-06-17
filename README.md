# AI Investment Brain

> A Bloomberg-grade, AI-powered equity research terminal built on Next.js 16.
> Real-time market data, 10 Wall Street-style analyst modules, 5-persona advisory engine,
> portfolio tracking with live P&L heatmap, Obsidian-style knowledge base, automated email
> research reports, and multi-source sentiment radar (Twitter / Reddit / Google News / Yahoo Finance).

![AI Investment Brain](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 21 Sections Across 4 Sidebar Groups

#### 📊 PORTFOLIO & MARKETS
- **Portfolio** — Holdings table with live prices, real-time P&L heatmap (Finviz-style treemap), allocation pie, watchlist, import/export XLSX/CSV
- **Sentiment Radar** — Scrapes Yahoo Finance, Google News, Reddit (r/stocks, r/investing, r/wallstreetbets, r/StockMarket), and Twitter/X via Nitter. LLM-powered bullish/bearish classification. Background scheduler runs every 30 minutes.

#### 🧠 CORE
- **Dashboard** — KPI strip, indices ticker, watchlist with sparklines, signals, alerts, top movers, news catalysts
- **Ticker Search** — Universal live search across all stocks/ETFs/mutual funds via Yahoo Finance. TradingView advanced chart, 12-stat grid, news feed
- **5-Persona Advisory Engine** — Simultaneous verdicts from Growth Hawk, Value Seeker, Momentum Trader, Defensive Shield, ESG Conscious (LLM-powered)
- **AI Agent** — Real-time stock analyst chat. Computes RSI/MACD/Bollinger Bands/SMA50/200/ATR, identifies support/resistance, builds trade hypotheses with entry/stop/target
- **Morning Brief** — Pre-market summary, global markets, top movers, news catalysts, economic calendar

#### 🏛️ WALL STREET ANALYST MODULES (10 modules, each LLM-powered)
| # | Module | Persona | Output |
|---|--------|---------|--------|
| 1 | **Goldman Sachs Screener** | Senior Equity Analyst | Top 10 picks, P/E vs sector, 5Y revenue growth, D/E health, moat rating, bull/bear targets, risk 1-10 |
| 2 | **Morgan Stanley DCF** | VP Investment Banker | 5Y revenue projection, FCF build, WACC breakdown, terminal value, 5×5 sensitivity grid, verdict |
| 3 | **Bridgewater Risk** | Senior Risk Analyst | Correlation matrix, sector concentration, recession stress test, tail risk, hedging strategies |
| 4 | **JPMorgan Earnings** | Senior Equity Research | 4Q beat/miss history, consensus, segment breakdown, options implied move, Buy/Sell/Wait verdict |
| 5 | **BlackRock Portfolio** | Senior Portfolio Strategist | Asset allocation pie, core vs satellite, expected return, max drawdown, DCA plan, IPS document |
| 6 | **Citadel Technical** | Senior Quant Trader | Multi-timeframe trend, S/R levels, RSI/MACD/BB interpretation, Fibonacci, entry/stop/target + R:R |
| 7 | **Harvard Dividend** | Chief Investment Strategist | 15-20 picks, safety scores, payout analysis, monthly income projection, DRIP 10Y compounding |
| 8 | **Bain Competitive** | Senior Partner | Top 5-7 competitors table, moat analysis, market share trends, SWOT, best pick + catalysts |
| 9 | **Renaissance Patterns** | Quantitative Researcher | Seasonal patterns, insider activity, institutional ownership, short interest, unusual options |
| 10 | **McKinsey Macro** | Senior Partner | USD impact, rate environment, inflation winners/losers, Fed outlook, sector rotation |

Each module includes a **Super-Graphy Chart Renderer** — LLM emits structured JSON that renders as interactive Recharts visualizations (line, bar, pie, heatmap, candlestick, table).

#### 📝 KNOWLEDGE & NOTES
- **Notes & Knowledge** — Obsidian-style workspace with `[[wiki-links]]`, bidirectional backlinks, `#tags` + `$TICKER` auto-extraction, force-directed graph view, full-text search. Prisma + SQLite persistence.
- **Knowledge Graph** — 193-node mindmap showing all 21 sections, 5 personas, 10 analyst modules, and their relationships

#### 🤖 AUTOMATION
- **Email Automation** — Compose + send AI-research emails. 5 templates (morning-brief, portfolio-review, signal-alert, dcf-deepdive, custom). Cron-based scheduler runs every minute. Nodemailer with SMTP, file-stub fallback when no SMTP configured.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | **TypeScript 5** (strict) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (48 components) |
| Charts | **Recharts** v2 |
| Icons | **lucide-react** |
| Database | **Prisma ORM** + **SQLite** |
| AI/LLM | **z-ai-web-dev-sdk** (server-side only) |
| Live Market Data | **yahoo-finance2** v3 (default), Finnhub + Polygon.io (optional) |
| Email | **nodemailer** + **node-cron** scheduler |
| News Scraping | **rss-parser** + **cheerio** |
| Notes Editor | **@mdxeditor/editor** |
| State | React hooks + **@tanstack/react-query** |
| Markdown | **react-markdown** + **remark-gfm** + **rehype-raw** |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ or Bun
- A Z.ai API key (set via `ZAI_API_KEY` env var, or the SDK auto-configures in the Z.ai sandbox)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/BatBond/AI-Investment-Brain-.git
cd AI-Investment-Brain-

# Install dependencies
bun install
# or: npm install

# Set up the database
bun run db:push
# or: npx prisma db push

# (Optional) Seed sample portfolio
bun run scripts/seed_portfolio.js

# Start the dev server
bun run dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env` to `.env.local` and fill in any optional integrations:

```bash
# Database (default — uses local SQLite file)
DATABASE_URL=file:./db/custom.db

# ─── Email (optional) ────────────────────────────────────────────
# If not set, emails are logged to /download/email-log.txt as stubs
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=AI Investment Brain <your-email@gmail.com>

# ─── Market Data (default: yahoo — no key needed) ───────────────
# MARKET_DATA_PROVIDER=yahoo  # or 'finnhub' or 'polygon'
# FINNHUB_API_KEY=your-finnhub-key
# POLYGON_API_KEY=your-polygon-key
```

---

## 📁 Project Structure

```
AI-Investment-Brain-/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main single-page app (sidebar layout)
│   │   ├── layout.tsx                # Root layout (dark theme, fonts, Toaster)
│   │   ├── globals.css               # Bloomberg dark theme variables
│   │   └── api/
│   │       ├── market/               # Yahoo Finance proxy routes
│   │       │   ├── search/
│   │       │   ├── quote/[symbol]/
│   │       │   ├── fundamentals/[symbol]/
│   │       │   ├── historical/[symbol]/
│   │       │   ├── news/[symbol]/
│   │       │   └── indices/
│   │       ├── portfolio/            # Portfolio CRUD + stream + import/export
│   │       ├── watchlist/            # Watchlist CRUD + stream
│   │       ├── sentiment/            # Sentiment scan + articles + overview
│   │       ├── notes/                # Notes CRUD + graph + backlinks
│   │       ├── email/                # Scheduled emails + send-now + logs
│   │       ├── analyst/[moduleId]/   # 10 Wall Street analyst modules (dynamic route)
│   │       ├── personas/             # 5-persona advisory endpoint
│   │       └── agent/chat/           # AI agent chat endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Collapsible left sidebar with section nav
│   │   │   ├── top-bar.tsx           # TopBar with live ticker tape
│   │   │   └── footer.tsx
│   │   ├── sections/                 # 21 section components
│   │   │   ├── dashboard.tsx
│   │   │   ├── ticker-search.tsx
│   │   │   ├── personas.tsx
│   │   │   ├── ai-agent.tsx
│   │   │   ├── morning-brief.tsx
│   │   │   ├── portfolio.tsx         # Portfolio + heatmap + watchlist
│   │   │   ├── sentiment-radar.tsx   # Multi-source news scraping
│   │   │   ├── notes-knowledge.tsx   # Obsidian-style workspace
│   │   │   ├── knowledge-graph.tsx
│   │   │   ├── automation.tsx        # Email automation
│   │   │   ├── gs-screener.tsx       # Goldman Sachs
│   │   │   ├── ms-dcf.tsx            # Morgan Stanley DCF
│   │   │   ├── bw-risk.tsx           # Bridgewater Risk
│   │   │   ├── jpm-earnings.tsx      # JPMorgan Earnings
│   │   │   ├── br-portfolio.tsx      # BlackRock Portfolio
│   │   │   ├── cit-technical.tsx     # Citadel Technical
│   │   │   ├── hv-dividend.tsx       # Harvard Dividend
│   │   │   ├── bain-competitive.tsx  # Bain Competitive
│   │   │   ├── ren-patterns.tsx      # Renaissance Patterns
│   │   │   ├── mck-macro.tsx         # McKinsey Macro
│   │   │   └── _ticker-module.tsx    # Shared HOC for ticker-input modules
│   │   ├── analyst-module-shell.tsx  # Shared shell for analyst modules
│   │   ├── chart-renderer.tsx        # Super-Graphy: LLM JSON → Recharts
│   │   ├── tradingview-widget.tsx    # TradingView embed component
│   │   ├── markdown.tsx              # Markdown renderer with GFM
│   │   ├── loading-states.tsx        # Skeletons + loading callouts
│   │   └── ui/                       # 48 shadcn/ui components
│   ├── hooks/
│   │   └── use-portfolio-stream.ts   # 2s polling hook with price-flash tracking
│   └── lib/
│       ├── market-data.ts            # Mock market data (30 tickers) + formatters
│       ├── market-data-live.ts       # Yahoo Finance + Finnhub + Polygon provider
│       ├── sentiment-sources.ts      # Multi-source news aggregator + LLM scoring
│       ├── analyst-prompts.ts        # System prompts for 10 modules + 5 personas + agent
│       ├── zai.ts                    # ZAI SDK wrapper with 429 retry
│       ├── email.ts                  # Nodemailer + file-stub fallback
│       ├── email-research.ts         # LLM email body generator (5 templates)
│       ├── scheduler.ts              # node-cron scheduler (email + sentiment)
│       ├── scheduler-init.ts         # Singleton init (dev-safe)
│       ├── sections.ts               # 21-section registry with icons + groups
#       ├── db.ts                      # Prisma client singleton
#       └── utils.ts                   # cn() helper
├── prisma/
│   └── schema.prisma                 # Note, ScheduledEmail, EmailLog,
│                                     # PortfolioPosition, WatchlistItem, SentimentArticle
├── mini-services/
│   └── portfolio-stream/             # WebSocket service for real-time P&L
│                                     # (reference impl — app uses HTTP polling instead)
├── scripts/
│   ├── build_mindmap.py              # Generates knowledge graph PNG/HTML/Mermaid
│   ├── seed_portfolio.js             # Seeds portfolio from xlsx
│   └── read_xlsx.js                  # Helper for parsing broker exports
├── public/
│   ├── knowledge-graph.png           # 193-node mindmap
│   └── logo.svg
├── prisma/schema.prisma
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── eslint.config.mjs
└── .env                              # Environment template
```

---

## 🎨 Design System

**Bloomberg Dark theme** — built for long sessions of dense financial data:

| Token | Color | Usage |
|-------|-------|-------|
| Background | `#0F172A` | App bg |
| Surface | `#1E293B` | Cards, tables |
| Border | `#334155` | Dividers |
| Text Primary | `#F1F5F9` | Headings |
| Text Secondary | `#94A3B8` | Labels |
| Amber | `#FBBF24` | CTA, highlights |
| Cyan | `#22D3EE` | AI, data viz |
| Green | `#10B981` | Buy, positive |
| Red | `#EF4444` | Sell, negative |
| Violet | `#A78BFA` | Personas |

- **Typography**: Inter (sans) + JetBrains Mono (numbers, with `font-variant-numeric: tabular-nums`)
- **Responsive**: Mobile-first. Sidebar slides over on mobile (Sheet), 3-pane layouts collapse to single column.
- **Animations**: 300ms CSS transitions on heatmap tiles, price flash animations on table cells, smooth number interpolation.

---

## 📊 Real-Time Updates

The app uses **HTTP polling every 2 seconds** (Yahoo Finance's effective refresh rate — going faster just hits cached data). The "millisecond feel" comes from:

- 300ms CSS color transitions on heatmap tiles
- 300ms price flash animations (green/red bg pulse on change)
- Smooth number interpolation between old → new values

A reference WebSocket mini-service is included in `mini-services/portfolio-stream/` but isn't used in production (sandbox supervisors kill background processes).

---

## 🤖 AI Integration

The app uses `z-ai-web-dev-sdk` (server-side only). All LLM calls go through `src/lib/zai.ts` which includes:

- Singleton ZAI client
- 429 retry with 2.5s backoff
- Sequential persona calls (1.2s spacing to avoid rate limits)
- Configurable temperature + maxTokens per use case

**System prompts** for all 10 analyst modules, 5 personas, and the AI agent live in `src/lib/analyst-prompts.ts`. Each prompt establishes a firm-level persona ("You are a senior equity analyst at Goldman Sachs with 20 years of experience...") and specifies the exact output format.

---

## 📰 Sentiment Radar Sources

The AI brain scans these public sources (no API keys required for any of them):

| Source | Method | Notes |
|--------|--------|-------|
| **Yahoo Finance** | `yahoo-finance2` SDK | Most reliable. Returns publisher + relatedTickers. |
| **Google News** | RSS feed (`news.google.com/rss/search`) | Broad coverage, no key needed. |
| **Reddit** | RSS feeds for r/stocks, r/investing, r/wallstreetbets, r/StockMarket | Retail sentiment signal. |
| **Twitter/X** | Nitter RSS instances (fallback) | Unreliable — Nitter instances frequently go down. Wrapped in try/catch. |

Each article is scored by an LLM as **bullish** / **bearish** / **neutral** with a score from -1.0 to +1.0. Articles persist to the `SentimentArticle` Prisma model.

---

## 🗄️ Database Schema

6 Prisma models power the app:

```prisma
model Note {
  id, title, content, tags (JSON), tickerRefs (JSON),
  links (JSON), pinned, createdAt, updatedAt
}

model ScheduledEmail {
  id, name, recipient, subject, template, cronExpr,
  ticker, portfolioJson, enabled, lastRunAt, nextRunAt,
  lastStatus, lastError, createdAt, updatedAt
}

model EmailLog {
  id, scheduledEmailId, recipient, subject, body,
  status, error, sentAt
}

model PortfolioPosition {
  id, symbol, description, quantity, avgCostBasis,
  costBasisTotal, type, source, createdAt, updatedAt
}

model WatchlistItem {
  id, symbol, name, notes, addedAt
}

model SentimentArticle {
  id, ticker, source, title, url, summary,
  sentiment, sentimentScore, publishedAt, fetchedAt
}
```

---

## 🔧 Available Scripts

```bash
bun run dev          # Start dev server (port 3000)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint
bun run db:push      # Push Prisma schema to SQLite
bun run db:generate  # Regenerate Prisma client
bun run db:migrate   # Create + apply migration
bun run db:reset     # Reset database (destructive)
```

Helper scripts in `scripts/`:
```bash
python scripts/build_mindmap.py    # Regenerate knowledge graph PNG/HTML/Mermaid
node scripts/seed_portfolio.js     # Seed portfolio from upload/Portfolio_Positions.xlsx
```

---

## 🚢 Deployment

### Vercel (recommended — takes ~5 minutes)

The repo is pre-configured for Vercel with:
- `vercel.json` — cron jobs for scheduled emails + sentiment scans
- `scripts/select-schema.sh` — auto-detects SQLite (local) vs PostgreSQL (production)
- `prisma/schema.sqlite.prisma` + `prisma/schema.postgres.prisma` — both schemas ready
- `src/app/api/cron/*` — serverless cron endpoints (replace in-process scheduler)

#### Step-by-step:

1. **Push to GitHub** (already done if you cloned from GitHub)

2. **Create a free PostgreSQL database** (pick one):
   - **Neon** (recommended): https://neon.tech — sign up, create project, copy connection string
   - **Supabase**: https://supabase.com — create project, copy Database URL
   - **Vercel Postgres**: https://vercel.com/docs/storage — create in Vercel dashboard

3. **Import repo on Vercel**:
   - Go to https://vercel.com/new
   - Import `BatBond/AI-Investment-Brain-`
   - Vercel auto-detects Next.js — no framework config needed

4. **Add environment variables** (Vercel dashboard → Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://user:password@host/db?sslmode=require
   ZAI_API_KEY=your-zai-api-key
   CRON_SECRET=<generate with: openssl rand -hex 32>
   # Optional:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=AI Investment Brain <your-email@gmail.com>
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy** — Vercel will:
   - Run `bun install`
   - Run `postinstall` → `select-schema.sh` (switches to PostgreSQL schema, runs `prisma generate`)
   - Run `vercel-build` → `select-schema.sh && next build`
   - Set up Cron Jobs from `vercel.json`

6. **Push database schema** (one-time, after first deploy):
   - Local terminal:
     ```bash
     DATABASE_URL="postgresql://user:password@host/db?sslmode=require" bun run db:push
     ```
   - Or use Vercel CLI:
     ```bash
     vercel env pull .env.local
     bun run db:push
     ```

7. **Seed portfolio** (optional, if you have an xlsx):
   ```bash
   DATABASE_URL="postgresql://..." node scripts/seed_portfolio.js
   ```

8. **Verify cron jobs** (Vercel dashboard → your project → Cron tab):
   - `/api/cron/scheduled-emails` — runs every minute
   - `/api/cron/sentiment-scan` — runs every 30 min
   - Both require `CRON_SECRET` env var for security

#### Vercel-specific notes:

- **SQLite doesn't work on Vercel** — serverless functions don't persist local files. The `select-schema.sh` script auto-detects this and switches to PostgreSQL when `DATABASE_URL` starts with `postgres://` or `postgresql://`.
- **`node-cron` doesn't work on serverless** — replaced by Vercel Cron Jobs (defined in `vercel.json`). The in-process scheduler (`src/lib/scheduler.ts`) is automatically disabled in production.
- **Long-running LLM calls** — Vercel Hobby plan has 60s function timeout. The `vercel.json` sets `maxDuration: 60` for analyst/personas/agent/email/sentiment routes. Pro plan allows up to 300s.
- **WebSocket mini-service** — not deployed to Vercel (no persistent processes). The app uses HTTP polling + client-side interpolation instead, which works great on serverless.

### Self-hosted (Docker / VPS)

```bash
# Clone and install
git clone https://github.com/BatBond/AI-Investment-Brain-.git
cd AI-Investment-Brain-
bun install

# Configure
cp .env.example .env
# Edit .env with your DATABASE_URL, ZAI_API_KEY, SMTP_*, etc.

# Push schema + build
bun run db:push
bun run build

# Start production server
bun run start
```

Use PM2 or systemd for process management:
```bash
pm2 start "bun run start" --name ai-brain
pm2 save
pm2 startup
```

For self-hosted, the in-process `node-cron` scheduler (`src/lib/scheduler.ts`) handles scheduled emails + sentiment scans automatically. No need for Vercel Cron.

---

## ⚠️ Known Limitations

- **Yahoo Finance rate limits** — heavy concurrent use may slow responses. The caching layer (60s quotes / 5min fundamentals / 1h historical) mitigates this.
- **Twitter/X via Nitter** is unreliable. The aggregator falls back gracefully — if all Nitter instances fail, you still get Yahoo + Google + Reddit articles.
- **Email scheduler runs in-process** — resets on server restart. For production use a separate worker process or external cron.
- **Market data is delayed ~15 min** via Yahoo's free tier. For real-time WebSocket data, plug in Polygon or Finnhub with paid keys.
- **Notes graph view** uses basic physics — for very large note counts (>500), consider upgrading to d3-force.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- **Yahoo Finance** for free market data via `yahoo-finance2`
- **TradingView** for free embeddable charts
- **shadcn/ui** for the beautiful component library
- **Z.ai** for the LLM SDK
- **Recharts** for data visualization

---

## 🔗 Links

- **Live Demo**: (deploy and add URL here)
- **GitHub**: [BatBond/AI-Investment-Brain-](https://github.com/BatBond/AI-Investment-Brain-)
- **Issues**: [Report a bug](https://github.com/BatBond/AI-Investment-Brain-/issues)

---

**Built with ❤️ for equity research analysts who want Bloomberg-grade tools without the Bloomberg price tag.**
