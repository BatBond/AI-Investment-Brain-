"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ArrowRight,
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
  CalendarClock,
  History,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Command as CommandIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import type { SectionId } from "@/lib/sections";
import {
  PREDEFINED_TEMPLATES,
  buildDailyNote,
  formatDate,
  isDailyNoteTitle,
  parseDate,
  shiftDate,
  today,
  type NoteTemplate,
} from "@/components/notes/daily-notes";
import { CommandPalette } from "@/components/notes/command-palette";
import { WikiAutocomplete } from "@/components/notes/wiki-autocomplete";
import { FrontmatterEditor } from "@/components/notes/frontmatter-editor";
import { NoteHistory } from "@/components/notes/note-history";
import { GraphViewEnhanced } from "@/components/notes/graph-view-enhanced";

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
  onNavigate?: (id: SectionId, ticker?: string) => void;
}

type ViewMode = "list" | "graph";

export function NotesKnowledge({ onSelectTicker, onNavigate }: NotesKnowledgeProps) {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDTO | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [backlinks, setBacklinks] = useState<NoteDTO[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: {
      id: string;
      title: string;
      tags: string[];
      pinned: boolean;
      linkCount: number;
      createdAt?: string;
      wordCount?: number;
    }[];
    links: { source: string; target: string }[];
    stats: { totalNodes: number; totalLinks: number; avgLinksPerNote: string; orphanCount: number };
  } | null>(null);

  // New features state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedTagFolders, setExpandedTagFolders] = useState<Set<string>>(
    new Set(["ticker", "sector"])
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<NoteDTO | null>(null);
  draftRef.current = draft;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-create today's daily note on first visit each day
  useEffect(() => {
    const key = `aib-daily-${formatDate(today())}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    (async () => {
      try {
        const todayStr = formatDate(today());
        const existing = notes.find((n) => n.title === todayStr);
        if (existing) return;
        const built = buildDailyNote(today());
        const r = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: built.title,
            content: built.content,
            tags: ["daily"],
            pinned: false,
          }),
        });
        const data = await r.json();
        if (data.note) {
          toast.success(`Daily note created: ${built.title}`);
          await refresh();
        }
      } catch {
        // ignore
      }
    })();
  }, []);

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
        if (!cancelled) setBacklinks(d.backlinks ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  function startNew() {
    setTemplatePickerOpen(true);
  }

  function createBlank() {
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
    setTemplatePickerOpen(false);
  }

  function createFromTemplate(templateId: string) {
    const tpl: NoteTemplate | undefined = PREDEFINED_TEMPLATES.find(
      (t) => t.id === templateId
    );
    if (!tpl) {
      createBlank();
      return;
    }
    const built = tpl.build({});
    const blank: NoteDTO = {
      id: "",
      title: built.title,
      content: built.content,
      tags: tpl.id === "daily" ? ["daily"] : [],
      tickerRefs: [],
      links: [],
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDraft(blank);
    setActiveId(null);
    setTemplatePickerOpen(false);
  }

  function openNote(n: NoteDTO) {
    setDraft({ ...n });
    setActiveId(n.id);
  }

  function openDailyNote() {
    const todayStr = formatDate(today());
    const found = notes.find((n) => n.title === todayStr);
    if (found) {
      openNote(found);
    } else {
      (async () => {
        const built = buildDailyNote(today());
        try {
          const r = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: built.title,
              content: built.content,
              tags: ["daily"],
              pinned: false,
            }),
          });
          const data = await r.json();
          if (data.note) {
            await refresh();
            openNote(data.note);
            toast.success(`Daily note created: ${built.title}`);
          }
        } catch {
          toast.error("Failed to create daily note");
        }
      })();
    }
  }

  // Navigate to adjacent daily note
  function navigateDay(direction: -1 | 1) {
    if (!draft || !isDailyNoteTitle(draft.title)) return;
    const currentDate = parseDate(draft.title);
    if (!currentDate) return;
    const targetDate = shiftDate(currentDate, direction);
    const targetStr = formatDate(targetDate);
    const found = notes.find((n) => n.title === targetStr);
    if (found) {
      openNote(found);
    } else {
      // Create the adjacent daily note
      (async () => {
        const built = buildDailyNote(targetDate);
        try {
          const r = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: built.title,
              content: built.content,
              tags: ["daily"],
              pinned: false,
            }),
          });
          const data = await r.json();
          if (data.note) {
            await refresh();
            openNote(data.note);
          }
        } catch {
          toast.error("Failed to create daily note");
        }
      })();
    }
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
        const r = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: d.title,
            content: d.content,
            pinned: d.pinned,
            tags: d.tags,
          }),
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
          body: JSON.stringify({
            title: d.title,
            content: d.content,
            pinned: d.pinned,
          }),
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

  // ── All tags + hierarchical tag grouping (single useMemo to avoid TDZ) ──
  const { allTags, tagTree } = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    const tagsArray = Array.from(s).sort();
    const folders = new Map<string, Set<string>>();
    const flat: string[] = [];
    for (const t of tagsArray) {
      const m = /^([a-z]+):(.+)$/.exec(t);
      if (m) {
        const folder = m[1];
        if (!folders.has(folder)) folders.set(folder, new Set());
        folders.get(folder)!.add(t);
      } else {
        flat.push(t);
      }
    }
    return {
      allTags: tagsArray,
      tagTree: {
        folders: Array.from(folders.entries()).map(([folder, tags]) => ({
          folder,
          tags: Array.from(tags).sort(),
        })),
        flat: flat.sort(),
      },
    };
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

  // ── Export / import handlers ───────────────────────────────────────
  function exportNote(n: NoteDTO) {
    const tags = n.tags.length ? `\ntags: [${n.tags.join(", ")}]` : "";
    const fm = n.tags.length || n.pinned
      ? `---\ntitle: ${JSON.stringify(n.title)}${tags}\npinned: ${n.pinned}\n---\n\n`
      : "";
    const blob = new Blob([fm + n.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${n.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Note exported");
  }

  function exportAll() {
    window.open("/api/notes/export?format=md", "_blank");
  }

  async function importFile(file: File) {
    const text = await file.text();
    try {
      const r = await fetch("/api/notes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Import failed");
      toast.success(`Imported ${d.created} of ${d.total} notes`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  function insertSyntax(prefix: string, suffix: string = "", placeholder: string = "") {
    if (!draft) return;
    const ta = textareaRef.current;
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

  const isDaily = draft ? isDailyNoteTitle(draft.title) : false;

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
                  Obsidian-grade workspace · daily notes · templates · Cmd+K · wiki-links · frontmatter · versioning
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={openDailyNote}
                size="sm"
                variant="outline"
                className="border-cyan-700/60 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40 h-8"
              >
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Today&apos;s note
              </Button>
              <Button
                onClick={() => setPaletteOpen(true)}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8"
                title="Cmd+K"
              >
                <CommandIcon className="mr-1.5 h-3.5 w-3.5" />
                ⌘K
              </Button>
              <Button
                onClick={exportAll}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8"
                title="Export all notes"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".md,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importFile(f);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 h-8 px-2 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                </span>
              </label>
              <Button
                onClick={startNew}
                size="sm"
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 h-8"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New note
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4">
        {/* LEFT PANE */}
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

              {tagTree.folders.length > 0 || tagTree.flat.length > 0 ? (
                <Card className="border-slate-700 bg-slate-800/60">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-1">
                    <button
                      onClick={() => setTagFilter(null)}
                      className={cn(
                        "block w-full text-left rounded px-1.5 py-0.5 text-[10px]",
                        !tagFilter
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      all ({allTags.length})
                    </button>
                    {/* Hierarchical folders */}
                    {tagTree.folders.map(({ folder, tags }) => {
                      const expanded = expandedTagFolders.has(folder);
                      return (
                        <div key={folder}>
                          <button
                            onClick={() =>
                              setExpandedTagFolders((prev) => {
                                const next = new Set(prev);
                                if (next.has(folder)) next.delete(folder);
                                else next.add(folder);
                                return next;
                              })
                            }
                            className="flex items-center gap-1 w-full text-left rounded px-1 py-0.5 text-[10px] text-slate-300 hover:text-slate-100"
                          >
                            {expanded ? (
                              <ChevronDown className="h-2.5 w-2.5" />
                            ) : (
                              <ChevronRight className="h-2.5 w-2.5" />
                            )}
                            <span className="font-mono text-cyan-300">{folder}/</span>
                            <span className="text-slate-500">({tags.length})</span>
                          </button>
                          {expanded && (
                            <div className="ml-3 mt-0.5 flex flex-wrap gap-1">
                              {tags.map((t) => (
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Flat tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tagTree.flat.slice(0, 30).map((t) => (
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
                    </div>
                  </CardContent>
                </Card>
              ) : null}

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

        {/* CENTER PANE */}
        <div className="min-w-0">
          {view === "graph" ? (
            <Card className="border-slate-700 bg-slate-800/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyan-400" />
                  Knowledge Graph
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Drag nodes · scroll to zoom · click to open · choose layout / color / filter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {graphData ? (
                  <GraphViewEnhanced
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
                  {isDaily && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDay(-1)}
                        className="border-slate-700 bg-slate-900/40 shrink-0"
                        title="Previous day"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDay(1)}
                        className="border-slate-700 bg-slate-900/40 shrink-0"
                        title="Next day"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
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
                    onClick={() => setHistoryOpen(true)}
                    disabled={!draft.id}
                    className="border-slate-700 bg-slate-900/40 text-slate-400 shrink-0"
                    title="History"
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportNote(draft)}
                    className="border-slate-700 bg-slate-900/40 text-slate-400 shrink-0"
                    title="Export .md"
                  >
                    <Download className="h-3.5 w-3.5" />
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

                {/* Frontmatter editor */}
                <FrontmatterEditor
                  content={draft.content}
                  onChange={(newContent) => setDraft({ ...draft, content: newContent })}
                  existingTickers={Array.from(
                    new Set(notes.flatMap((n) => n.tickerRefs))
                  )}
                />

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

                {/* Editor + preview */}
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[420px]">
                  <Textarea
                    id="note-textarea"
                    ref={textareaRef}
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    placeholder="Start writing. Try: $NVDA breaking out, see [[NVDA Thesis]]. Add #tags with #hashtag."
                    className="bg-slate-900/70 border-slate-700 text-slate-100 placeholder:text-slate-500 font-mono text-sm min-h-[420px] resize-y"
                  />
                  {/* Wiki autocomplete overlay */}
                  <WikiAutocomplete
                    textareaRef={textareaRef}
                    content={draft.content}
                    onChange={(newContent) => setDraft({ ...draft, content: newContent })}
                    existingNotes={notes}
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
                  Capture research thoughts, link them with{" "}
                  <code className="rounded bg-slate-800 px-1 text-amber-300">{"[[wiki-links]]"}</code>,
                  tag tickers with{" "}
                  <code className="rounded bg-slate-800 px-1 text-amber-300">{"$TICKER"}</code>, and use{" "}
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

        {/* RIGHT PANE */}
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

      {/* Command palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        notes={notes}
        onNewNote={createBlank}
        onNewNoteFromTemplate={createFromTemplate}
        onOpenDailyNote={openDailyNote}
        onToggleGraph={() => setView((v) => (v === "list" ? "graph" : "list"))}
        onNavigate={(id, ticker) => {
          if (onNavigate) {
            onNavigate(id, ticker);
          } else {
            onSelectTicker(ticker || "");
          }
        }}
        onOpenNote={(id) => {
          const n = notes.find((x) => x.id === id);
          if (n) openNote(n);
        }}
        onSelectTicker={onSelectTicker}
      />

      {/* Template picker */}
      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-amber-400" />
              New note — pick a template
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Pre-defined templates auto-fill the structure. You can edit anything after.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto aib-scroll">
            {PREDEFINED_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => createFromTemplate(t.id)}
                className="text-left rounded-md border border-slate-700 bg-slate-900/40 p-3 hover:border-amber-500/60 hover:bg-amber-500/5"
              >
                <div className="text-sm font-semibold text-slate-100">{t.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Note history */}
      <NoteHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        noteId={draft?.id ?? null}
        currentContent={draft?.content ?? ""}
        onRestore={(content) => {
          if (draft) {
            setDraft({ ...draft, content });
          }
        }}
      />
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
