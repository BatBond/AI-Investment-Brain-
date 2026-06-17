"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StickyNote,
  Plus,
  Search,
  Tag,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
}

const STORAGE_KEY = "aib-braindump-notes-v1";

function detectTickers(text: string): string[] {
  // Match $TICKER or bare 2-5 uppercase ticker-like tokens
  const tagged = Array.from(text.matchAll(/\$([A-Z]{1,5})\b/g)).map((m) => m[1]);
  const bare = Array.from(
    text.matchAll(/(?<![\w$])([A-Z]{2,5})(?![\w])/g)
  ).map((m) => m[1]);
  const all = [...new Set([...tagged, ...bare])];
  // Filter to plausible tickers (no common words). Keep short list of stopwords.
  const stop = new Set([
    "API",
    "AI",
    "URL",
    "USD",
    "ETF",
    "CEO",
    "CFO",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "YOY",
    "MOM",
    "ROI",
    "ROE",
    "ROA",
    "EPS",
    "PE",
    "PB",
    "FCF",
    "GDP",
    "CPI",
    "FED",
    "USA",
    "UK",
    "EU",
    "IT",
    "IS",
    "AS",
    "AT",
    "BE",
    "BY",
    "DO",
    "GO",
    "IF",
    "IN",
    "ME",
    "MY",
    "NO",
    "OF",
    "ON",
    "OR",
    "SO",
    "TO",
    "UP",
    "US",
    "WE",
    "AM",
    "PM",
    "OK",
    "FY",
    "YTD",
    "MTD",
    "BPS",
    "NAV",
    "AUM",
    "KPI",
    "OPEX",
    "CAPEX",
    "SGA",
    "EBIT",
    "EBITDA",
    "IPO",
    "M&A",
    "FY",
    "BBL",
    "BPS",
  ]);
  return all.filter((t) => !stop.has(t)).slice(0, 8);
}

export function Braindump() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, loaded]);

  const detectedTags = useMemo(() => detectTickers(content), [content]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes;
    if (activeTag) list = list.filter((n) => n.tags.includes(activeTag));
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, filter, activeTag]);

  function addNote() {
    if (!content.trim()) {
      toast.error("Note is empty.");
      return;
    }
    const tags = detectedTags;
    const note: Note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: content.trim(),
      tags,
      createdAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setContent("");
    toast.success(`Note saved${tags.length ? ` · ${tags.length} tag(s) detected` : ""}.`);
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted.");
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <StickyNote className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-50">Braindump / Notes</CardTitle>
              <CardDescription className="text-xs text-amber-400/90">
                Capture research thoughts fast. Tickers ($AAPL or bare AAPL) auto-detect as tags.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a quick note. Try: NVDA breaking out on volume, watch $560 level. Or: JPM earnings beat — guided NII higher..."
              rows={4}
              className="bg-slate-900/70 border-slate-700 text-slate-100 placeholder:text-slate-500 font-mono text-sm"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  Detected tags:
                </span>
                {detectedTags.length === 0 ? (
                  <span className="text-xs text-slate-500">—</span>
                ) : (
                  detectedTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-700/60 bg-amber-900/20 px-2 py-0.5 text-[11px] font-mono text-amber-300"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {t}
                    </span>
                  ))
                )}
              </div>
              <Button
                onClick={addNote}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Save Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-50">Notes ({filtered.length})</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Saved locally in your browser
            </CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search notes..."
              className="h-8 bg-slate-900/70 border-slate-700 pl-8 text-xs text-slate-100"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-700/50">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">
                Filter:
              </span>
              <button
                onClick={() => setActiveTag(null)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px]",
                  !activeTag
                    ? "border-amber-500 bg-amber-500/15 text-amber-300"
                    : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                )}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t === activeTag ? null : t)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-mono",
                    activeTag === t
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
                      : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">
              {notes.length === 0
                ? "No notes yet. Type something above and hit Save."
                : "No notes match your filter."}
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className="group rounded-md border border-slate-700 bg-slate-900/40 p-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-200 whitespace-pre-wrap flex-1 leading-relaxed">
                      {n.content}
                    </p>
                    <button
                      onClick={() => removeNote(n.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {n.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded border border-amber-700/40 bg-amber-900/15 px-1.5 py-0.5 text-[10px] font-mono text-amber-300"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(n.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
