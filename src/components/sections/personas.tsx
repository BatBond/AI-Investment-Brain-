"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Sparkles,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Leaf,
} from "lucide-react";
import { PERSONA_PROMPTS } from "@/lib/analyst-prompts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PersonasProps {
  initialTicker?: string;
}

interface PersonaResult {
  id: string;
  name: string;
  color: string;
  raw: string;
  parsed?: {
    verdict?: string;
    confidence?: number;
    rationale?: string;
    metrics?: Array<{ label: string; value: string }>;
    thesis?: string;
  };
  error?: string;
}

const VERDICT_STYLES: Record<string, string> = {
  "STRONG BUY": "border-emerald-500 bg-emerald-500/20 text-emerald-300",
  BUY: "border-emerald-600/60 bg-emerald-900/30 text-emerald-300",
  HOLD: "border-amber-600/60 bg-amber-900/30 text-amber-300",
  SELL: "border-rose-600/60 bg-rose-900/30 text-rose-300",
  "STRONG SELL": "border-rose-500 bg-rose-500/20 text-rose-200",
};

const PERSONA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "growth-hawk": TrendingUp,
  "value-seeker": Activity,
  "momentum-trader": Activity,
  "defensive-shield": Shield,
  "esg-conscious": Leaf,
};

export function Personas({ initialTicker }: PersonasProps) {
  const [ticker, setTicker] = useState(initialTicker ?? "AAPL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PersonaResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTicker) setTicker(initialTicker);
  }, [initialTicker]);

  async function run() {
    if (!ticker.trim()) {
      toast.error("Enter a ticker first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setResults(data.personas);
      toast.success(`5 personas generated for ${ticker.toUpperCase()}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(`Persona generation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Intro / input */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-50">5-Persona Advisory Engine</CardTitle>
              <CardDescription className="text-xs text-amber-400/90">
                Get simultaneous verdicts from 5 distinct investment philosophies — each powered by a
                specialized LLM persona
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker (AAPL, MSFT, NVDA...)"
              className="h-10 bg-slate-900/70 border-slate-700 font-mono text-base text-slate-100 placeholder:text-slate-500"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <Button
              onClick={run}
              disabled={loading}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {loading ? "Consulting 5 personas..." : "Run Advisory"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(PERSONA_PROMPTS).map(([id, p]) => {
              const Icon = PERSONA_ICONS[id] ?? Activity;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
                  style={{
                    borderColor: `${p.color}66`,
                    backgroundColor: `${p.color}1a`,
                    color: p.color,
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {p.name}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(PERSONA_PROMPTS).map(([id, p]) => (
            <Card key={id} className="border-slate-700 bg-slate-800/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold text-slate-100">{p.name}</span>
                  </div>
                  <Skeleton className="h-5 w-20 bg-slate-700" />
                </div>
                <Skeleton className="h-3 w-12 bg-slate-700" />
                <Skeleton className="h-16 w-full bg-slate-700" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 bg-slate-700" />
                  <Skeleton className="h-6 w-16 bg-slate-700" />
                  <Skeleton className="h-6 w-16 bg-slate-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive" className="border-rose-700/60 bg-rose-900/20 text-rose-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((r) => {
            const meta = PERSONA_PROMPTS[r.id];
            const Icon = PERSONA_ICONS[r.id] ?? Activity;
            const verdict = (r.parsed?.verdict ?? "HOLD").toUpperCase();
            const verdictClass =
              VERDICT_STYLES[verdict] ?? VERDICT_STYLES["HOLD"];
            const conf = r.parsed?.confidence ?? 0;
            return (
              <Card
                key={r.id}
                className="border-slate-700 bg-slate-800/60 flex flex-col"
                style={{
                  borderTopColor: r.color,
                  borderTopWidth: 3,
                }}
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${r.color}1a`,
                          color: r.color,
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-50 leading-tight">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{meta?.style}</div>
                      </div>
                    </div>
                  </div>

                  {r.error ? (
                    <div className="mt-3 rounded-md border border-rose-700/60 bg-rose-900/20 p-2 text-xs text-rose-300">
                      {r.error}
                    </div>
                  ) : (
                    <>
                      {/* Verdict + confidence */}
                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold",
                            verdictClass
                          )}
                        >
                          {verdict.includes("BUY") && verdict !== "STRONG BUY" && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {verdict === "STRONG BUY" && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {verdict.includes("SELL") && (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {verdict}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                          Confidence
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${conf}%`,
                              backgroundColor: r.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-slate-300">
                          {conf}/100
                        </span>
                      </div>

                      {/* Rationale */}
                      {r.parsed?.rationale && (
                        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                          {r.parsed.rationale}
                        </p>
                      )}

                      {/* Metric chips */}
                      {r.parsed?.metrics && r.parsed.metrics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.parsed.metrics.map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex flex-col items-start rounded border border-slate-700 bg-slate-900/50 px-2 py-1 text-xs"
                            >
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">
                                {m.label}
                              </span>
                              <span
                                className="font-mono font-semibold tabular-nums"
                                style={{ color: r.color }}
                              >
                                {m.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detailed thesis */}
                      {r.parsed?.thesis && (
                        <Collapsible className="mt-3">
                          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-amber-400 hover:underline">
                            <ChevronDown className="h-3 w-3" />
                            View detailed thesis
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 rounded-md border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300 leading-relaxed">
                            {r.parsed.thesis}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!results && !loading && !error && (
        <Card className="border-slate-700 bg-slate-800/40">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-slate-400">
              Enter a ticker above and run the advisory to see 5 simultaneous persona verdicts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
