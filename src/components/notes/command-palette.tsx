"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FilePlus,
  CalendarClock,
  Search,
  ArrowRight,
  Network,
  Bot,
  Sparkles,
} from "lucide-react";
import type { SectionId } from "@/lib/sections";
import { PREDEFINED_TEMPLATES } from "./daily-notes";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All notes for fuzzy search. */
  notes: { id: string; title: string; content: string; tags: string[] }[];
  onNewNote: () => void;
  onNewNoteFromTemplate: (templateId: string) => void;
  onOpenDailyNote: () => void;
  onToggleGraph: () => void;
  onNavigate: (id: SectionId, ticker?: string) => void;
  onOpenNote: (id: string) => void;
  onSelectTicker: (symbol: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  notes,
  onNewNote,
  onNewNoteFromTemplate,
  onOpenDailyNote,
  onToggleGraph,
  onNavigate,
  onOpenNote,
  onSelectTicker,
}: CommandPaletteProps) {
  // Cmd+K / Ctrl+K — global capture. The parent also handles this, but we
  // listen here too to make sure it always toggles.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="bg-slate-900 border-slate-700 text-slate-100"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Notes">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onNewNote();
            }}
            className="cursor-pointer"
          >
            <FilePlus className="mr-2 h-4 w-4 text-amber-400" />
            New note
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onOpenDailyNote();
            }}
            className="cursor-pointer"
          >
            <CalendarClock className="mr-2 h-4 w-4 text-cyan-400" />
            Open today&apos;s daily note
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onToggleGraph();
            }}
            className="cursor-pointer"
          >
            <Network className="mr-2 h-4 w-4 text-violet-400" />
            Toggle graph view
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="New note from template">
          {PREDEFINED_TEMPLATES.map((t) => (
            <CommandItem
              key={t.id}
              onSelect={() => {
                onOpenChange(false);
                onNewNoteFromTemplate(t.id);
              }}
              className="cursor-pointer"
            >
              <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
              <span className="flex-1">New note from template: {t.name}</span>
              <span className="text-[10px] text-slate-500">{t.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to section">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onNavigate("ticker-search");
            }}
            className="cursor-pointer"
          >
            <Search className="mr-2 h-4 w-4 text-amber-400" />
            Jump to Ticker Search
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onNavigate("ai-agent");
            }}
            className="cursor-pointer"
          >
            <Bot className="mr-2 h-4 w-4 text-cyan-400" />
            Jump to AI Agent
          </CommandItem>
          {(["ms-dcf", "cit-technical", "jpm-earnings", "br-portfolio"] as SectionId[]).map(
            (sid) => (
              <CommandItem
                key={sid}
                onSelect={() => {
                  onOpenChange(false);
                  onNavigate(sid);
                }}
                className="cursor-pointer"
              >
                <ArrowRight className="mr-2 h-4 w-4 text-slate-400" />
                Go to: {sid}
              </CommandItem>
            )
          )}
        </CommandGroup>

        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Search notes (${notes.length})`}>
              {notes.slice(0, 30).map((n) => (
                <CommandItem
                  key={n.id}
                  value={`note ${n.title} ${n.content.slice(0, 100)}`}
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenNote(n.id);
                  }}
                  className="cursor-pointer"
                >
                  <FilePlus className="mr-2 h-4 w-4 text-slate-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-100 truncate">{n.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {n.content.slice(0, 80) || "(empty)"}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick ticker">
          <CommandItem
            value="run ms dcf on aapl"
            onSelect={() => {
              onOpenChange(false);
              onSelectTicker("AAPL");
              onNavigate("ms-dcf", "AAPL");
            }}
            className="cursor-pointer"
          >
            <ArrowRight className="mr-2 h-4 w-4 text-amber-400" />
            Run: MS DCF on AAPL
          </CommandItem>
          <CommandItem
            value="run cit technical on nvda"
            onSelect={() => {
              onOpenChange(false);
              onSelectTicker("NVDA");
              onNavigate("cit-technical", "NVDA");
            }}
            className="cursor-pointer"
          >
            <ArrowRight className="mr-2 h-4 w-4 text-cyan-400" />
            Run: Citadel Technical on NVDA
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
