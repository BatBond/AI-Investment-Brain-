"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Info } from "lucide-react";

const CLUSTERS = [
  {
    name: "Core Data Layer",
    color: "#22d3ee",
    description:
      "Mock market data, fundamentals, technicals, and the deterministic price-series generator that powers every chart.",
    status: "Live",
  },
  {
    name: "5-Persona Advisory",
    color: "#a78bfa",
    description:
      "Five specialized LLM personas (Growth Hawk, Value Seeker, Momentum Trader, Defensive Shield, ESG Conscious) — each returns a structured JSON verdict.",
    status: "Live",
  },
  {
    name: "AI Analyst Agent",
    color: "#22d3ee",
    description:
      "A streaming-capable chat agent that computes indicators, builds trade hypotheses, and screens the universe.",
    status: "Live",
  },
  {
    name: "10 Wall Street Modules",
    color: "#f59e0b",
    description:
      "Goldman, Morgan Stanley, Bridgewater, JPMorgan, BlackRock, Citadel, Harvard Endowment, Bain, Renaissance, McKinsey — each with a tailored system prompt.",
    status: "Live",
  },
  {
    name: "Morning Brief",
    color: "#34d399",
    description:
      "Pre-market futures, global closes, top movers, news catalysts, watchlist alerts, and an economic calendar.",
    status: "Live",
  },
  {
    name: "Braindump / Notes",
    color: "#fbbf24",
    description:
      "Local-first note capture with auto-ticker detection and tag filtering. Persists to localStorage.",
    status: "Live",
  },
];

const LEGEND = [
  { color: "#34d399", label: "Live — fully functional" },
  { color: "#fbbf24", label: "LLM-powered — calls Z.ai backend" },
  { color: "#22d3ee", label: "Real-time data viz" },
  { color: "#a78bfa", label: "Multi-persona orchestration" },
];

export function KnowledgeGraph() {
  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-500/15 text-violet-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-50">
                AI Investment Brain — Knowledge Graph
              </CardTitle>
              <CardDescription className="text-xs text-violet-300/90">
                How all 17 sections, 5 personas, and 10 analyst modules connect
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 sm:p-4">
            <img
              src="/knowledge-graph.png"
              alt="AI Investment Brain knowledge graph mindmap showing how 17 sections, 5 personas, and 10 analyst modules connect"
              className="w-full h-auto rounded-md"
              loading="lazy"
            />
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-700 bg-slate-900/40 p-2.5 text-xs text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span>
              This mindmap was generated from the architecture spec and shows the data flow from
              the mock market-data layer, through the LLM-powered API routes, into the 17
              user-facing sections.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-50">Cluster Legend</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Status colors used across the knowledge graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LEGEND.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/40 p-2.5 text-xs"
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-slate-300">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-50">System Clusters</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            The major functional clusters in the AI Investment Brain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CLUSTERS.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border bg-slate-900/40 p-3"
                style={{ borderColor: `${c.color}66` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm font-semibold text-slate-100">{c.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-700/60 bg-emerald-900/20 text-emerald-300 text-[10px]"
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
