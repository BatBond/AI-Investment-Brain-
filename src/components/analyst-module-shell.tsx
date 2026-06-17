"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, AlertCircle, Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { LoadingCallout, AnalystCardSkeleton } from "@/components/loading-states";
import { toast } from "sonner";
import { SECTION_MAP, type SectionId } from "@/lib/sections";

interface AnalystModuleShellProps {
  sectionId: SectionId;
  description: string;
  /** Source-of-truth string sent to the LLM. */
  userInput: string;
  /**
   * If provided, the shell renders a default textarea/input bound to this state.
   * If omitted, the consumer is responsible for rendering form fields via `children`.
   */
  inputLabel?: string;
  onUserInputChange?: (v: string) => void;
  inputPlaceholder?: string;
  textarea?: boolean;
  children?: ReactNode;
  contextNote?: string;
  extraPayload?: string;
  /** Hide the generate button (rarely needed). */
  hideGenerate?: boolean;
  generateLabel?: string;
}

export function AnalystModuleShell({
  sectionId,
  description,
  inputLabel,
  userInput,
  onUserInputChange,
  inputPlaceholder,
  textarea,
  children,
  contextNote,
  extraPayload,
  hideGenerate,
  generateLabel,
}: AnalystModuleShellProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const section = SECTION_MAP[sectionId];

  async function generate() {
    if (!userInput.trim()) {
      toast.error("Please fill in the required input.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/analyst/${sectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          context: extraPayload,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data.result);
      toast.success(`${section.firm ?? "Analysis"} complete.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(`Generation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Module header */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-50">{section.label}</CardTitle>
                  <CardDescription className="text-amber-400/90 text-xs">
                    {section.firm ? `${section.firm} — ` : ""}
                    {description}
                  </CardDescription>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-cyan-700/60 bg-cyan-900/20 text-cyan-300">
              <Sparkles className="mr-1 h-3 w-3" /> LLM-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contextNote && (
              <p className="text-xs text-slate-400">{contextNote}</p>
            )}
            {inputLabel && onUserInputChange && (
              <>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {inputLabel}
                </label>
                {textarea ? (
                  <textarea
                    value={userInput}
                    onChange={(e) => onUserInputChange(e.target.value)}
                    placeholder={inputPlaceholder}
                    rows={4}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 font-mono"
                  />
                ) : (
                  <input
                    value={userInput}
                    onChange={(e) => onUserInputChange(e.target.value)}
                    placeholder={inputPlaceholder}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 font-mono"
                  />
                )}
              </>
            )}
            {children}
            {!hideGenerate && (
              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={generate}
                  disabled={loading}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {loading
                    ? "Generating..."
                    : generateLabel ?? "Generate Analysis"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Output */}
      {loading && (
        <div className="space-y-3">
          <LoadingCallout label={`The ${section.firm ?? "analyst"} is composing the report...`} />
          <AnalystCardSkeleton />
          <AnalystCardSkeleton />
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive" className="border-rose-700/60 bg-rose-900/20 text-rose-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !loading && (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-100">
                {section.firm ?? "Analyst"} Report
              </CardTitle>
              <Badge variant="outline" className="border-emerald-700/60 bg-emerald-900/20 text-emerald-300">
                Generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Markdown content={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
