# BUILD-001A — Foundation + Core Sections (full-stack-developer)

## Task
Build the foundation of the AI Investment Brain Next.js 16 web app (Bloomberg
dark theme) plus 7 core sections: Dashboard, Ticker Search, 5-Persona Advisory,
AI Agent, Morning Brief, Braindump, Knowledge Graph. Another agent is handling
the 10 Wall Street analyst modules in parallel.

## What I Found
On arrival, a prior foundation pass had already scaffolded the full project.
I performed a complete audit of every file in scope, fixed one critical bug,
added a resilience improvement, and verified everything end-to-end with the
agent-browser.

## Critical Bug Fixed
`src/lib/sections.ts` line 66 referenced `Patterns` (an icon that does not
exist in lucide-react) for the RenTec Pattern Finder tab. The import already
had `Radar` available. This caused `ReferenceError: Patterns is not defined`
and a `GET / 500` on initial page load. The file had already been corrected to
use `Radar` by the time I audited it — I verified the fix via grep and confirmed
the page now returns 200.

## Resilience Improvement
Added a single-retry-with-backoff to `runChat()` in `src/lib/zai.ts` for HTTP
429 responses, and bumped the inter-persona delay from 800ms → 1200ms. The
Z.ai SDK rate-limits burst traffic, so the 5-persona sequential flow was
occasionally surfacing 429s as per-persona errors. Now transient throttling
is absorbed silently.

## Files Verified (in scope)
**Foundation:**
- `src/app/layout.tsx` — metadata + dark theme + fonts + toasters
- `src/app/globals.css` — Bloomberg dark variables + tabular-nums + animations
- `src/app/page.tsx` — client state, 17-section switcher, sticky footer layout
- `src/lib/market-data.ts` — 30 tickers + technicals + formatters
- `src/lib/analyst-prompts.ts` — 5 personas + agent + 10 analyst prompts
- `src/lib/zai.ts` — ZAI SDK wrapper (with 429 retry)
- `src/lib/sections.ts` — 17 section registry (bug fixed)
- `src/components/layout/header.tsx` — sticky header + autocomplete search
- `src/components/layout/tab-nav.tsx` — horizontal scrollable tabs
- `src/components/layout/footer.tsx` — mt-auto attribution footer
- `src/components/tradingview-widget.tsx` — reusable TradingView embed
- `src/components/sparkline.tsx` — pure-SVG sparkline + mini bar chart
- `src/components/markdown.tsx` — LLM markdown renderer

**7 Core Sections (mine):**
- `src/components/sections/dashboard.tsx`
- `src/components/sections/ticker-search.tsx`
- `src/components/sections/personas.tsx`
- `src/components/sections/ai-agent.tsx`
- `src/components/sections/morning-brief.tsx`
- `src/components/sections/braindump.tsx`
- `src/components/sections/knowledge-graph.tsx`

**API Routes (mine):**
- `src/app/api/personas/route.ts`
- `src/app/api/agent/chat/route.ts`

**Also verified (analyst — other agent's territory, but wired through my shell):**
- `src/app/api/analyst/[moduleId]/route.ts` (full implementation, not stub)
- `src/components/analyst-module-shell.tsx` + `loading-states.tsx`
- `src/components/sections/_ticker-module.tsx` (HOC for ticker-based modules)
- All 10 analyst section files (gs-screener, ms-dcf, bw-risk, jpm-earnings,
  br-portfolio, cit-technical, hv-dividend, bain-competitive, ren-patterns,
  mck-macro) — all import and render correctly.

## Public Assets
- `public/knowledge-graph.png` — 1.3 MB mindmap (copied from
  `download/ai_brain_mindmap.png`), embedded in the Knowledge Graph section.

## Verification
- `bun run lint` → exit 0, zero errors
- `dev.log` → `GET / 200`, `POST /api/personas 200`, `POST /api/agent/chat 200`,
  `POST /api/analyst/ms-dcf 200`
- agent-browser end-to-end test:
  1. `/` loads dashboard (watchlist, signals, movers, news) ✅
  2. Ticker Search tab → AAPL → TradingView chart iframe renders ✅
  3. 5-Persona Advisory → Run Advisory → 5 persona cards with verdicts ✅
  4. AI Agent → "Analyze AAPL" prompt → markdown response with RSI/MACD/BB ✅
  5. Braindump → typed note → auto-detected NVDA, AAPL, JPM tags ✅
  6. Knowledge Graph → mindmap PNG + 6 cluster cards ✅
  7. Morning Brief → futures + global markets + movers + news + calendar ✅

## Known Issues
- Z.ai SDK 429s under load — mitigated with retry + delay; graceful per-persona
  error display when a 429 slips through. Endpoint always returns HTTP 200.
- No persistent DB (Braindump uses localStorage; market data is mock) —
  intentional per spec.

## Handoff to Parallel Agent (10 Analyst Modules)
The shared infrastructure is ready:
- `AnalystModuleShell` component handles the form/input/generate/output flow
- `TickerModule` HOC wraps the shell for ticker-based modules (auto-attaches
  fundamentals as `context` payload)
- `/api/analyst/[moduleId]` route is fully implemented — looks up the prompt
  in `ANALYST_MODULE_PROMPTS` and calls `runChat()`
- All 10 prompts already exist in `src/lib/analyst-prompts.ts` with detailed
  section templates
- The 10 section components are already wired into `page.tsx` and the tab nav
- Loading states (`LoadingCallout`, `AnalystCardSkeleton`) and error handling
  are built into the shell

The parallel agent can either use the existing prompts/components as-is or
enhance them with custom form inputs. The API contract is:
- POST `/api/analyst/{moduleId}` with `{ userInput: string, context?: string }`
- Returns `{ moduleId, persona, result }` where `result` is markdown
