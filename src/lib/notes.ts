/**
 * Notes helper: extract tags, ticker refs, and wiki-links from note content.
 */

export interface ExtractedMeta {
  tags: string[]; // includes "ticker:AAPL" entries for $TICKER refs
  tickerRefs: string[]; // e.g. ["AAPL","NVDA"]
  links: string[]; // wiki-link target titles
}

export function extractMeta(content: string): ExtractedMeta {
  if (!content) return { tags: [], tickerRefs: [], links: [] };

  // $TICKER refs (1-5 uppercase letters preceded by $)
  const tickerSet = new Set<string>();
  for (const m of content.matchAll(/\$([A-Z]{1,5})\b/g)) {
    tickerSet.add(m[1]);
  }
  const tickerRefs = Array.from(tickerSet);

  // Hashtags — only valid identifiers (#word, #word-with-dash)
  const tagSet = new Set<string>();
  for (const m of content.matchAll(/(?:^|\s)#([a-zA-Z][\w-]*)/g)) {
    tagSet.add(m[1].toLowerCase());
  }
  // Add ticker:AAPL style tags
  for (const t of tickerRefs) {
    tagSet.add(`ticker:${t}`);
  }

  // Wiki-links [[Target Title]]
  const linkSet = new Set<string>();
  for (const m of content.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const target = m[1].trim();
    if (target) linkSet.add(target);
  }

  return {
    tags: Array.from(tagSet),
    tickerRefs,
    links: Array.from(linkSet),
  };
}

/** Title-aware tag + ticker extraction. Re-extracts and merges with
 *  any explicit tags passed (e.g. user-edited tags). */
export function mergeExplicitTags(auto: string[], explicit: string[]): string[] {
  const set = new Set(auto);
  for (const t of explicit) {
    const norm = t.trim();
    if (norm) set.add(norm.toLowerCase());
  }
  return Array.from(set);
}

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  tickerRefs: string;
  links: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  tags: string[];
  tickerRefs: string[];
  links: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toDTO(n: NoteRow): NoteDTO {
  let tags: string[] = [];
  let tickerRefs: string[] = [];
  let links: string[] = [];
  try { tags = JSON.parse(n.tags || "[]"); } catch { /* ignore */ }
  try { tickerRefs = JSON.parse(n.tickerRefs || "[]"); } catch { /* ignore */ }
  try { links = JSON.parse(n.links || "[]"); } catch { /* ignore */ }
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    tags,
    tickerRefs,
    links,
    pinned: n.pinned,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : new Date(n.createdAt as unknown as string).toISOString(),
    updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : new Date(n.updatedAt as unknown as string).toISOString(),
  };
}
