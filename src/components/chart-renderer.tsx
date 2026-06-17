"use client";

import { useId, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Brush,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap as RTreemap,
  LabelList,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { cn } from "@/lib/utils";
import type {
  ChartSpec,
  LineChartSpec,
  AreaChartSpec,
  BarChartSpec,
  StackedBarChartSpec,
  PieChartSpec,
  DonutChartSpec,
  HeatmapSpec,
  CandlestickSpec,
  CandlestickEnhancedSpec,
  ScatterChartSpec,
  GaugeSpec,
  TreemapSpec,
  ComparisonLineSpec,
  WaterfallSpec,
  TableSpec,
  MultiChartSpec,
  GalleryChartSpec,
} from "@/lib/chart-specs";

const DEFAULT_COLORS = [
  "#f59e0b",
  "#22d3ee",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#facc15",
  "#60a5fa",
  "#f97316",
];

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
} as const;

const AXIS_PROPS = {
  stroke: "#94a3b8",
  tick: { fontSize: 11, fill: "#94a3b8" },
  tickLine: { stroke: "#475569" },
} as const;

const GRID_PROPS = {
  stroke: "#334155",
  strokeDasharray: "3 3",
} as const;

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  switch (spec.type) {
    case "line":
      return <LineChartCard spec={spec} />;
    case "area":
      return <AreaChartCard spec={spec} />;
    case "bar":
      return <BarChartCard spec={spec} />;
    case "stackedBar":
      return <StackedBarChartCard spec={spec} />;
    case "pie":
      return <PieChartCard spec={spec} />;
    case "donut":
      return <DonutChartCard spec={spec} />;
    case "heatmap":
      return <HeatmapCard spec={spec} />;
    case "candlestick":
      return <CandlestickCard spec={spec} />;
    case "candlestick-enhanced":
      return <CandlestickEnhancedCard spec={spec} />;
    case "scatter":
      return <ScatterChartCard spec={spec} />;
    case "gauge":
      return <GaugeCard spec={spec} />;
    case "treemap":
      return <TreemapCard spec={spec} />;
    case "comparison-line":
      return <ComparisonLineCard spec={spec} />;
    case "waterfall":
      return <WaterfallCard spec={spec} />;
    case "table":
      return <DataTableCard spec={spec} />;
    case "multi":
      return <MultiChartCard spec={spec} />;
    case "gallery":
      return <GalleryCard spec={spec} />;
    default:
      return null;
  }
}

