/**
 * Chart JSON spec definitions shared between the LLM (output) and
 * the client ChartRenderer (input). Keep this file import-safe for
 * both client and server (no server-only deps).
 */

export type ChartSpec =
  | LineChartSpec
  | BarChartSpec
  | PieChartSpec
  | HeatmapSpec
  | CandlestickSpec
  | TableSpec
  | MultiChartSpec;

export interface LineChartSpec {
  type: "line";
  title?: string;
  data: { x: string | number; y: number; label?: string }[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
}

export interface BarChartSpec {
  type: "bar";
  title?: string;
  data: { x: string; y: number; color?: string }[];
  color?: string;
}

export interface PieChartSpec {
  type: "pie";
  title?: string;
  data: { name: string; value: number }[];
  colors?: string[];
}

export interface HeatmapSpec {
  type: "heatmap";
  title?: string;
  rows: string[];
  cols: string[];
  values: number[][];
  colorMin?: string;
  colorMax?: string;
}

export interface CandlestickSpec {
  type: "candlestick";
  title?: string;
  data: { date: string; open: number; high: number; low: number; close: number }[];
}

export interface TableSpec {
  type: "table";
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  highlightLastRow?: boolean;
}

export interface MultiChartSpec {
  type: "multi";
  title?: string;
  charts: ChartSpec[];
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
