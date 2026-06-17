"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  color?: string;
  fill?: string;
  showArea?: boolean;
  className?: string;
}

/**
 * Lightweight pure-SVG sparkline. No chart lib needed.
 */
export function Sparkline({
  data,
  width = "100%",
  height = 48,
  color = "#22d3ee",
  fill = "rgba(34,211,238,0.12)",
  showArea = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={cn("text-xs text-slate-500", className)}>—</div>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100; // viewBox width
  const h = 100; // viewBox height
  const step = w / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / range) * h;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
      className={cn("block", className)}
      aria-hidden
    >
      {showArea && <path d={areaPath} fill={fill} stroke="none" />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface BarChartMiniProps {
  data: { label: string; value: number; positive?: boolean }[];
  height?: number;
  color?: string;
  positiveColor?: string;
  negativeColor?: string;
  className?: string;
}

/**
 * Small ASCII-style or block-style mini bar chart for LLM-driven output.
 */
export function BarChartMini({
  data,
  height = 80,
  color = "#fbbf24",
  positiveColor = "#10b981",
  negativeColor = "#ef4444",
  className,
}: BarChartMiniProps) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <div
      className={cn("flex items-end gap-2", className)}
      style={{ height }}
    >
      {data.map((d, i) => {
        const pct = (Math.abs(d.value) / max) * 100;
        const c =
          d.positive === undefined
            ? color
            : d.positive
              ? positiveColor
              : negativeColor;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: height - 18 }}>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${pct}%`,
                  backgroundColor: c,
                  minHeight: 2,
                }}
                title={`${d.label}: ${d.value.toFixed(1)}%`}
              />
            </div>
            <div className="text-[9px] text-slate-500 truncate w-full text-center">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