// ── Line chart with brush, multi-series, annotations ────────────────
function LineChartCard({ spec }: { spec: LineChartSpec }) {
  const multi = spec.series && spec.series.length > 0;
  const data = useMemo(() => {
    if (multi) {
      const xs = spec.series![0].data.map((d) => d.x);
      return xs.map((x, i) => {
        const row: Record<string, string | number> = { x };
        for (const s of spec.series!) {
          row[s.name] = s.data[i]?.y ?? 0;
        }
        return row;
      });
    }
    return spec.data.map((d) => ({ x: d.x, y: d.y }));
  }, [spec, multi]);

  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="x" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} width={56} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
            {multi ? (
              spec.series!.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey="y"
                stroke={spec.color || "#f59e0b"}
                strokeWidth={2}
                dot={{ r: 3, fill: spec.color || "#f59e0b" }}
                activeDot={{ r: 5 }}
                name={spec.yLabel || "value"}
                isAnimationActive={false}
              />
            )}
            {(spec.annotations || []).map((a, i) => (
              <ReferenceDot
                key={i}
                x={a.x}
                y={a.y ?? 0}
                r={6}
                fill={a.color || "#fb7185"}
                stroke="#0f172a"
                strokeWidth={2}
                label={{
                  value: a.label,
                  position: "top",
                  fill: a.color || "#fb7185",
                  fontSize: 10,
                }}
              />
            ))}
            {data.length > 20 && (
              <Brush
                dataKey="x"
                height={20}
                stroke="#f59e0b"
                fill="#1e293b"
                travellerWidth={8}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Area chart with gradient fill ───────────────────────────────────
function AreaChartCard({ spec }: { spec: AreaChartSpec }) {
  const color = spec.color || "#f59e0b";
  const rawId = useId();
  const gid = `area-grad-${rawId.replace(/:/g, "")}`;
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="x" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} width={56} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gid})`}
              name={spec.yLabel || "value"}
              isAnimationActive={false}
            />
            {(spec.annotations || []).map((a, i) => (
              <ReferenceLine
                key={i}
                x={a.x}
                stroke={a.color || "#fb7185"}
                strokeDasharray="4 4"
                label={{
                  value: a.label,
                  position: "top",
                  fill: a.color || "#fb7185",
                  fontSize: 10,
                }}
              />
            ))}
            {spec.data.length > 20 && (
              <Brush
                dataKey="x"
                height={20}
                stroke={color}
                fill="#1e293b"
                travellerWidth={8}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Bar chart ───────────────────────────────────────────────────────
function BarChartCard({ spec }: { spec: BarChartSpec }) {
  const data = spec.data.map((d) => ({ x: d.x, y: d.y, color: d.color }));
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="x" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} width={56} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
              cursor={{ fill: "rgba(245,158,11,0.06)" }}
            />
            <Bar dataKey="y" name={spec.yLabel || "value"} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color || spec.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Stacked bar chart ───────────────────────────────────────────────
function StackedBarChartCard({ spec }: { spec: StackedBarChartSpec }) {
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="x" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} width={56} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
              cursor={{ fill: "rgba(245,158,11,0.06)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
            {spec.series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                stackId="a"
                fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                radius={i === spec.series.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Pie chart ───────────────────────────────────────────────────────
function PieChartCard({ spec }: { spec: PieChartSpec }) {
  const colors = spec.colors && spec.colors.length > 0 ? spec.colors : DEFAULT_COLORS;
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spec.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={2}
              stroke="#0f172a"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
              <LabelList
                dataKey="name"
                position="outside"
                fill="#cbd5e1"
                fontSize={10}
              />
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Donut chart with center label ───────────────────────────────────
function DonutChartCard({ spec }: { spec: DonutChartSpec }) {
  const colors = spec.colors && spec.colors.length > 0 ? spec.colors : DEFAULT_COLORS;
  const total = spec.data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spec.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={70}
              paddingAngle={2}
              stroke="#0f172a"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            {spec.centerLabel || "Total"}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {spec.centerValue || formatNum(total)}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// ── Heatmap ─────────────────────────────────────────────────────────
function HeatmapCard({ spec }: { spec: HeatmapSpec }) {
  const { rows, cols, values } = spec;
  if (!rows.length || !cols.length || !values.length) {
    return (
      <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
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
  const colorMin = spec.colorMin || "#1e3a8a";
  const colorMax = spec.colorMax || "#f59e0b";
  function cellColor(v: number): string {
    const t = (v - min) / range;
    return lerpColor(colorMin, colorMax, t);
  }
  function textColor(v: number): string {
    const t = (v - min) / range;
    return t > 0.5 ? "#0f172a" : "#f1f5f9";
  }
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
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

// ── Candlestick (basic) ─────────────────────────────────────────────
function CandlestickCard({ spec }: { spec: CandlestickSpec }) {
  if (!spec.data.length) {
    return (
      <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
        <div className="text-xs text-slate-500">No candlestick data</div>
      </ChartCard>
    );
  }
  const data = spec.data;
  const allHigh = data.map((d) => d.high);
  const allLow = data.map((d) => d.low);
  const max = Math.max(...allHigh);
  const min = Math.min(...allLow);
  const range = max - min || 1;
  const W = 800;
  const H = 320;
  const PAD = 24;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const colW = innerW / data.length;
  const bodyW = Math.max(3, colW * 0.6);
  function yOf(v: number) {
    return PAD + ((max - v) / range) * innerH;
  }
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block max-w-full">
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
                <rect x={cx - bodyW / 2} y={top} width={bodyW} height={h} fill={color} opacity={0.85} />
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

// ── Candlestick enhanced (volume + SMA overlays) ────────────────────
function CandlestickEnhancedCard({ spec }: { spec: CandlestickEnhancedSpec }) {
  if (!spec.data.length) {
    return (
      <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
        <div className="text-xs text-slate-500">No candlestick data</div>
      </ChartCard>
    );
  }
  const data = spec.data;
  const allHigh = data.map((d) => d.high);
  const allLow = data.map((d) => d.low);
  const max = Math.max(...allHigh);
  const min = Math.min(...allLow);
  const range = max - min || 1;
  const maxVol = Math.max(...data.map((d) => d.volume || 0), 1);
  const W = 800;
  const PRICE_H = 240;
  const VOL_H = 70;
  const H = PRICE_H + VOL_H + 20;
  const PAD = 24;
  const innerW = W - PAD * 2;
  const priceInnerH = PRICE_H - PAD * 2;
  const volInnerH = VOL_H - 10;
  const colW = innerW / data.length;
  const bodyW = Math.max(3, colW * 0.6);
  const volTop = PRICE_H + 10;
  function yPrice(v: number) {
    return PAD + ((max - v) / range) * priceInnerH;
  }
  function yVol(v: number) {
    return volTop + volInnerH - (v / maxVol) * volInnerH;
  }
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block max-w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD + t * priceInnerH;
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
            const yHigh = yPrice(d.high);
            const yLow = yPrice(d.low);
            const yOpen = yPrice(d.open);
            const yClose = yPrice(d.close);
            const up = d.close >= d.open;
            const color = up ? "#34d399" : "#fb7185";
            const top = Math.min(yOpen, yClose);
            const h = Math.max(1, Math.abs(yClose - yOpen));
            const volY = yVol(d.volume || 0);
            const volHeight = Math.max(1, volTop + volInnerH - volY);
            return (
              <g key={i}>
                <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.5} />
                <rect x={cx - bodyW / 2} y={top} width={bodyW} height={h} fill={color} opacity={0.85} />
                {d.volume ? (
                  <rect
                    x={cx - bodyW / 2}
                    y={volY}
                    width={bodyW}
                    height={volHeight}
                    fill={color}
                    opacity={0.4}
                  />
                ) : null}
                {i % Math.ceil(data.length / 8) === 0 && (
                  <text x={cx} y={H - 4} fontSize={9} fill="#94a3b8" textAnchor="middle">
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
          {/* SMA overlays */}
          {(spec.overlays || []).map((ov, oi) => {
            const pts: string[] = [];
            ov.values.forEach((v, i) => {
              if (v == null || !isFinite(v)) return;
              const cx = PAD + i * colW + colW / 2;
              pts.push(`${cx},${yPrice(v)}`);
            });
            return (
              <polyline
                key={oi}
                points={pts.join(" ")}
                fill="none"
                stroke={ov.color || DEFAULT_COLORS[oi % DEFAULT_COLORS.length]}
                strokeWidth={1.5}
                opacity={0.9}
              />
            );
          })}
          {/* annotations */}
          {(spec.annotations || []).map((a, i) => {
            const xIdx = data.findIndex((d) => d.date === String(a.x) || d.date === a.x);
            if (xIdx < 0) return null;
            const cx = PAD + xIdx * colW + colW / 2;
            const cy = a.y != null ? yPrice(a.y) : PAD + 10;
            return (
              <g key={`ann-${i}`}>
                <line
                  x1={cx}
                  y1={PAD}
                  x2={cx}
                  y2={PRICE_H - PAD}
                  stroke={a.color || "#fb7185"}
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
                <text x={cx + 4} y={cy} fontSize={9} fill={a.color || "#fb7185"}>
                  {a.label}
                </text>
              </g>
            );
          })}
          {/* volume divider */}
          <line x1={0} y1={volTop - 5} x2={W} y2={volTop - 5} stroke="#334155" />
          <text x={4} y={volTop + 9} fontSize={9} fill="#94a3b8">
            Vol
          </text>
        </svg>
      </div>
    </ChartCard>
  );
}

// ── Scatter chart ───────────────────────────────────────────────────
function ScatterChartCard({ spec }: { spec: ScatterChartSpec }) {
  const multi = spec.series && spec.series.length > 0;
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis
              type="number"
              dataKey="x"
              name={spec.xLabel || "x"}
              {...AXIS_PROPS}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={spec.yLabel || "y"}
              {...AXIS_PROPS}
              width={56}
            />
            <ZAxis range={[40, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
            {multi ? (
              spec.series!.map((s, i) => (
                <Scatter
                  key={s.name}
                  name={s.name}
                  data={s.data}
                  fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  isAnimationActive={false}
                />
              ))
            ) : (
              <Scatter
                name="points"
                data={spec.data}
                fill={spec.data[0]?.color || "#22d3ee"}
                isAnimationActive={false}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Gauge (semicircle) ──────────────────────────────────────────────
function GaugeCard({ spec }: { spec: GaugeSpec }) {
  const min = spec.min ?? 0;
  const max = spec.max ?? 100;
  const range = max - min || 1;
  const v = Math.max(min, Math.min(max, spec.value));
  const t = (v - min) / range; // 0..1
  const W = 360;
  const H = 200;
  const cx = W / 2;
  const cy = H - 20;
  const r = 140;
  // semicircle: 180deg (left) → 0deg (right)
  const startAngle = 180;
  const endAngle = 0;
  const valueAngle = startAngle - t * 180;
  const zones = spec.zones || [
    { threshold: 33, color: "#fb7185" },
    { threshold: 66, color: "#facc15" },
    { threshold: 100, color: "#34d399" },
  ];
  function polar(angleDeg: number, radius: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + Math.cos(a) * radius, y: cy - Math.sin(a) * radius };
  }
  function arcPath(a1: number, a2: number, radius: number) {
    const p1 = polar(a1, radius);
    const p2 = polar(a2, radius);
    const large = Math.abs(a1 - a2) > 180 ? 1 : 0;
    const sweep = a1 > a2 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} ${sweep} ${p2.x} ${p2.y}`;
  }
  // Pick color for current value
  const activeColor = zones.find((z) => v <= z.threshold)?.color || "#34d399";
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="flex flex-col items-center">
        <svg width={W} height={H} className="block max-w-full">
          {/* background arc segments by zone */}
          {zones.map((z, i) => {
            const prevThreshold = i === 0 ? min : zones[i - 1].threshold;
            const t1 = (prevThreshold - min) / range;
            const t2 = (z.threshold - min) / range;
            const a1 = startAngle - t1 * 180;
            const a2 = startAngle - t2 * 180;
            return (
              <path
                key={i}
                d={arcPath(a1, a2, r)}
                fill="none"
                stroke={z.color}
                strokeWidth={18}
                opacity={0.25}
                strokeLinecap="butt"
              />
            );
          })}
          {/* active arc */}
          <path
            d={arcPath(startAngle, valueAngle, r)}
            fill="none"
            stroke={activeColor}
            strokeWidth={18}
            strokeLinecap="round"
          />
          {/* needle */}
          {(() => {
            const tip = polar(valueAngle, r - 4);
            return (
              <g>
                <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#f1f5f9" strokeWidth={2} />
                <circle cx={cx} cy={cy} r={5} fill="#f1f5f9" />
              </g>
            );
          })()}
          {/* labels */}
          <text x={polar(180, r + 18).x} y={polar(180, r + 18).y + 4} fontSize={10} fill="#94a3b8" textAnchor="middle">
            {String(min)}
          </text>
          <text x={polar(0, r + 18).x} y={polar(0, r + 18).y + 4} fontSize={10} fill="#94a3b8" textAnchor="middle">
            {String(max)}
          </text>
          <text x={cx} y={cy - 50} fontSize={28} fill={activeColor} textAnchor="middle" fontWeight="bold">
            {Number.isInteger(v) ? v : v.toFixed(2)}
          </text>
          {spec.label && (
            <text x={cx} y={cy - 28} fontSize={11} fill="#94a3b8" textAnchor="middle">
              {spec.label}
            </text>
          )}
        </svg>
      </div>
    </ChartCard>
  );
}

