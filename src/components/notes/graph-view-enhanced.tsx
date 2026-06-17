"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  pinned: boolean;
  linkCount: number;
  createdAt?: string;
  wordCount?: number;
}
interface GraphLink {
  source: string;
  target: string;
}
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    totalNodes: number;
    totalLinks: number;
    avgLinksPerNote: string;
    orphanCount: number;
  };
}

type Layout = "force" | "radial" | "circular" | "hierarchical";
type ColorBy = "tag" | "date" | "size" | "links";

interface GraphViewEnhancedProps {
  data: GraphData;
  onOpenNode: (id: string) => void;
}

const TAG_COLORS = ["#f59e0b", "#22d3ee", "#34d399", "#a78bfa", "#fb7185", "#facc15", "#60a5fa"];

export function GraphViewEnhanced({ data, onOpenNode }: GraphViewEnhancedProps) {
  const [layout, setLayout] = useState<Layout>("force");
  const [colorBy, setColorBy] = useState<ColorBy>("tag");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 480 });
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    function update() {
      if (!sizeRef.current) return;
      const r = sizeRef.current.getBoundingClientRect();
      setDims({ w: Math.max(320, r.width), h: 480 });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const positioned = useMemo(() => {
    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;
    const nodes = data.nodes;
    const radius = Math.min(w, h) / 2 - 60;

    const positions = new Map<
      string,
      { x: number; y: number; vx: number; vy: number }
    >();
    nodes.forEach((n, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      const r = nodes.length === 1 ? 0 : radius * 0.8;
      positions.set(n.id, {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      });
    });

    const linkMap = new Map<string, Set<string>>();
    for (const l of data.links) {
      if (!linkMap.has(l.source)) linkMap.set(l.source, new Set());
      if (!linkMap.has(l.target)) linkMap.set(l.target, new Set());
      linkMap.get(l.source)!.add(l.target);
      linkMap.get(l.target)!.add(l.source);
    }

    if (layout === "force" || layout === "hierarchical") {
      const k = 80;
      const iters = layout === "hierarchical" ? 60 : 140;
      const arr = Array.from(positions.entries()).map(([id, p]) => ({ id, ...p }));
      for (let it = 0; it < iters; it++) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const a = arr[i];
            const b = arr[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
            if (dist > 350) continue;
            const f = (k * k) / dist;
            const fx = (dx / dist) * f * 0.05;
            const fy = (dy / dist) * f * 0.05;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
        for (const l of data.links) {
          const a = positions.get(l.source);
          const b = positions.get(l.target);
          if (!a || !b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const f = (dist * dist) / k;
          const fx = (dx / dist) * f * 0.05;
          const fy = (dy / dist) * f * 0.05;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
        for (const n of arr) {
          n.vx += (cx - n.x) * 0.005;
          n.vy += (cy - n.y) * 0.005;
          n.x += n.vx * 0.4;
          n.y += n.vy * 0.4;
          n.vx *= 0.85;
          n.vy *= 0.85;
          const pad = 30;
          if (n.x < pad) n.x = pad;
          if (n.x > w - pad) n.x = w - pad;
          if (n.y < pad) n.y = pad;
          if (n.y > h - pad) n.y = h - pad;
          positions.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
        }
      }
    } else if (layout === "radial") {
      // Ring layout by link count (hub = inner)
      const sorted = [...nodes].sort((a, b) => b.linkCount - a.linkCount);
      sorted.forEach((n, i) => {
        const ring = Math.floor(i / 8);
        const angle = ((i % 8) / 8) * Math.PI * 2;
        const r = ring * 70 + 60;
        positions.set(n.id, {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        });
      });
    }

    return { positions, linkMap, arr: Array.from(positions.entries()).map(([id, p]) => ({ id, ...p, ...nodes.find((n) => n.id === id)! })) };
  }, [data, dims, layout]);

  // Filter nodes by search + tag
  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ids = new Set<string>();
    for (const n of data.nodes) {
      if (filterTag && !n.tags.includes(filterTag)) continue;
      if (q && !n.title.toLowerCase().includes(q)) continue;
      ids.add(n.id);
    }
    return ids;
  }, [data.nodes, search, filterTag]);

  function colorFor(n: GraphNode): string {
    if (colorBy === "tag") {
      if (!n.tags || n.tags.length === 0) return "#64748b";
      const first = n.tags[0];
      let hash = 0;
      for (let i = 0; i < first.length; i++) hash = (hash * 31 + first.charCodeAt(i)) | 0;
      return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
    }
    if (colorBy === "links") {
      const t = Math.min(1, n.linkCount / 6);
      return lerpColor("#475569", "#fbbf24", t);
    }
    if (colorBy === "size") {
      const wc = n.wordCount ?? n.title.length;
      const t = Math.min(1, wc / 500);
      return lerpColor("#475569", "#34d399", t);
    }
    // date — recent = bright
    return "#22d3ee";
  }

  function radiusFor(n: GraphNode): number {
    return 8 + Math.min(12, n.linkCount * 1.6);
  }

  function isDimmed(id: string): boolean {
    if (!hovered && !search && !filterTag) return false;
    if (hovered) {
      if (id === hovered) return false;
      const neighbors = positioned.linkMap.get(hovered);
      if (neighbors?.has(id)) return false;
      return true;
    }
    if (search || filterTag) {
      return !filteredIds.has(id);
    }
    return false;
  }

  // Drag + pan handlers
  function onMouseDownNode(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDraggedNode(id);
    const p = positioned.positions.get(id)!;
    const rect = sizeRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - pan.x - p.x * zoom,
      y: e.clientY - rect.top - pan.y - p.y * zoom,
    };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (draggedNode && dragOffset.current) {
      const rect = sizeRef.current!.getBoundingClientRect();
      const newX = (e.clientX - rect.left - pan.x - dragOffset.current.x) / zoom;
      const newY = (e.clientY - rect.top - pan.y - dragOffset.current.y) / zoom;
      const p = positioned.positions.get(draggedNode);
      if (p) {
        p.x = newX;
        p.y = newY;
      }
      // force re-render
      setHovered((h) => h);
    } else if (isPanning.current && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
  }
  function onMouseUp() {
    setDraggedNode(null);
    dragOffset.current = null;
    isPanning.current = false;
    panStart.current = null;
  }
  function onMouseDownSvg(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      setHovered(null);
    }
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.4, Math.min(3, z + delta)));
  }

  const allTags = useMemo(() => {
    const s = new Set<string>();
    data.nodes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data.nodes]);

  if (data.nodes.length === 0) {
    return (
      <div className="h-[480px] flex items-center justify-center text-slate-500 text-sm">
        No notes to graph yet. Create a few notes with [[wiki-links]] between them.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex rounded-md border border-slate-700 overflow-hidden">
          {(["force", "radial", "circular", "hierarchical"] as Layout[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={cn(
                "px-2 py-1 capitalize",
                layout === l
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-slate-700 overflow-hidden">
          {(["tag", "links", "size", "date"] as ColorBy[]).map((c) => (
            <button
              key={c}
              onClick={() => setColorBy(c)}
              className={cn(
                "px-2 py-1 capitalize",
                colorBy === c
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              color: {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search graph…"
            className="h-7 w-40 pl-7 bg-slate-900/70 border-slate-700 text-xs text-slate-100"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={filterTag || ""}
            onChange={(e) => setFilterTag(e.target.value || null)}
            className="h-7 rounded border border-slate-700 bg-slate-900/70 px-2 text-xs text-slate-100"
          >
            <option value="">all tags</option>
            {allTags.slice(0, 30).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="h-7 w-7 p-0 border-slate-700 bg-slate-900/40"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="h-7 w-7 p-0 border-slate-700 bg-slate-900/40"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="h-7 px-2 border-slate-700 bg-slate-900/40"
          >
            <Maximize2 className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Graph SVG */}
      <div
        ref={sizeRef}
        className="relative w-full overflow-hidden rounded-md border border-slate-700 bg-slate-950/40"
        style={{ height: 480 }}
      >
        <svg
          width={dims.w}
          height={dims.h}
          className="block cursor-grab"
          onMouseDown={onMouseDownSvg}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* edges */}
            {data.links.map((l, i) => {
              const a = positioned.positions.get(l.source);
              const b = positioned.positions.get(l.target);
              if (!a || !b) return null;
              const dimmed =
                (hovered && hovered !== l.source && hovered !== l.target) ||
                ((search || filterTag) &&
                  (!filteredIds.has(l.source) || !filteredIds.has(l.target)));
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={dimmed ? "#1e293b" : "#475569"}
                  strokeWidth={dimmed ? 1 : 1.5}
                  opacity={dimmed ? 0.2 : 0.7}
                />
              );
            })}
            {/* nodes */}
            {positioned.arr.map((n) => {
              const p = positioned.positions.get(n.id)!;
              const color = colorFor(n);
              const r = radiusFor(n);
              const dimmed = isDimmed(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  style={{
                    cursor: draggedNode === n.id ? "grabbing" : "pointer",
                    opacity: dimmed ? 0.3 : 1,
                  }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  onMouseDown={(e) => onMouseDownNode(e, n.id)}
                  onClick={(e) => {
                    if (!dragOffset.current) onOpenNode(n.id);
                    e.stopPropagation();
                  }}
                >
                  <circle
                    r={r}
                    fill={color}
                    stroke={n.pinned ? "#fbbf24" : "#0f172a"}
                    strokeWidth={n.pinned ? 3 : 1.5}
                    opacity={0.9}
                  />
                  <text
                    y={r + 11}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize={10}
                    fontWeight={n.id === hovered ? 700 : 400}
                  >
                    {n.title.length > 24 ? n.title.slice(0, 22) + "…" : n.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        <StatCard label="Total notes" value={String(data.stats.totalNodes)} />
        <StatCard label="Total links" value={String(data.stats.totalLinks)} />
        <StatCard label="Avg links/note" value={data.stats.avgLinksPerNote} />
        <StatCard label="Orphans" value={String(data.stats.orphanCount)} />
        <StatCard label="Tags" value={String(allTags.length)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-mono font-bold text-slate-100">{value}</div>
    </div>
  );
}

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
