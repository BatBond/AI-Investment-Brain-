"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Download, FileSpreadsheet, Maximize2, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChartSpec } from "@/lib/chart-specs";

interface ChartCardProps {
  title?: string;
  subtitle?: string;
  spec?: ChartSpec;
  children: ReactNode;
  /** When provided, used for CSV export. */
  csvData?: string;
  className?: string;
  /** Optional body padding override */
  bodyClassName?: string;
}

/** Wraps every chart with a consistent header (title + subtitle + "..." menu)
 *  supporting fullscreen, PNG download, and CSV export. */
export function ChartCard({
  title,
  subtitle,
  spec,
  children,
  csvData,
  className,
  bodyClassName,
}: ChartCardProps) {
  const [fullscreen, setFullscreen] = useState(false);

  function downloadPNG() {
    // Find the SVG inside this card and rasterize it.
    const svg = document.querySelector(
      `[data-chart-card="${title || ""}"] svg`
    ) as SVGElement | null;
    if (!svg) {
      toast.error("No SVG found to export");
      return;
    }
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const w = (svg as SVGSVGElement).viewBox?.baseVal?.width || svg.clientWidth || 800;
        const h = (svg as SVGSVGElement).viewBox?.baseVal?.height || svg.clientHeight || 400;
        canvas.width = w * 2;
        canvas.height = h * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((b) => {
          if (!b) return;
          const u = URL.createObjectURL(b);
          const a = document.createElement("a");
          a.href = u;
          a.download = `${(title || "chart").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
          a.click();
          URL.revokeObjectURL(u);
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        toast.error("Failed to rasterize SVG");
      };
      img.src = url;
      toast.success("PNG downloaded");
    } catch (e) {
      toast.error("Export failed");
    }
  }

  function downloadCSV() {
    const csv = csvData || specToCSV(spec);
    if (!csv) {
      toast.error("No tabular data to export");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "chart").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  function copyJSON() {
    if (!spec) {
      toast.error("No spec available");
      return;
    }
    navigator.clipboard
      .writeText(JSON.stringify(spec, null, 2))
      .then(() => toast.success("Spec JSON copied"))
      .catch(() => toast.error("Copy failed"));
  }

  const header = (
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {title && (
            <CardTitle className="text-sm text-slate-100 flex items-center gap-2 truncate">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">{title}</span>
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-slate-400 hover:text-amber-300 p-1 rounded hover:bg-slate-700/50 shrink-0"
              aria-label="Chart options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-slate-900 border-slate-700 text-slate-100"
          >
            <DropdownMenuItem
              onClick={() => setFullscreen(true)}
              className="hover:bg-slate-800 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-2" /> View full screen
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={downloadPNG}
              className="hover:bg-slate-800 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-2" /> Download PNG
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={downloadCSV}
              className="hover:bg-slate-800 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Download CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={copyJSON}
              className="hover:bg-slate-800 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy spec JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  );

  return (
    <>
      <Card
        data-chart-card={title || ""}
        className={cn("border-slate-700 bg-slate-800/60", className)}
      >
        {(title || subtitle) && header}
        <CardContent className={cn("pt-2", bodyClassName)}>{children}</CardContent>
      </Card>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-7xl w-full h-[85vh] bg-slate-900 border-slate-700 p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title || "Chart"}</DialogTitle>
          <div className="h-full w-full p-6 overflow-auto">
            <div className="text-base font-semibold text-slate-100 mb-2">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-400 mb-4">{subtitle}</div>
            )}
            <div className="h-[calc(85vh-120px)] w-full">{children}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Build a CSV string from a chart spec for export. */
function specToCSV(spec?: ChartSpec): string {
  if (!spec) return "";
  try {
    switch (spec.type) {
      case "line":
        if (spec.series && spec.series.length > 0) {
          const headers = ["x", ...spec.series.map((s) => s.name)];
          const xs = spec.series[0].data.map((d) => d.x);
          const rows = xs.map((x, i) => [
            String(x),
            ...spec.series!.map((s) => String(s.data[i]?.y ?? "")),
          ]);
          return [headers, ...rows].map((r) => r.join(",")).join("\n");
        }
        return ["x,y", ...spec.data.map((d) => `${d.x},${d.y}`)].join("\n");
      case "area":
        return ["x,y", ...spec.data.map((d) => `${d.x},${d.y}`)].join("\n");
      case "bar":
        return ["x,y", ...spec.data.map((d) => `${d.x},${d.y}`)].join("\n");
      case "stackedBar":
        return [
          ["x", ...spec.series.map((s) => s.name)].join(","),
          ...spec.data.map((d) =>
            [d.x, ...spec.series.map((s) => String(d[s.name] ?? ""))].join(",")
          ),
        ].join("\n");
      case "pie":
      case "donut":
        return ["name,value", ...spec.data.map((d) => `${d.name},${d.value}`)].join("\n");
      case "scatter":
        return ["x,y,name", ...spec.data.map((d) => `${d.x},${d.y},${d.name || ""}`)].join("\n");
      case "comparison-line":
        return [
          "x," + spec.series.map((s) => s.name).join(","),
          ...spec.series[0].data.map((d, i) =>
            [d.x, ...spec.series.map((s) => String(s.data[i]?.y ?? ""))].join(",")
          ),
        ].join("\n");
      case "waterfall":
        return ["label,value,isTotal", ...spec.data.map((d) => `${d.label},${d.value},${d.isTotal ? "yes" : "no"}`)].join("\n");
      case "heatmap": {
        const header = ["", ...spec.cols].join(",");
        const rows = spec.rows.map((r, ri) =>
          [r, ...spec.values[ri].map((v) => String(v))].join(",")
        );
        return [header, ...rows].join("\n");
      }
      case "candlestick":
      case "candlestick-enhanced":
        return [
          "date,open,high,low,close,volume",
          ...spec.data.map((d) => `${d.date},${d.open},${d.high},${d.low},${d.close},${"volume" in d ? d.volume ?? "" : ""}`),
        ].join("\n");
      case "treemap":
        return ["name,value", ...spec.data.map((d) => `${d.name},${d.value}`)].join("\n");
      case "gauge":
        return `value,${spec.value}`;
      case "table":
        return [spec.headers.join(","), ...spec.rows.map((r) => r.join(","))].join("\n");
      case "multi":
      case "gallery":
        return "";
    }
  } catch {
    return "";
  }
  return "";
}
