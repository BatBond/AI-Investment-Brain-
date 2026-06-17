import { Brain, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-700 bg-slate-900/80">
      <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-amber-400" />
          <span>
            <span className="font-semibold text-slate-200">AI Investment Brain</span>{" "}
            · Bloomberg-grade equity research terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">17 analyst modules · 5-persona engine · LLM-powered</span>
          <span className="flex items-center gap-1">
            <Github className="h-3.5 w-3.5" /> v1.0
          </span>
        </div>
      </div>
    </footer>
  );
}
