"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  NotebookPen,
  Plus,
  Search,
  Tag,
  Trash2,
  Pin,
  PinOff,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  Link2,
  Network,
  List as ListIcon,
  DollarSign,
  Hash,
  Bold,
  Italic,
  Heading2,
  Code,
  ListOrdered,
  Quote,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import type { SectionId } from "@/lib/sections";

interface NoteDTO {
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

interface NotesKnowledgeProps {
  onSelectTicker: (symbol: string) => void;
}

type ViewMode = "list" | "graph";

export function NotesKnowledge({ onSelectTicker }: NotesKnowledgeProps) {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDTO | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [backlinks, setBacklinks] = useState<NoteDTO[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: { id: string; title: string; tags: string[]; pinned: boolean; linkCount: number }[];
    links: { source: string; target: string }[];
    stats: { totalNodes: number; totalLinks: number; avgLinksPerNote: string; orphanCount: number };
  } | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<NoteDTO | null>(null);
  draftRef.current = draft;

  // Fetch notes list (with current filter/search)
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tagFilter) params.set("tag", tagFilter);
      if (search.trim()) params.set("q", search.trim());
      const r = await fetch(`/api/notes?${params.toString()}`, { cache: "no-store" });
      const data = await r.json();
      setNotes(data.notes ?? []);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [tagFilter, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fetch graph when in graph view
  useEffect(() => {
    if (view !== "graph") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/notes/graph", { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) setGraphData(d);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, notes.length]);

  // Fetch backlinks when active note changes
  useEffect(() => {
    if (!activeId) {
      setBacklinks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/notes/${activeId}`, { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) {
          setBacklinks(d.backlinks ?? []);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  function startNew() {
    const blank: NoteDTO = {
      id: "",
      title: "Untitled note",
      content: "",
      tags: [],
      tickerRefs: [],
      links: [],
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDraft(blank);
    setActiveId(null);
  }

  function openNote(n: NoteDTO) {
    setDraft({ ...n });
    setActiveId(n.id);
  }

  // Auto-save 1s after typing stops
  useEffect(() => {
    if (!draft) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveDraft(draft);
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft?.title, draft?.content, draft?.pinned]);

  async function saveDraft(d: NoteDTO) {
    try {
      if (!d.id) {
        // Create
        const r = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: d.title, content: d.content, pinned: d.pinned }),
        });
        const data = await r.json();
        if (data.note) {
          setActiveId(data.note.id);
          setDraft(data.note);
          toast.success("Note created");
        }
      } else {
        const r = await fetch(`/api/notes/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: d.title, content: d.content, pinned: d.pinned }),
        });
        const data = await r.json();
        if (data.note) {
          setDraft(data.note);
        }
      }
      await refresh();
    } catch {
      toast.error("Save failed");
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (activeId === id) {
        setActiveId(null);
        setDraft(null);
      }
      await refresh();
      toast.success("Note deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function togglePin(n: NoteDTO) {
    const updated = { ...n, pinned: !n.pinned };
    setDraft(updated);
    if (n.id) {
      try {
        await fetch(`/api/notes/${n.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned: !n.pinned }),
        });
        await refresh();
      } catch {
        /* ignore */
      }
    }
  }

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const pinned = useMemo(() => notes.filter((n) => n.pinned), [notes]);
  const recent = useMemo(
    () =>
      [...notes]
        .filter((n) => !n.pinned)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 12),
    [notes]
  );

  function insertSyntax(prefix: string, suffix: string = "", placeholder = "") {
    if (!draft) return;
    const ta = document.getElementById("note-textarea") as HTMLTextAreaElement | null;
    if (!ta) {
      setDraft({ ...draft, content: draft.content + prefix + placeholder + suffix });
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = draft.content.slice(start, end) || placeholder;
    const next = draft.content.slice(0, start) + prefix + selected + suffix + draft.content.slice(end);
    setDraft({ ...draft, content: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + selected.length;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                <NotebookPen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-50">Notes &amp; Knowledge</CardTitle>
                <CardDescription className="text-xs text-amber-400/90">
                  Obsidian-style workspace · auto-saves · supports #tags, $TICKER refs, [[wiki-links]]
                </CardDescription>
              </div>
            </div>
            <Button onClick={startNew} size="sm" className="bg-amber-500 text-slate-950 hover:bg-amber-400">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New note
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4">
        {/* LEFT PANE: tag cloud, pinned, recent, search, view toggle */}
        <div className="space-y-3">
          <Card className="border-slate-700 bg-slate-800/60">
            <CardContent className="p-3 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  className="h-8 bg-slate-900/70 border-slate-700 pl-8 text-xs text-slate-100"
                />
              </div>
              <div className="flex rounded-md border border-slate-700 overflow-hidden">
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px]",
                    view === "list" ? "bg-amber-500/15 text-amber-300" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <ListIcon className="h-3 w-3" /> List
                </button>
                <button
                  onClick={() => setView("graph")}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px]",
                    view === "graph" ? "bg-amber-500/15 text-amber-300" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Network className="h-3 w-3" /> Graph
                </button>
              </div>
            </CardContent>
          </Card>

          {view === "list" ? (
            <>
              {pinned.length > 0 && (
                <Card className="border-slate-700 bg-slate-800/60">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs text-amber-400 flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-0.5">
                    {pinned.map((n) => (
                      <NoteListItem
                        key={n.id}
                        note={n}
                        active={activeId === n.id}
                        onClick={() => openNote(n)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {allTags.length > 0 && (
                <Card className="border-slate-700 bg-slate-800/60">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 flex flex-wrap gap-1">
                    <button
                      onClick={() => setTagFilter(null)}
                      className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[10px]",
                        !tagFilter
                          ? "border-amber-500 bg-amber-500/15 text-amber-300"
                          : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      all
                    </button>
                    {allTags.slice(0, 40).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTagFilter(tagFilter === t ? null : t)}
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 text-[10px] font-mono",
                          tagFilter === t
                            ? "border-amber-500 bg-amber-500/15 text-amber-300"
                            : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Recent
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-0.5 max-h-[40vh] overflow-y-auto aib-scroll">
                  {loading && <div className="text-[11px] text-slate-500 px-2 py-1">Loading…</div>}
                  {!loading && recent.length === 0 && (
                    <div className="text-[11px] text-slate-500 px-2 py-1">No notes yet</div>
                  )}
                  {recent.map((n) => (
                    <NoteListItem
                      key={n.id}
                      note={n}
                      active={activeId === n.id}
                      onClick={() => openNote(n)}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-slate-700 bg-slate-800/60">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                  <Network className="h-3 w-3" /> Graph Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1.5 text-[11px]">
                {graphData ? (
                  <>
                    <StatRow label="Total notes" value={String(graphData.stats.totalNodes)} />
                    <StatRow label="Total links" value={String(graphData.stats.totalLinks)} />
                    <StatRow label="Avg links/note" value={graphData.stats.avgLinksPerNote} />
                    <StatRow label="Orphan notes" value={String(graphData.stats.orphanCount)} />
                  </>
                ) : (
                  <div className="text-slate-500">Loading…</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* CENTER PANE: editor OR graph view OR empty state */}
        <div className="min-w-0">
          {view === "graph" ? (
            <Card className="border-slate-700 bg-slate-800/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyan-400" />
                  Knowledge Graph
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Hover a node to highlight its connections · click to open
                </CardDescription>
              </CardHeader>
              <CardContent>
                {graphData ? (
                  <GraphView
                    data={graphData}
                    onOpenNode={(id) => {
                      const n = notes.find((x) => x.id === id);
                      if (n) {
                        setView("list");
                        openNote(n);
                      }
                    }}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-500 text-xs">
                    Loading graph…
                  </div>
                )}
              </CardContent>
            </Card>
          ) : draft ? (
            <Card className="border-slate-700 bg-slate-800/60">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Note title"
                    className="h-9 bg-slate-900/70 border-slate-700 text-base font-semibold text-slate-100"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePin(draft)}
                    className={cn(
                      "border-slate-700 bg-slate-900/40 shrink-0",
                      draft.pinned ? "text-amber-300" : "text-slate-400"
                    )}
                    title={draft.pinned ? "Unpin" : "Pin"}
                  >
                    {draft.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (draft.id) deleteNote(draft.id);
                      else {
                        setDraft(null);
                      }
                    }}
                    className="border-slate-700 bg-slate-900/40 text-rose-300 hover:text-rose-200 shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 border-b border-slate-700 pb-2">
                  <ToolBtn onClick={() => insertSyntax("**", "**", "bold")} icon={<Bold className="h-3 w-3" />} tip="Bold" />
                  <ToolBtn onClick={() => insertSyntax("*", "*", "italic")} icon={<Italic className="h-3 w-3" />} tip="Italic" />
                  <ToolBtn onClick={() => insertSyntax("## ", "", "Heading")} icon={<Heading2 className="h-3 w-3" />} tip="Heading" />
                  <ToolBtn onClick={() => insertSyntax("- ", "", "list item")} icon={<ListOrdered className="h-3 w-3" />} tip="List" />
                  <ToolBtn onClick={() => insertSyntax("> ", "", "quote")} icon={<Quote className="h-3 w-3" />} tip="Quote" />
                  <ToolBtn onClick={() => insertSyntax("`", "`", "code")} icon={<Code className="h-3 w-3" />} tip="Code" />
                  <ToolBtn onClick={() => insertSyntax("[[", "]]", "Note title")} icon={<Link2 className="h-3 w-3" />} tip="Wiki-link" />
                  <ToolBtn onClick={() => insertSyntax("$", "", "AAPL")} icon={<DollarSign className="h-3 w-3" />} tip="$TICKER" />
                  <ToolBtn onClick={() => insertSyntax("#", "", "tag")} icon={<Hash className="h-3 w-3" />} tip="#tag" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[420px]">
                  <Textarea
                    id="note-textarea"
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    placeholder="Start writing. Try: $NVDA breaking out, see [[NVDA Thesis]]. Add #tags with #hashtag."
                    className="bg-slate-900/70 border-slate-700 text-slate-100 placeholder:text-slate-500 font-mono text-sm min-h-[420px] resize-y"
                  />
                  <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3 overflow-y-auto max-h-[60vh] aib-scroll">
                    <Markdown content={draft.content || "_Preview will appear here_"} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-3">
                  <Clock className="h-2.5 w-2.5" />
                  Last updated{" "}
                  {new Date(draft.updatedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="text-emerald-400">· Auto-saved</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-700 bg-slate-800/40">
              <CardContent className="p-8 text-center">
                <NotebookPen className="mx-auto h-8 w-8 text-slate-600" />
                <h3 className="mt-3 text-base font-semibold text-slate-200">
                  Start a new note
                </h3>
                <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                  Capture research thoughts, link them with <code className="rounded bg-slate-800 px-1 text-amber-300">{"[[wiki-links]]"}</code>,
                  tag tickers with <code className="rounded bg-slate-800 px-1 text-amber-300">{"$TICKER"}</code>, and use{" "}
                  <code className="rounded bg-slate-800 px-1 text-amber-300">{"#hashtags"}</code> for topics.
                </p>
                <Button
                  onClick={startNew}
                  className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create first note
                </Button>
                {notes.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg mx-auto">
                    {recent.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => openNote(n)}
                        className="rounded-md border border-slate-700 bg-slate-900/40 p-2 text-xs hover:border-amber-500/60 hover:bg-amber-500/5"
                      >
                        <div className="font-semibold text-slate-200 truncate">{n.title}</div>
                        <div className="text-slate-500 truncate">{n.content.slice(0, 60) || "(empty)"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT PANE: backlinks + outgoing links + ticker refs */}
        <div className="space-y-3">
          {draft && (
            <>
              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Backlinks ({backlinks.length})
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">
                    Notes linking to this one
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1 max-h-60 overflow-y-auto aib-scroll">
                  {backlinks.length === 0 ? (
                    <div className="text-[11px] text-slate-500 px-1">No backlinks yet</div>
                  ) : (
                    backlinks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => openNote(b)}
                        className="block w-full text-left rounded border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 hover:bg-slate-800"
                      >
                        <div className="text-xs font-semibold text-amber-300 truncate">{b.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{b.content.slice(0, 80)}</div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Outgoing links ({draft.links.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1 max-h-60 overflow-y-auto aib-scroll">
                  {draft.links.length === 0 ? (
                    <div className="text-[11px] text-slate-500 px-1">No wiki-links yet</div>
                  ) : (
                    draft.links.map((l) => {
                      const target = notes.find((n) => n.title.toLowerCase() === l.trim().toLowerCase());
                      return (
                        <button
                          key={l}
                          onClick={() => {
                            if (target) openNote(target);
                            else toast.info(`"${l}" doesn't exist yet — create it`);
                          }}
                          className="block w-full text-left rounded border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 hover:bg-slate-800"
                        >
                          <div className="text-xs text-cyan-300 truncate flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {l}
                          </div>
                          {target ? (
                            <div className="text-[10px] text-slate-500 truncate">Opens existing note</div>
                          ) : (
                            <div className="text-[10px] text-amber-400">Click to create</div>
                          )}
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/60">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Ticker refs ({draft.tickerRefs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 flex flex-wrap gap-1">
                  {draft.tickerRefs.length === 0 ? (
                    <div className="text-[11px] text-slate-500 px-1">No tickers referenced</div>
                  ) : (
                    draft.tickerRefs.map((t) => (
                      <button
                        key={t}
                        onClick={() => onSelectTicker(t)}
                        className="inline-flex items-center gap-1 rounded border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[11px] font-mono text-amber-300 hover:bg-amber-900/40"
                      >
                        {t}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!draft && (
            <Card className="border-slate-700 bg-slate-800/40">
              <CardContent className="p-4 text-[11px] text-slate-500">
                Select a note to see backlinks, outgoing links, and ticker refs here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteListItem({ note, active, onClick }: { note: NoteDTO; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left rounded px-2 py-1.5 transition-colors",
        active ? "bg-amber-500/15 text-amber-200" : "hover:bg-slate-800 text-slate-300"
      )}
    >
      <div className="flex items-center gap-1.5">
        {note.pinned && <Pin className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
        <span className="text-xs font-semibold truncate">{note.title}</span>
      </div>
      <div className="text-[10px] text-slate-500 truncate">
        {note.content.slice(0, 60) || "(empty)"}
      </div>
    </button>
  );
}

function ToolBtn({ onClick, icon, tip }: { onClick: () => void; icon: React.ReactNode; tip: string }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-900/40 text-slate-400 hover:text-amber-300 hover:border-amber-500/60"
    >
      {icon}
    </button>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/40 pb-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-semibold text-slate-100">{value}</span>
    </div>
  );
}

// ── Graph view (force-directed SVG) ──────────────────────────────────
interface GraphViewProps {
  data: {
    nodes: { id: string; title: string; tags: string[]; pinned: boolean; linkCount: number }[];
    links: { source: string; target: string }[];
    stats: { totalNodes: number; totalLinks: number; avgLinksPerNote: string; orphanCount: number };
  };
  onOpenNode: (id: string) => void;
}

const TAG_COLORS = ["#f59e0b", "#22d3ee", "#34d399", "#a78bfa", "#fb7185", "#facc15", "#60a5fa"];

function GraphView({ data, onOpenNode }: GraphViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 420 });

  useEffect(() => {
    function update() {
      if (!sizeRef.current) return;
      const r = sizeRef.current.getBoundingClientRect();
      setDims({ w: Math.max(320, r.width), h: 420 });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Compute simple force layout (deterministic circular layout with center gravity)
  const layout = useMemo(() => {
    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 50;
    const nodes = data.nodes;
    const map = new Map<string, { id: string; title: string; tags: string[]; pinned: boolean; linkCount: number; x: number; y: number; vx: number; vy: number }>();
    nodes.forEach((n, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      const r = nodes.length === 1 ? 0 : radius * 0.85;
      map.set(n.id, {
        ...n,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      });
    });

    // Run a few iterations of a simple spring layout
    const linkMap = new Map<string, Set<string>>();
    for (const l of data.links) {
      if (!linkMap.has(l.source)) linkMap.set(l.source, new Set());
      if (!linkMap.has(l.target)) linkMap.set(l.target, new Set());
      linkMap.get(l.source)!.add(l.target);
      linkMap.get(l.target)!.add(l.source);
    }

    const arr = Array.from(map.values());
    const k = 80; // ideal spring length
    const iterations = 120;
    for (let it = 0; it < iterations; it++) {
      // Repulsive forces between all pairs
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (dist > 300) continue;
          const force = (k * k) / dist;
          const fx = (dx / dist) * force * 0.05;
          const fy = (dy / dist) * force * 0.05;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      // Attractive forces for connected pairs
      for (const l of data.links) {
        const a = map.get(l.source);
        const b = map.get(l.target);
        if (!a || !b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (dist * dist) / k;
        const fx = (dx / dist) * force * 0.05;
        const fy = (dy / dist) * force * 0.05;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
      // Apply velocity with damping, plus center gravity
      for (const n of arr) {
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
        n.x += n.vx * 0.4;
        n.y += n.vy * 0.4;
        n.vx *= 0.85;
        n.vy *= 0.85;
        // keep inside bounds
        const pad = 30;
        if (n.x < pad) n.x = pad;
        if (n.x > w - pad) n.x = w - pad;
        if (n.y < pad) n.y = pad;
        if (n.y > h - pad) n.y = h - pad;
      }
    }

    return { nodes: arr, linkMap };
  }, [data, dims]);

  if (data.nodes.length === 0) {
    return (
      <div className="h-[420px] flex items-center justify-center text-slate-500 text-sm">
        No notes to graph yet. Create a few notes with [[wiki-links]] between them.
      </div>
    );
  }

  const hoveredNeighbors = hovered ? (layout.linkMap.get(hovered) ?? new Set<string>()) : null;
  function isDimmed(id: string) {
    if (!hovered) return false;
    if (id === hovered) return false;
    if (hoveredNeighbors?.has(id)) return false;
    return true;
  }

  function primaryTagColor(tags: string[]): string {
    if (!tags || tags.length === 0) return "#64748b";
    const first = tags[0];
    let hash = 0;
    for (let i = 0; i < first.length; i++) hash = (hash * 31 + first.charCodeAt(i)) | 0;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }

  return (
    <div ref={sizeRef} className="w-full">
      <svg width={dims.w} height={dims.h} className="block">
        {/* Edges */}
        {data.links.map((l, i) => {
          const a = layout.nodes.find((n) => n.id === l.source);
          const b = layout.nodes.find((n) => n.id === l.target);
          if (!a || !b) return null;
          const dimmed = hovered && hovered !== l.source && hovered !== l.target;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={dimmed ? "#1e293b" : "#475569"}
              strokeWidth={dimmed ? 1 : 1.5}
              opacity={dimmed ? 0.3 : 0.7}
            />
          );
        })}
        {/* Nodes */}
        {layout.nodes.map((n) => {
          const color = primaryTagColor(n.tags);
          const r = 8 + Math.min(12, n.linkCount * 2);
          const dimmed = isDimmed(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              style={{ cursor: "pointer", opacity: dimmed ? 0.3 : 1 }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onOpenNode(n.id)}
            >
              <circle
                r={r}
                fill={color}
                stroke={n.pinned ? "#fbbf24" : "#0f172a"}
                strokeWidth={n.pinned ? 3 : 1.5}
                opacity={0.9}
              />
              <text
                y={r + 11}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize={10}
                fontWeight={n.id === hovered ? 700 : 400}
              >
                {n.title.length > 24 ? n.title.slice(0, 22) + "…" : n.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
