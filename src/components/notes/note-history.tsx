"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NoteVersion {
  id: string;
  content: string;
  title: string;
  createdAt: string;
}

interface NoteHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
  currentContent: string;
  onRestore: (content: string) => void;
}

export function NoteHistory({
  open,
  onOpenChange,
  noteId,
  currentContent,
  onRestore,
}: NoteHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NoteVersion | null>(null);

  useEffect(() => {
    if (!open || !noteId) return;
    setLoading(true);
    setSelected(null);
    (async () => {
      try {
        const r = await fetch(`/api/notes/${noteId}/versions`, { cache: "no-store" });
        const d = await r.json();
        setVersions(d.versions || []);
      } catch {
        toast.error("Failed to load versions");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, noteId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-slate-900 border-slate-700 text-slate-100 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-amber-400" />
            Note History
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Last {versions.length} saved versions · auto-pruned at 20
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[200px_1fr] gap-3 flex-1 overflow-hidden">
          {/* Versions list */}
          <div className="overflow-y-auto aib-scroll border-r border-slate-700 pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin mr-1" /> Loading…
              </div>
            ) : versions.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No saved versions yet
              </div>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`block w-full text-left px-2 py-1.5 rounded text-[11px] mb-1 ${
                    selected?.id === v.id
                      ? "bg-amber-500/15 text-amber-200"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-mono">
                    {new Date(v.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {v.content.slice(0, 40) || "(empty)"}
                  </div>
                </button>
              ))
            )}
          </div>
          {/* Diff / preview */}
          <div className="overflow-y-auto aib-scroll">
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {new Date(selected.createdAt).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onRestore(selected.content);
                      onOpenChange(false);
                      toast.success("Version restored");
                    }}
                    className="bg-amber-500 text-slate-950 hover:bg-amber-400 h-7"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Restore
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] font-mono text-slate-200 bg-slate-950/60 p-3 rounded border border-slate-700 max-h-[55vh] overflow-y-auto aib-scroll">
                  {selected.content || "(empty)"}
                </pre>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-12 text-center">
                Select a version to preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