// ── Treemap ─────────────────────────────────────────────────────────
function TreemapCard({ spec }: { spec: TreemapSpec }) {
  if (!spec.data.length) {
    return (
      <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
        <div className="text-xs text-slate-500">No treemap data</div>
      </ChartCard>
    );
  }
  const colored = spec.data.map((d, i) => ({
    ...d,
    fill: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RTreemap
            data={colored}
            dataKey="value"
            stroke="#0f172a"
            isAnimationActive={false}
            content={(props: unknown) => <TreemapNode {...(props as TreemapNodeProps)} />}
          />
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

interface TreemapNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
  value?: number;
}
function TreemapNode(props: TreemapNodeProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, fill, value } = props;
  if (width < 0 || height < 0) return null;
  const showLabel = width > 60 && height > 30;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} stroke="#0f172a" strokeWidth={2} fill={fill || "#1e293b"} />
      {showLabel && (
        <>
          <text
            x={x + 4}
            y={y + 14}
            fontSize={11}
            fontWeight="bold"
            fill="#0f172a"
          >
            {(name || "").slice(0, Math.floor(width / 7))}
          </text>
          {value != null && (
            <text x={x + 4} y={y + 28} fontSize={10} fill="#0f172a" opacity={0.85}>
              {formatNum(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ── Comparison-line chart ───────────────────────────────────────────
function ComparisonLineCard({ spec }: { spec: ComparisonLineSpec }) {
  const data = useMemo(() => {
    if (!spec.series.length) return [];
    const xs = spec.series[0].data.map((d) => d.x);
    return xs.map((x, i) => {
      const row: Record<string, string | number> = { x };
      for (const s of spec.series) {
        row[s.name] = s.data[i]?.y ?? 0;
      }
      return row;
    });
  }, [spec]);
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="x" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} width={56} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#fbbf24" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
            {spec.series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
            {data.length > 20 && (
              <Brush
                dataKey="x"
                height={20}
                stroke="#f59e0b"
                fill="#1e293b"
                travellerWidth={8}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Waterfall chart ─────────────────────────────────────────────────
function WaterfallCard({ spec }: { spec: WaterfallSpec }) {
  if (!spec.data.length) {
    return (
      <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
        <div className="text-xs text-slate-500">No waterfall data</div>
      </ChartCard>
    );
  }
  // Compute running totals
  let running = 0;
  const bars = spec.data.map((d) => {
    if (d.isTotal) {
      const total = d.value;
      running = total;
      return {
        label: d.label,
        start: 0,
        end: total,
        value: total,
        color: "#f59e0b",
        isTotal: true,
      };
    }
    const start = running;
    const end = running + d.value;
    running = end;
    return {
      label: d.label,
      start,
      end,
      value: d.value,
      color: d.value >= 0 ? "#34d399" : "#fb7185",
      isTotal: false,
    };
  });
  const max = Math.max(...bars.map((b) => b.end));
  const min = Math.min(...bars.map((b) => b.start), 0);
  const range = max - min || 1;
  const W = 800;
  const H = 320;
  const PAD = 30;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const colW = innerW / bars.length;
  const barW = Math.max(8, colW * 0.55);
  function yOf(v: number) {
    return PAD + ((max - v) / range) * innerH;
  }
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block max-w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD + t * innerH;
            const val = max - t * range;
            return (
              <g key={t}>
                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#334155" strokeDasharray="3 3" />
                <text x={4} y={y + 3} fontSize={10} fill="#94a3b8">
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}
          {bars.map((b, i) => {
            const cx = PAD + i * colW + colW / 2;
            const y1 = yOf(b.end);
            const y2 = yOf(b.start);
            const h = Math.max(1, Math.abs(y2 - y1));
            return (
              <g key={i}>
                <rect
                  x={cx - barW / 2}
                  y={Math.min(y1, y2)}
                  width={barW}
                  height={h}
                  fill={b.color}
                  opacity={b.isTotal ? 1 : 0.85}
                  stroke={b.isTotal ? "#fbbf24" : "none"}
                />
                <text x={cx} y={Math.min(y1, y2) - 4} fontSize={9} fill="#e2e8f0" textAnchor="middle">
                  {b.value >= 0 ? "+" : ""}
                  {formatNum(b.value)}
                </text>
                <text x={cx} y={H - 8} fontSize={9} fill="#94a3b8" textAnchor="middle">
                  {b.label.slice(0, 10)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartCard>
  );
}

// ── Data table ──────────────────────────────────────────────────────
function DataTableCard({ spec }: { spec: TableSpec }) {
  return (
    <ChartCard title={spec.title} subtitle={spec.subtitle} spec={spec}>
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

// ── Multi-chart (legacy alias) ──────────────────────────────────────
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

// ── Gallery (responsive grid 1/2/3 cols) ────────────────────────────
function GalleryCard({ spec }: { spec: GalleryChartSpec }) {
  const cols = spec.columns || 2;
  const gridCls =
    cols === 1
      ? "grid-cols-1"
      : cols === 3
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2";
  return (
    <div className="space-y-4">
      {spec.title && (
        <div className="text-sm font-semibold text-slate-100">{spec.title}</div>
      )}
      <div className={cn("grid gap-4", gridCls)}>
        {spec.charts.map((c, i) => (
          <ChartRenderer key={i} spec={c} />
        ))}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────
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
