"use client";

import { useEffect, useRef, useState } from "react";

interface WikiAutocompleteProps {
  /** Currently active textarea element. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (newContent: string) => void;
  /** Existing notes to suggest when typing [[ */
  existingNotes: { id: string; title: string; content: string; tags: string[] }[];
}

interface Suggestion {
  type: "wiki" | "ticker" | "create";
  label: string;
  sub?: string;
  insertText: string;
  /** Replace this many chars before the cursor with insertText. */
  replaceChars: number;
}

/** Detects `[[` or `$` at the cursor position in a textarea and shows an
 *  autocomplete dropdown. Keyboard: ↑/↓ to navigate, Enter/Tab to insert,
 *  Esc to cancel. */
export function WikiAutocomplete({
  textareaRef,
  content,
  onChange,
  existingNotes,
}: WikiAutocompleteProps) {
  const [query, setQuery] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<"wiki" | "ticker" | null>(null);
  const [replaceStart, setReplaceStart] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0 });

  const suggestions: Suggestion[] = query
    ? trigger === "wiki"
      ? buildWikiSuggestions(query, existingNotes)
      : buildTickerSuggestions(query)
    : [];

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Re-evaluate trigger when content changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || document.activeElement !== ta) {
      setQuery(null);
      setTrigger(null);
      return;
    }
    const pos = ta.selectionStart;
    const before = content.slice(0, pos);
    // Detect `[[<query>` (no closing ]])
    const wikiMatch = /\[\[([^\]\n]*)$/.exec(before);
    const tickerMatch = /\$([A-Z]*)$/.exec(before);
    if (wikiMatch) {
      setTrigger("wiki");
      setQuery(wikiMatch[1]);
      setReplaceStart(pos - wikiMatch[1].length - 2); // include [[
      updateCaretPos(ta, pos);
    } else if (tickerMatch) {
      setTrigger("ticker");
      setQuery(tickerMatch[1]);
      setReplaceStart(pos - tickerMatch[1].length - 1); // include $
      updateCaretPos(ta, pos);
    } else {
      setQuery(null);
      setTrigger(null);
    }
  }, [content, textareaRef]);

  function updateCaretPos(ta: HTMLTextAreaElement, pos: number) {
    // Approximate caret coordinates for dropdown positioning
    const div = document.createElement("div");
    const style = window.getComputedStyle(ta);
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.font = style.font;
    div.style.padding = style.padding;
    div.style.width = style.width;
    div.textContent = ta.value.slice(0, pos);
    document.body.appendChild(div);
    const span = document.createElement("span");
    span.textContent = ta.value.slice(pos) || ".";
    div.appendChild(span);
    const taRect = ta.getBoundingClientRect();
    setCaretPos({
      x: span.offsetLeft,
      y: span.offsetTop + 18,
    });
    document.body.removeChild(div);
    void taRect;
  }

  function applySuggestion(s: Suggestion) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const after = content.slice(pos);
    const next = content.slice(0, replaceStart) + s.insertText + after;
    onChange(next);
    setQuery(null);
    setTrigger(null);
    const newPos = replaceStart + s.insertText.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!query || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const s = suggestions[activeIdx];
      if (s) applySuggestion(s);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery(null);
      setTrigger(null);
    }
  }

  // Attach keydown listener to textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener("keydown", onKeyDown as unknown as EventListener);
    return () => {
      ta.removeEventListener("keydown", onKeyDown as unknown as EventListener);
    };
  }, [query, activeIdx, suggestions.length]);

  if (!query || suggestions.length === 0 || !trigger) return null;

  return (
    <div
      className="absolute z-50 w-72 rounded-md border border-slate-700 bg-slate-900 shadow-xl overflow-hidden"
      style={{ left: caretPos.x, top: caretPos.y }}
    >
      <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 border-b border-slate-700 bg-slate-900/80">
        {trigger === "wiki" ? "Link to note" : "Ticker reference"}
      </div>
      <div className="max-h-48 overflow-y-auto aib-scroll">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onMouseDown={(e) => {
              e.preventDefault();
              applySuggestion(s);
            }}
            onMouseEnter={() => setActiveIdx(i)}
            className={`block w-full text-left px-2 py-1.5 text-xs transition-colors ${
              i === activeIdx
                ? "bg-amber-500/15 text-amber-200"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <div className="font-medium truncate">{s.label}</div>
            {s.sub && (
              <div className="text-[10px] text-slate-500 truncate">{s.sub}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildWikiSuggestions(
  query: string,
  notes: { id: string; title: string; content: string; tags: string[] }[]
): Suggestion[] {
  const q = query.toLowerCase().trim();
  const matched = notes
    .filter((n) => n.title.toLowerCase().includes(q))
    .slice(0, 8);
  const out: Suggestion[] = matched.map((n) => ({
    type: "wiki",
    label: n.title,
    sub: n.content.slice(0, 60) || "(empty)",
    insertText: `[[${n.title}]]`,
    replaceChars: 0,
  }));
  // Always offer to create a new note
  if (query.trim()) {
    out.push({
      type: "create",
      label: `Create new note: '${query.trim()}'`,
      sub: "Will create a new note with this title",
      insertText: `[[${query.trim()}]]`,
      replaceChars: 0,
    });
  }
  return out;
}

function buildTickerSuggestions(query: string): Suggestion[] {
  // Static universe — real Yahoo search would be async, but this is fast.
  const universe = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    "META",
    "TSLA",
    "JPM",
    "V",
    "JNJ",
    "WMT",
    "PG",
    "KO",
    "DIS",
    "NFLX",
    "INTC",
    "AMD",
    "CRM",
    "BAC",
    "XOM",
  ];
  const q = query.toUpperCase();
  const matched = q ? universe.filter((t) => t.startsWith(q)).slice(0, 8) : universe.slice(0, 8);
  return matched.map((t) => ({
    type: "ticker",
    label: `$${t}`,
    sub: "Add as ticker reference",
    insertText: `$${t}`,
    replaceChars: 0,
  }));
}
