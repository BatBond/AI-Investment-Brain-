/**
 * Chart JSON spec definitions shared between the LLM (output) and
 * the client ChartRenderer (input). Keep this file import-safe for
 * both client and server (no server-only deps).
 */

export type ChartSpec =
  | LineChartSpec
  | AreaChartSpec
  | BarChartSpec
  | StackedBarChartSpec
  | PieChartSpec
  | DonutChartSpec
  | HeatmapSpec
  | CandlestickSpec
  | CandlestickEnhancedSpec
  | ScatterChartSpec
  | GaugeSpec
  | TreemapSpec
  | ComparisonLineSpec
  | WaterfallSpec
  | TableSpec
  | MultiChartSpec
  | GalleryChartSpec;

export interface ChartAnnotation {
  x: string | number;
  y?: number;
  label: string;
  color?: string;
}

export interface LineChartSpec {
  type: "line";
  title?: string;
  subtitle?: string;
  data: { x: string | number; y: number; label?: string }[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  annotations?: ChartAnnotation[];
  /** Series overlay: when set, render multi-series line chart */
  series?: { name: string; color?: string; data: { x: string | number; y: number }[] }[];
}

export interface AreaChartSpec {
  type: "area";
  title?: string;
  subtitle?: string;
  data: { x: string | number; y: number }[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  annotations?: ChartAnnotation[];
}

export interface BarChartSpec {
  type: "bar";
  title?: string;
  subtitle?: string;
  data: { x: string; y: number; color?: string }[];
  color?: string;
  yLabel?: string;
}

export interface StackedBarChartSpec {
  type: "stackedBar";
  title?: string;
  subtitle?: string;
  data: { x: string; [series: string]: string | number }[];
  series: { name: string; color?: string }[];
  yLabel?: string;
}

export interface PieChartSpec {
  type: "pie";
  title?: string;
  subtitle?: string;
  data: { name: string; value: number }[];
  colors?: string[];
}

export interface DonutChartSpec {
  type: "donut";
  title?: string;
  subtitle?: string;
  data: { name: string; value: number }[];
  colors?: string[];
  centerLabel?: string;
  centerValue?: string;
}

export interface HeatmapSpec {
  type: "heatmap";
  title?: string;
  subtitle?: string;
  rows: string[];
  cols: string[];
  values: number[][];
  colorMin?: string;
  colorMax?: string;
}

export interface CandlestickSpec {
  type: "candlestick";
  title?: string;
  subtitle?: string;
  data: { date: string; open: number; high: number; low: number; close: number }[];
}

export interface CandlestickEnhancedSpec {
  type: "candlestick-enhanced";
  title?: string;
  subtitle?: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }[];
  /** Optional SMA overlay keys (e.g. ["sma20","sma50"]) */
  overlays?: { name: string; color?: string; values: (number | null)[] }[];
  annotations?: ChartAnnotation[];
}

export interface ScatterChartSpec {
  type: "scatter";
  title?: string;
  subtitle?: string;
  data: { x: number; y: number; name?: string; size?: number; color?: string }[];
  xLabel?: string;
  yLabel?: string;
  /** Optional second series for comparison */
  series?: { name: string; color?: string; data: { x: number; y: number; name?: string; size?: number }[] }[];
}

export interface GaugeSpec {
  type: "gauge";
  title?: string;
  subtitle?: string;
  value: number; // 0-100 for confidence, or -1 to +1 for sentiment
  min?: number; // default 0
  max?: number; // default 100
  label?: string;
  /** color zones: low / mid / high thresholds */
  zones?: { threshold: number; color: string }[];
}

export interface TreemapSpec {
  type: "treemap";
  title?: string;
  subtitle?: string;
  data: { name: string; value: number; color?: string; parent?: string }[];
}

export interface ComparisonLineSpec {
  type: "comparison-line";
  title?: string;
  subtitle?: string;
  /** Each series = one ticker */
  series: { name: string; color?: string; data: { x: string | number; y: number }[] }[];
  xLabel?: string;
  yLabel?: string;
}

export interface WaterfallSpec {
  type: "waterfall";
  title?: string;
  subtitle?: string;
  data: { label: string; value: number; isTotal?: boolean }[];
  yLabel?: string;
}

export interface TableSpec {
  type: "table";
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  highlightLastRow?: boolean;
}

export interface MultiChartSpec {
  type: "multi";
  title?: string;
  charts: ChartSpec[];
}

export interface GalleryChartSpec {
  type: "gallery";
  title?: string;
  charts: ChartSpec[];
  columns?: 1 | 2 | 3;
}

/**
 * Parse all `<!--CHART_JSON:{...}-->` blocks from LLM markdown output.
 * Each block must be a single JSON object on one line (no nested HTML
 * comments). Returns parsed specs in order, skipping any that fail JSON
 * parse. Also returns the markdown with the chart blocks stripped out.
 */
export function extractChartSpecs(md: string): {
  charts: ChartSpec[];
  markdown: string;
} {
  const charts: ChartSpec[] = [];
  // Match either the HTML-comment form or a fenced ```chart-json block.
  const re = /<!--CHART_JSON:([\s\S]*?)-->/g;
  const stripped = md.replace(re, (_match, raw) => {
    try {
      const spec = JSON.parse(raw.trim());
      if (spec && typeof spec === "object" && "type" in spec) {
        charts.push(spec as ChartSpec);
      }
    } catch {
      /* skip */
    }
    return "";
  });
  // Trim trailing whitespace per line
  const cleaned = stripped
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { charts, markdown: cleaned };
}
