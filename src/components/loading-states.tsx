"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Sparkles } from "lucide-react";

export function AnalystCardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/60 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 bg-slate-700" />
            <Skeleton className="h-3 w-1/2 bg-slate-700" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="h-8 w-3/4 bg-slate-700" />
        </div>
      </Card>
    </div>
  );
}

export function LoadingCallout({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-200">
      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        {label ?? "Generating analysis..."}
      </div>
    </div>
  );
}
