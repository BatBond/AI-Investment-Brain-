"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ChartSpec,
  LineChartSpec,
  BarChartSpec,
  PieChartSpec,
  HeatmapSpec,
  CandlestickSpec,
  TableSpec,
  MultiChartSpec,
} from "@/lib/chart-specs";

const DEFAULT_COLORS = ["#f59e0b", "#22d3ee", "#34d399", "#a78bfa", "#fb7185", "#facc15"];

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  switch (spec.type) {
    case "line":
      return <LineChartCard spec={spec} />;
    case "bar":
      return <BarChartCard spec={spec} />;
    case "pie":
      return <PieChartCard spec={spec} />;
    case "heatmap":
      return <HeatmapCard spec={spec} />;
    case "candlestick":
      return <CandlestickCard spec={spec} />;
    case "table":
      return <DataTableCard spec={spec} />;
    case "multi":
      return <MultiChartCard spec={spec} />;
    default:
      return null;
  }
}

function ChartCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-700 bg-slate-800/60">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

function LineChartCard({ spec }: { spec: LineChartSpec }) {
  const data = spec.data.map((d) => ({ x: d.x, y: d.y }));
  return (
    <ChartCard title={spec.title}>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
              width={56}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke={spec.color || "#f59e0b"}
              strokeWidth={2}
              dot={{ r: 3, fill: spec.color || "#f59e0b" }}
              activeDot={{ r: 5 }}
              name={spec.yLabel || "value"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function BarChartCard({ spec }: { spec: BarChartSpec }) {
  const data = spec.data.map((d) => ({ x: d.x, y: d.y, color: d.color }));
  return (
    <ChartCard title={spec.title}>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
              width={56}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
              cursor={{ fill: "rgba(245,158,11,0.06)" }}
            />
            <Bar dataKey="y" name={spec.yLabel || "value"} radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color || spec.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function PieChartCard({ spec }: { spec: PieChartSpec }) {
  const colors = spec.colors && spec.colors.length > 0 ? spec.colors : DEFAULT_COLORS;
  return (
    <ChartCard title={spec.title}>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spec.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              stroke="#0f172a"
              strokeWidth={2}
            >
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
              }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function HeatmapCard({ spec }: { spec: HeatmapSpec }) {
  const { rows, cols, values } = spec;
  if (!rows.length || !cols.length || !values.length) {
    return (
      <ChartCard title={spec.title}>
        <div className="text-xs text-slate-500">No heatmap data</div>
      </ChartCard>
    );
  }
  let min = Infinity;
  let max = -Infinity;
  for (const row of values) {
    for (const v of row) {
      if (typeof v === "number" && isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 1;
  const range = max - min || 1;
  const colorMin = spec.colorMin || "#1e3a8a"; // dark blue
  const colorMax = spec.colorMax || "#f59e0b"; // amber
  function cellColor(v: number): string {
    const t = (v - min) / range;
    return lerpColor(colorMin, colorMax, t);
  }
  function textColor(v: number): string {
    const t = (v - min) / range;
    return t > 0.5 ? "#0f172a" : "#f1f5f9";
  }
  return (
    <ChartCard title={spec.title}>
      <div className="overflow-x-auto">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="px-2 py-1"></th>
              {cols.map((c) => (
                <th key={c} className="px-2 py-1 text-amber-300 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r}>
                <td className="px-2 py-1 text-amber-300 font-semibold text-right">{r}</td>
                {cols.map((c, ci) => {
                  const v = values[ri]?.[ci];
                  const num = typeof v === "number" ? v : NaN;
                  return (
                    <td
                      key={c}
                      className="px-2 py-1 text-center font-mono tabular-nums border border-slate-700/40"
                      style={{
                        backgroundColor: isFinite(num) ? cellColor(num) : "#1e293b",
                        color: isFinite(num) ? textColor(num) : "#64748b",
                        minWidth: 64,
                      }}
                    >
                      {isFinite(num) ? formatNum(num) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>{formatNum(min)}</span>
        <div
          className="h-2 flex-1 rounded"
          style={{ background: `linear-gradient(to right, ${colorMin}, ${colorMax})` }}
        />
        <span>{formatNum(max)}</span>
      </div>
    </ChartCard>
  );
}

function CandlestickCard({ spec }: { spec: CandlestickSpec }) {
  if (!spec.data.length) {
    return (
      <ChartCard title={spec.title}>
        <div className="text-xs text-slate-500">No candlestick data</div>
      </ChartCard>
    );
  }
  // Compute scales
  const data = spec.data;
  const allHigh = data.map((d) => d.high);
  const allLow = data.map((d) => d.low);
  const max = Math.max(...allHigh);
  const min = Math.min(...allLow);
  const range = max - min || 1;
  const W = 800;
  const H = 280;
  const PAD = 24;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const colW = innerW / data.length;
  const bodyW = Math.max(3, colW * 0.6);
  function yOf(v: number) {
    return PAD + ((max - v) / range) * innerH;
  }
  return (
    <ChartCard title={spec.title}>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block max-w-full">
          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD + t * innerH;
            const val = max - t * range;
            return (
              <g key={t}>
                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#334155" strokeDasharray="3 3" />
                <text x={4} y={y + 3} fontSize={10} fill="#94a3b8">
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}
          {/* candles */}
          {data.map((d, i) => {
            const cx = PAD + i * colW + colW / 2;
            const yHigh = yOf(d.high);
            const yLow = yOf(d.low);
            const yOpen = yOf(d.open);
            const yClose = yOf(d.close);
            const up = d.close >= d.open;
            const color = up ? "#34d399" : "#fb7185";
            const top = Math.min(yOpen, yClose);
            const h = Math.max(1, Math.abs(yClose - yOpen));
            return (
              <g key={i}>
                <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.5} />
                <rect
                  x={cx - bodyW / 2}
                  y={top}
                  width={bodyW}
                  height={h}
                  fill={color}
                  opacity={0.85}
                />
                {i % Math.ceil(data.length / 8) === 0 && (
                  <text x={cx} y={H - 4} fontSize={9} fill="#94a3b8" textAnchor="middle">
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </ChartCard>
  );
}

function DataTableCard({ spec }: { spec: TableSpec }) {
  return (
    <ChartCard title={spec.title}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-amber-300">
              {spec.headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, i) => {
              const isLast = spec.highlightLastRow && i === spec.rows.length - 1;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-t border-slate-700/50",
                    isLast && "bg-amber-500/10 font-semibold text-amber-200"
                  )}
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 font-mono tabular-nums text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function MultiChartCard({ spec }: { spec: MultiChartSpec }) {
  return (
    <div className="space-y-4">
      {spec.title && (
        <div className="text-sm font-semibold text-slate-100">{spec.title}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spec.charts.map((c, i) => (
          <ChartRenderer key={i} spec={c} />
        ))}
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────
function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function formatNum(v: number): string {
  if (!isFinite(v)) return "—";
  if (Math.abs(v) >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(3);
}
