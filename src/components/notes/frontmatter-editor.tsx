"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Frontmatter } from "./daily-notes";

interface FrontmatterEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  /** Existing notes — used to suggest ticker refs from note titles. */
  existingTickers?: string[];
}

/** A collapsible "Properties" panel above the markdown editor that lets
 *  users edit YAML frontmatter (title, tags, ticker, pinned, date) via
 *  form inputs rather than raw YAML. */
export function FrontmatterEditor({
  content,
  onChange,
  existingTickers = [],
}: FrontmatterEditorProps) {
  const [expanded, setExpanded] = useState(true);
  const [fm, setFm] = useState<Frontmatter>({});
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Parse frontmatter on content change
  useEffect(() => {
    const { fm: parsed, body: parsedBody } = parseLightweight(content);
    setFm(parsed);
    setBody(parsedBody);
  }, [content]);

  function updateFm(patch: Partial<Frontmatter>) {
    const next = { ...fm, ...patch };
    setFm(next);
    onChange(serializeLightweight(next, body));
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    if (!fm.tags || !fm.tags.includes(t)) {
      updateFm({ tags: [...(fm.tags || []), t] });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateFm({ tags: (fm.tags || []).filter((t) => t !== tag) });
  }

  const hasAny =
    fm.title || (fm.tags && fm.tags.length) || fm.ticker || fm.date || fm.pinned !== undefined;

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50"
      >
        <span className="flex items-center gap-1.5 font-medium">
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Properties
          {hasAny && (
            <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
              {[
                fm.title ? "title" : null,
                fm.tags?.length ? `${fm.tags.length} tags` : null,
                fm.ticker ? `$${fm.ticker}` : null,
                fm.date ? fm.date : null,
                fm.pinned ? "pinned" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </span>
        <span className="text-[10px] text-slate-500">YAML frontmatter</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-2 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">
              Title
              <input
                value={fm.title || ""}
                onChange={(e) => updateFm({ title: e.target.value })}
                placeholder="Note title"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 font-normal normal-case tracking-normal"
              />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">
              Ticker
              <input
                value={fm.ticker || ""}
                onChange={(e) =>
                  updateFm({ ticker: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })
                }
                placeholder="AAPL"
                list="frontmatter-tickers"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 font-mono font-normal normal-case tracking-normal"
              />
              <datalist id="frontmatter-tickers">
                {existingTickers.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">
              Date
              <input
                type="date"
                value={fm.date || ""}
                onChange={(e) => updateFm({ date: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 font-normal normal-case tracking-normal"
              />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 flex items-end pb-1">
              <input
                type="checkbox"
                checked={!!fm.pinned}
                onChange={(e) => updateFm({ pinned: e.target.checked })}
                className="mr-1.5"
              />
              Pinned
            </label>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Tags</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(fm.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-700/40 bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300"
                >
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    className="hover:text-rose-300"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="add tag…"
                className="bg-transparent text-[11px] text-slate-100 outline-none w-24"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lightweight frontmatter parser/serializer ───────────────────────
// (We keep the heavier version in daily-notes.ts; this one is local to
// the editor and avoids re-imports.)

function parseLightweight(content: string): { fm: Frontmatter; body: string } {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(content);
  if (!m) return { fm: {}, body: content };
  const yaml = m[1];
  const body = m[2] || "";
  const fm: Frontmatter = {};
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
      (fm as Record<string, unknown>)[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return { fm, body };
}

function serializeLightweight(fm: Frontmatter, body: string): string {
  const lines: string[] = ["---"];
  if (fm.title !== undefined && fm.title !== "") lines.push(`title: ${fm.title}`);
  if (fm.tags !== undefined) {
    lines.push(`tags: [${(fm.tags || []).join(", ")}]`);
  }
  if (fm.ticker !== undefined && fm.ticker !== "") lines.push(`ticker: ${fm.ticker}`);
  if (fm.date !== undefined && fm.date !== "") lines.push(`date: ${fm.date}`);
  if (fm.pinned !== undefined) lines.push(`pinned: ${fm.pinned}`);
  lines.push("---");
  return `${lines.join("\n")}\n${body}`;
}
