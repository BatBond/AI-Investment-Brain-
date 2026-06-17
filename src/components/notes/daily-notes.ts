/**
 * Daily notes helpers — template rendering, date navigation, detection.
 * Pure functions, safe for both client + server.
 */

export interface DailyNoteTemplate {
  title: string;
  content: string;
}

/** Format a Date as YYYY-MM-DD in local time (no timezone shift). */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function shiftDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Build the default daily-note template body for a given date. */
export function buildDailyNoteContent(date: Date): string {
  const dateStr = formatDate(date);
  const yesterday = formatDate(shiftDate(date, -1));
  const tomorrow = formatDate(shiftDate(date, +1));
  return `# ${dateStr}

## Market Summary
- Pre-market:
- Top mover:
- News catalysts:

## Watchlist
-

## Trade Ideas
-

## Notes
-

## Links
- [[${yesterday}]]
- [[${tomorrow}]]
`;
}

export function buildDailyNote(date: Date): DailyNoteTemplate {
  return {
    title: formatDate(date),
    content: buildDailyNoteContent(date),
  };
}

/** Returns true if a note title looks like a daily note (YYYY-MM-DD). */
export function isDailyNoteTitle(title: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(title.trim());
}

// ── Predefined note templates ───────────────────────────────────────
export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  build: (opts: { ticker?: string; title?: string; date?: Date }) => DailyNoteTemplate;
}

export const PREDEFINED_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    name: "Blank note",
    description: "Empty note",
    build: () => ({ title: "Untitled note", content: "" }),
  },
  {
    id: "stock-thesis",
    name: "Stock Thesis",
    description: "Bull/bear case, valuation, catalysts",
    build: ({ ticker = "AAPL", title }) => ({
      title: title || `${ticker} Thesis`,
      content: `# ${title || `${ticker} Thesis`}

## Investment Summary
- **Position:** Long / Short / Watch
- **Conviction:** 1-10
- **Time horizon:** 3M / 6M / 1Y / Multi-year

## Bull Case
- 
- 
- 

## Bear Case
- 
- 
- 

## Valuation
- **Current price:** $X
- **Fair value:** $X (method: DCF / multiple / sum-of-parts)
- **Upside/downside:** ±X%

## Catalysts (next 6M)
- 
- 

## Risks
- 
- 

## References
- $${ticker}
- [[${ticker} earnings]]
- [[macro outlook]]
`,
    }),
  },
  {
    id: "earnings-preview",
    name: "Earnings Preview",
    description: "Pre-earnings analysis",
    build: ({ ticker = "AAPL", title }) => ({
      title: title || `${ticker} Earnings Preview`,
      content: `# ${title || `${ticker} Earnings Preview`}

## Earnings Date
- **Date:** YYYY-MM-DD (after-market / pre-market)
- **Days until:** X

## Consensus
- **EPS:** $X (vs $X prior year, +X% YoY)
- **Revenue:** $X.X B (vs $X.X B prior year, +X% YoY)

## Key KPIs to Watch
- 
- 
- 

## Bull / Bear Scenarios
- **Bull (+5%):** 
- **Base (±2%):** 
- **Bear (-5%):** 

## Trade Plan
- **Entry:** $X
- **Stop:** $X
- **Target:** $X
- **Position size:** X% of account

## References
- $${ticker}
- [[${ticker} Q-X earnings]]
`,
    }),
  },
  {
    id: "trade-journal",
    name: "Trade Journal",
    description: "Record a completed trade",
    build: ({ ticker = "AAPL", title }) => ({
      title: title || `${ticker} Trade Journal`,
      content: `# ${title || `${ticker} Trade Journal`}

## Trade Details
- **Ticker:** $${ticker}
- **Direction:** Long / Short
- **Entry date:** YYYY-MM-DD
- **Entry price:** $X
- **Exit date:** YYYY-MM-DD
- **Exit price:** $X
- **Quantity:** X shares
- **P&L:** $X (+X%)

## Thesis (at entry)
- 

## What went right
- 

## What went wrong
- 

## Lessons learned
- 

## References
- $${ticker}
- [[${ticker} thesis]]
`,
    }),
  },
  {
    id: "sector-analysis",
    name: "Sector Analysis",
    description: "Sector / industry deep dive",
    build: ({ title }) => ({
      title: title || "Sector Analysis",
      content: `# ${title || "Sector Analysis"}

## Sector Overview
- **Sector:** 
- **Market size:** $X B
- **Growth rate:** X% CAGR
- **Stage:** Early / Growth / Mature / Declining

## Top Players
| Ticker | Company | Market Share | Notes |
|--------|---------|--------------|-------|
|  |  |  |  |

## Tailwinds
- 
- 

## Headwinds
- 
- 

## Picks
- **Best-positioned:** 
- **Value pick:** 
- **Avoid:** 

## References
- [[sector rotation]]
`,
    }),
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Captured conversation",
    build: ({ title }) => ({
      title: title || "Meeting Notes",
      content: `# ${title || "Meeting Notes"}

## Meta
- **Date:** YYYY-MM-DD
- **Attendees:** 
- **Topic:** 

## Agenda
- 
- 

## Notes
- 

## Action items
- [ ] 
- [ ] 
`,
    }),
  },
  {
    id: "daily",
    name: "Daily Note",
    description: "Today's market journal",
    build: ({ date }) => {
      const d = date || today();
      return buildDailyNote(d);
    },
  },
];

export function getTemplate(id: string): NoteTemplate | undefined {
  return PREDEFINED_TEMPLATES.find((t) => t.id === id);
}

// ── Frontmatter (YAML) parsing ──────────────────────────────────────
export interface Frontmatter {
  title?: string;
  tags?: string[];
  ticker?: string;
  date?: string;
  pinned?: boolean;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

export function parseFrontmatter(content: string): { fm: Frontmatter; body: string } {
  const m = FRONTMATTER_RE.exec(content);
  if (!m) return { fm: {}, body: content };
  const yaml = m[1];
  const body = m[2] || "";
  const fm: Frontmatter = {};
  // Tiny YAML parser — handles only the subset we emit.
  for (const line of yaml.split("\n")) {
    const mm = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!mm) continue;
    const key = mm[1];
    const val = mm[2];
    if (val.startsWith("[") && val.endsWith("]")) {
      const inner = val.slice(1, -1).trim();
      const arr = inner
        ? inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))
        : [];
      (fm as Record<string, unknown>)[key] = arr;
    } else if (val === "true") {
      (fm as Record<string, unknown>)[key] = true;
    } else if (val === "false") {
      (fm as Record<string, unknown>)[key] = false;
    } else {
      const cleaned = val.replace(/^["']|["']$/g, "");
      (fm as Record<string, unknown>)[key] = cleaned;
    }
  }
  return { fm, body };
}

export function buildFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ["---"];
  if (fm.title !== undefined) lines.push(`title: ${fm.title}`);
  if (fm.tags && fm.tags.length) {
    lines.push(`tags: [${fm.tags.map((t) => t).join(", ")}]`);
  } else if (fm.tags !== undefined) {
    lines.push("tags: []");
  }
  if (fm.ticker !== undefined) lines.push(`ticker: ${fm.ticker}`);
  if (fm.date !== undefined) lines.push(`date: ${fm.date}`);
  if (fm.pinned !== undefined) lines.push(`pinned: ${fm.pinned}`);
  lines.push("---");
  return lines.join("\n");
}

export function withFrontmatter(fm: Frontmatter, body: string): string {
  return `${buildFrontmatter(fm)}\n${body}`;
}
