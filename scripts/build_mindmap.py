"""
AI Investment Brain — Knowledge Graph Builder
Generates three deliverables from a single source-of-truth tree:
  1. ai_brain_mindmap.html  — Bloomberg Dark themed Playwright+CSS mindmap (interactive)
  2. ai_brain_mindmap.png   — High-res PNG screenshot
  3. ai_brain_mindmap.mmd   — Mermaid mindmap code (editable)

Design system: Bloomberg Dark — #0F172A bg, amber/cyan/blue accents, status pills per node.
"""

import json
import subprocess
from pathlib import Path

# ============================================================================
# 1. KNOWLEDGE GRAPH DATA — single source of truth
# ============================================================================

# Status values: "done" | "progress" | "planned"
# Each branch / sub-branch / leaf has a status

LEFT_BRANCHES = [
    {
        "label": "Core AI Brain",
        "color": "cyan",
        "status": "progress",
        "children": [
            {
                "label": "Self-Learning Signal Brain",
                "status": "planned",
                "children": [
                    ("Pattern Memory", "planned"),
                    ("Adaptive Weights", "planned"),
                    ("Backtest Feedback Loop", "planned"),
                    ("Signal Decay Logic", "planned"),
                ],
            },
            {
                "label": "Knowledge Consolidation",
                "status": "progress",
                "children": [
                    ("Master Theses", "planned"),
                    ("Cross-Ticker Synthesis", "planned"),
                    ("Thesis Versioning", "progress"),
                ],
            },
            {
                "label": "Reasoning Engine",
                "status": "progress",
                "children": [
                    ("Hypothesis Generation", "progress"),
                    ("Confidence Scoring", "progress"),
                    ("Counter-Evidence Tracking", "planned"),
                ],
            },
        ],
    },
    {
        "label": "5-Persona Advisory Engine",
        "color": "amber",
        "status": "progress",
        "children": [
            {
                "label": "Growth Hawk",
                "status": "done",
                "children": [
                    ("Revenue Growth > 20%", "done"),
                    ("EPS Momentum", "done"),
                    ("TAM Expansion", "progress"),
                ],
            },
            {
                "label": "Value Seeker",
                "status": "done",
                "children": [
                    ("P/E & P/B Ratios", "done"),
                    ("Margin of Safety", "done"),
                    ("FCF Yield", "progress"),
                ],
            },
            {
                "label": "Momentum Trader",
                "status": "progress",
                "children": [
                    ("Relative Strength", "done"),
                    ("Breakout Patterns", "progress"),
                    ("Volume Surges", "progress"),
                ],
            },
            {
                "label": "Defensive Shield",
                "status": "progress",
                "children": [
                    ("Beta < 1.0", "done"),
                    ("Low Volatility", "done"),
                    ("Quality Metrics (Piotroski)", "planned"),
                ],
            },
            {
                "label": "ESG Conscious",
                "status": "planned",
                "children": [
                    ("Carbon Score", "planned"),
                    ("Governance Rating", "planned"),
                    ("Social Impact Index", "planned"),
                ],
            },
        ],
    },
    {
        "label": "Data Sources",
        "color": "rose",
        "status": "progress",
        "children": [
            {
                "label": "Live Market Data",
                "status": "done",
                "children": [
                    ("Real-time Quotes", "done"),
                    ("Intraday Bars", "done"),
                    ("Order Book Depth", "progress"),
                ],
            },
            {
                "label": "Ticker Search",
                "status": "done",
                "children": [
                    ("Equities & ETFs", "done"),
                    ("Global Indices", "done"),
                ],
            },
            {
                "label": "Fundamental Data",
                "status": "progress",
                "children": [
                    ("Financial Statements", "done"),
                    ("Earnings Calendar", "done"),
                    ("Analyst Estimates", "progress"),
                ],
            },
            {
                "label": "News & Alt Data",
                "status": "planned",
                "children": [
                    ("News Feeds", "progress"),
                    ("Sentiment Analysis", "planned"),
                ],
            },
        ],
    },
]

RIGHT_BRANCHES = [
    {
        "label": "Analytics & TradingView",
        "color": "blue",
        "status": "progress",
        "children": [
            {
                "label": "DCF Valuation",
                "status": "progress",
                "children": [
                    ("WACC Calculation", "progress"),
                    ("Terminal Value (Gordon)", "progress"),
                    ("Scenario Analysis", "planned"),
                ],
            },
            {
                "label": "Technical Indicators",
                "status": "done",
                "children": [
                    ("RSI (14)", "done"),
                    ("MACD (12,26,9)", "done"),
                    ("Bollinger Bands (20,2)", "done"),
                    ("SMA 50 / 200", "done"),
                    ("ATR (14)", "done"),
                ],
            },
            {
                "label": "Support / Resistance",
                "status": "done",
                "children": [
                    ("Auto-Level Detection", "done"),
                    ("Volume Profile", "progress"),
                ],
            },
            {
                "label": "Chart Patterns",
                "status": "progress",
                "children": [
                    ("Head & Shoulders", "progress"),
                    ("Double Top / Bottom", "progress"),
                    ("Triangles & Wedges", "planned"),
                ],
            },
            {
                "label": "TradingView Integration",
                "status": "planned",
                "children": [
                    ("Advanced Charts Widget", "planned"),
                    ("Heat Maps", "planned"),
                    ("Watchlist Sync", "planned"),
                    ("Drawing Tools", "planned"),
                ],
            },
        ],
    },
    {
        "label": "Signals & Screeners",
        "color": "green",
        "status": "progress",
        "children": [
            {
                "label": "Buy / Sell Signals",
                "status": "progress",
                "children": [
                    ("Multi-Factor Composite", "progress"),
                    ("Confidence Score (0–100)", "progress"),
                    ("Risk / Reward Ratio", "progress"),
                ],
            },
            {
                "label": "Dividend Screening",
                "status": "planned",
                "children": [
                    ("Yield Filters (>3%)", "planned"),
                    ("Payout Ratio (<70%)", "planned"),
                    ("Dividend Growth (5Y)", "planned"),
                    ("Ex-Div Calendar", "planned"),
                ],
            },
            {
                "label": "Momentum Screener",
                "status": "progress",
                "children": [
                    ("52-Week High Scan", "done"),
                    ("Golden Cross Scan", "progress"),
                ],
            },
            {
                "label": "Value Screener",
                "status": "planned",
                "children": [
                    ("Low P/E Universe", "planned"),
                    ("FCF Positive Screen", "planned"),
                ],
            },
        ],
    },
    {
        "label": "Daily Workflows",
        "color": "violet",
        "status": "progress",
        "children": [
            {
                "label": "Morning Brief",
                "status": "progress",
                "children": [
                    ("Pre-Market Summary", "progress"),
                    ("Top Movers", "done"),
                    ("News Catalysts", "progress"),
                    ("Watchlist Alerts", "progress"),
                ],
            },
            {
                "label": "New Note",
                "status": "done",
                "children": [
                    ("Quick Capture", "done"),
                    ("Ticker Tagging", "done"),
                ],
            },
            {
                "label": "Braindump",
                "status": "progress",
                "children": [
                    ("Auto-Tagging", "progress"),
                    ("Full-Text Search Index", "progress"),
                ],
            },
            {
                "label": "Auto-Research",
                "status": "progress",
                "children": [
                    ("Ticker Deep Dive", "done"),
                    ("URL Scouting & Summarize", "progress"),
                ],
            },
        ],
    },
    {
        "label": "Agent Capabilities",
        "color": "teal",
        "status": "done",
        "children": [
            {
                "label": "Trade Hypotheses",
                "status": "done",
                "children": [
                    ("Entry Levels", "done"),
                    ("Target Zones", "done"),
                    ("Stop-Loss Placement", "done"),
                ],
            },
            {
                "label": "Stock Comparison",
                "status": "done",
                "children": [
                    ("Peer Group Metrics", "done"),
                ],
            },
            {
                "label": "Relative Strength",
                "status": "done",
                "children": [
                    ("RS vs Index", "done"),
                    ("Sector RS Ranking", "progress"),
                ],
            },
            {
                "label": "Real-Time Alerts",
                "status": "progress",
                "children": [
                    ("Price Alerts", "done"),
                    ("Signal Trigger Alerts", "progress"),
                ],
            },
        ],
    },
]

# ============================================================================
# 2. STATUS HELPERS
# ============================================================================

STATUS_META = {
    "done":     {"label": "Done",        "dot": "#10B981", "text": "#6EE7B7", "bg": "#064E3B", "border": "#10B981"},
    "progress": {"label": "In Progress", "dot": "#F59E0B", "text": "#FCD34D", "bg": "#451A03", "border": "#F59E0B"},
    "planned":  {"label": "Planned",     "dot": "#64748B", "text": "#CBD5E1", "bg": "#1E293B", "border": "#475569"},
}

# Branch color palette — dark theme, low-saturation backgrounds with saturated borders
COLOR_META = {
    "cyan":    {"border": "#22D3EE", "text": "#67E8F9", "bg": "#0C4A6E", "sub_border": "#0E7490", "sub_bg": "#083344", "sub_text": "#67E8F9"},
    "amber":   {"border": "#FBBF24", "text": "#FCD34D", "bg": "#78350F", "sub_border": "#B45309", "sub_bg": "#451A03", "sub_text": "#FCD34D"},
    "rose":    {"border": "#FB7185", "text": "#FDA4AF", "bg": "#881337", "sub_border": "#BE123C", "sub_bg": "#4C0519", "sub_text": "#FDA4AF"},
    "blue":    {"border": "#60A5FA", "text": "#93C5FD", "bg": "#1E3A8A", "sub_border": "#1D4ED8", "sub_bg": "#172554", "sub_text": "#93C5FD"},
    "green":   {"border": "#34D399", "text": "#6EE7B7", "bg": "#065F46", "sub_border": "#047857", "sub_bg": "#022C22", "sub_text": "#6EE7B7"},
    "violet":  {"border": "#A78BFA", "text": "#C4B5FD", "bg": "#5B21B6", "sub_border": "#6D28D9", "sub_bg": "#2E1065", "sub_text": "#C4B5FD"},
    "teal":    {"border": "#2DD4BF", "text": "#5EEAD4", "bg": "#115E59", "sub_border": "#0F766E", "sub_bg": "#042F2E", "sub_text": "#5EEAD4"},
}

# ============================================================================
# 3. STATUS PILL HTML BUILDER
# ============================================================================

def status_pill(status: str) -> str:
    """Tiny pill in the top-right of each node."""
    m = STATUS_META[status]
    # Use single-letter codes to keep nodes compact: D / IP / P
    code = {"done": "DONE", "progress": "WIP", "planned": "PLAN"}[status]
    return (
        f'<span class="status-pill status-{status}" '
        f'style="background:{m["bg"]};color:{m["text"]};border-color:{m["border"]};">'
        f'<span class="status-dot" style="background:{m["dot"]};"></span>{code}</span>'
    )


def render_leaf(text: str, status: str) -> str:
    return f'<div class="leaf">{text}{status_pill(status)}</div>'


def render_sub_node(label: str, color: str, status: str, leaves: list) -> str:
    """L2 sub-node with its leaf children."""
    cm = COLOR_META[color]
    style = (
        f'background:{cm["sub_bg"]};border-color:{cm["sub_border"]};color:{cm["sub_text"]};'
    )
    leaf_html = "\n".join(
        render_leaf(t, s) if isinstance(x := (t, s), tuple) else render_leaf(x, "planned")
        for t, s in leaves
    )
    return f"""
            <div class="sub-branch">
              <div class="sub-node" style="{style}">{label}{status_pill(status)}</div>
              <div class="children">
                {leaf_html}
              </div>
            </div>"""


def render_branch(branch: dict, side: str) -> str:
    """L1 branch with sub-branches."""
    color = branch["color"]
    cm = COLOR_META[color]
    style = (
        f'background:{cm["bg"]};border-color:{cm["border"]};color:{cm["text"]};'
    )
    children_html = ""
    for child in branch["children"]:
        # child is either dict {label, status, children: [leaf_str or (leaf_str, status)]}
        if isinstance(child, dict):
            label = child["label"]
            st = child.get("status", "planned")
            leaves = []
            for c in child["children"]:
                if isinstance(c, (list, tuple)):
                    leaves.append((c[0], c[1] if len(c) > 1 else "planned"))
                elif isinstance(c, str):
                    leaves.append((c, "planned"))
            children_html += render_sub_node(label, color, st, leaves)
        elif isinstance(child, (list, tuple)):
            # Direct leaf
            children_html += render_leaf(child[0], child[1] if len(child) > 1 else "planned")

    branch_class = "left-branch" if side == "left" else "right-branch"
    return f"""
        <div class="{branch_class}">
          <div class="branch-node" style="{style}">{branch["label"]}{status_pill(branch["status"])}</div>
          <div class="children">
            {children_html}
          </div>
        </div>"""


# ============================================================================
# 4. HTML ASSEMBLY (Bloomberg Dark theme)
# ============================================================================

def build_html() -> str:
    left_html = "\n".join(render_branch(b, "left") for b in LEFT_BRANCHES)
    right_html = "\n".join(render_branch(b, "right") for b in RIGHT_BRANCHES)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI Investment Brain — Knowledge Graph</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    background: #0F172A;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #F1F5F9;
  }}
  body {{ padding: 0; }}

  /* ── Page header ── */
  .page-header {{
    background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
    border-bottom: 1px solid #334155;
    padding: 28px 48px 20px;
  }}
  .page-header h1 {{
    font-size: 22px; font-weight: 700; color: #F1F5F9;
    letter-spacing: -0.01em; margin-bottom: 6px;
  }}
  .page-header h1 .accent {{ color: #FBBF24; }}
  .page-header .subtitle {{
    font-size: 13px; color: #94A3B8; font-weight: 400;
  }}

  /* ── Legend ── */
  .legend {{
    display: flex; gap: 24px; align-items: center;
    padding: 12px 48px;
    background: #1E293B;
    border-bottom: 1px solid #334155;
    font-size: 12px;
  }}
  .legend-item {{ display: flex; align-items: center; gap: 8px; color: #CBD5E1; }}
  .legend-dot {{
    width: 8px; height: 8px; border-radius: 50%;
  }}
  .legend-label {{ font-weight: 500; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 4px; }}

  /* ── Mindmap canvas ── */
  #mindmap {{
    padding: 60px 80px;
    display: inline-block;
    min-width: 100%;
    position: relative;
    background: #0F172A;
  }}
  #mindmap > svg.lines {{
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none; z-index: 0;
  }}

  /* ── Root node ── */
  .root-node {{
    background: linear-gradient(135deg, #1E3A8A 0%, #0F766E 50%, #78350F 100%);
    box-shadow: 0 8px 24px rgba(34, 211, 238, 0.25), 0 0 0 2px rgba(251, 191, 36, 0.4);
    color: #F1F5F9; font-size: 22px; font-weight: 700;
    padding: 22px 36px; border-radius: 14px;
    white-space: nowrap; flex-shrink: 0; align-self: center;
    text-align: center; letter-spacing: -0.01em;
    border: 2px solid #FBBF24;
  }}
  .root-node .root-tag {{
    display: block; font-size: 10px; font-weight: 500;
    color: #FBBF24; letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 6px;
  }}

  /* ── Left-right tree layout ── */
  .lr-tree {{
    display: flex; align-items: center; gap: 0;
    position: relative; z-index: 2;
  }}
  .lr-tree .root-node {{
    margin: 0 70px;
  }}

  .left-branches, .right-branches {{
    display: flex; flex-direction: column; gap: 28px;
  }}

  .left-branch, .right-branch {{
    display: flex; align-items: flex-start; gap: 0;
  }}
  .left-branch {{ flex-direction: row-reverse; }}

  /* ── First-level branch node ── */
  .branch-node {{
    font-size: 15px; font-weight: 700;
    padding: 12px 20px; border-radius: 10px;
    white-space: nowrap; flex-shrink: 0;
    border: 2px solid;
    letter-spacing: -0.01em;
    position: relative;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }}

  /* ── Second-level sub-node ── */
  .sub-branch {{
    display: flex; align-items: flex-start; gap: 0;
  }}
  .left-branch .sub-branch {{ flex-direction: row-reverse; }}

  .sub-node {{
    font-size: 13px; font-weight: 600;
    padding: 8px 16px; border-radius: 8px;
    white-space: nowrap; flex-shrink: 0;
    border: 1.5px solid;
    position: relative;
  }}

  /* ── Leaf node ── */
  .leaf {{
    font-size: 12px; font-weight: 400; color: #CBD5E1;
    padding: 5px 12px; background: #1E293B;
    border-radius: 14px; border: 1px solid #334155;
    white-space: nowrap; line-height: 1.5;
    position: relative;
    display: inline-flex; align-items: center; gap: 8px;
  }}

  /* ── Children containers ── */
  .children {{
    display: flex; flex-direction: column; gap: 7px;
  }}
  .left-branch .children {{
    margin-right: 50px; align-items: flex-end;
  }}
  .right-branch .children {{
    margin-left: 50px; align-items: flex-start;
  }}
  .children:has(.sub-branch) {{ gap: 12px; }}
  .sub-branch .children {{ gap: 5px; }}
  .left-branch .sub-branch .children {{ margin-right: 40px; align-items: flex-end; }}
  .right-branch .sub-branch .children {{ margin-left: 40px; align-items: flex-start; }}

  /* ── Status pill ── */
  .status-pill {{
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    border: 1px solid;
    letter-spacing: 0.04em;
    margin-left: 8px;
    line-height: 1;
    text-transform: uppercase;
    vertical-align: middle;
  }}
  .status-dot {{
    width: 5px; height: 5px; border-radius: 50%;
    box-shadow: 0 0 4px currentColor;
  }}

  /* Status colors */
  .status-done     {{ background: #064E3B; color: #6EE7B7; border-color: #10B981; }}
  .status-progress {{ background: #451A03; color: #FCD34D; border-color: #F59E0B; }}
  .status-planned  {{ background: #1E293B; color: #94A3B8; border-color: #475569; }}

  /* ── Footer ── */
  .page-footer {{
    background: #1E293B;
    border-top: 1px solid #334155;
    padding: 12px 48px;
    font-size: 11px; color: #64748B;
    text-align: center;
    letter-spacing: 0.02em;
  }}
</style>
</head>
<body>

<div class="page-header">
  <h1>AI Investment Brain — <span class="accent">Knowledge Graph</span></h1>
  <div class="subtitle">Complete application & AI agent map · 7 capability clusters · 100+ components · progress-tracked</div>
</div>

<div class="legend">
  <span class="legend-label">Status</span>
  <div class="legend-item"><span class="legend-dot" style="background:#10B981;box-shadow:0 0 6px #10B981;"></span>Done</div>
  <div class="legend-item"><span class="legend-dot" style="background:#F59E0B;box-shadow:0 0 6px #F59E0B;"></span>In Progress</div>
  <div class="legend-item"><span class="legend-dot" style="background:#64748B;"></span>Planned</div>
  <span style="flex:1;"></span>
  <span class="legend-item" style="color:#64748B;">Updated 2026-06-17</span>
</div>

<div id="mindmap" data-intent="finance">
  <div class="lr-tree">

    <!-- ───── LEFT BRANCHES ───── -->
    <div class="left-branches">
      {left_html}
    </div>

    <!-- ───── ROOT ───── -->
    <div class="root-node">
      <span class="root-tag">Self-Maturing Brain</span>
      AI Investment Brain
    </div>

    <!-- ───── RIGHT BRANCHES ───── -->
    <div class="right-branches">
      {right_html}
    </div>

  </div>
</div>

<div class="page-footer">
  AI Investment Brain · Powered by Z.ai · Knowledge Graph · Self-Learning Signal Brain · 5-Persona Advisory Engine
</div>

<script>
/**
 * Universal recursive connector script v4-fix
 * Draws orthogonal polylines from parent → child via a vertical spine.
 */
function drawAllLines() {{
  const map = document.getElementById('mindmap');
  if (!map) {{ console.error('❌ #mindmap not found'); return; }}
  const cRect = map.getBoundingClientRect();

  const old = map.querySelector('svg.lines');
  if (old) old.remove();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('lines');
  svg.setAttribute('width', cRect.width);
  svg.setAttribute('height', cRect.height);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:1;';
  let lineCount = 0;

  function rel(el) {{
    const r = el.getBoundingClientRect();
    return {{
      cx: r.left - cRect.left + r.width/2,
      cy: r.top - cRect.top + r.height/2,
      left: r.left - cRect.left,
      right: r.right - cRect.left,
    }};
  }}

  function drawLine(x1, y1, x2, y2, color, width) {{
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', Math.round(x1)); l.setAttribute('y1', Math.round(y1));
    l.setAttribute('x2', Math.round(x2)); l.setAttribute('y2', Math.round(y2));
    l.setAttribute('stroke', color); l.setAttribute('stroke-width', width);
    l.setAttribute('stroke-linecap', 'round');
    svg.appendChild(l);
    lineCount++;
  }}

  // Dark-theme connector colors (lighter grays so they show on #0F172A)
  const lineStyles = [
    {{ color: '#475569', width: 2.5 }},  // root → L1
    {{ color: '#3F4F63', width: 2 }},    // L1 → L2
    {{ color: '#334155', width: 1.5 }},  // L2 → L3
    {{ color: '#2A3645', width: 1.2 }},  // L3 → L4
  ];
  function getLineStyle(depth) {{
    const s = lineStyles[Math.min(depth, lineStyles.length - 1)];
    return {{ color: s.color, width: s.width }};
  }}

  function connect(parentEl, childEls, color, width, dir) {{
    if (!childEls.length) return;
    const p = rel(parentEl);
    const startX = dir === 'left' ? p.left : p.right;
    const startY = p.cy;

    if (childEls.length === 1) {{
      const c = rel(childEls[0]);
      const endX = dir === 'left' ? c.right : c.left;
      const midY = Math.round((startY + c.cy) / 2);
      drawLine(startX, midY, endX, midY, color, width);
      return;
    }}

    let closestEdge;
    if (dir === 'left') {{
      closestEdge = Math.max(...childEls.map(ch => rel(ch).right));
    }} else {{
      closestEdge = Math.min(...childEls.map(ch => rel(ch).left));
    }}
    const childClearance = 16;
    const midpoint = startX + (closestEdge - startX) / 2;
    const midFromChild = dir === 'left' ? closestEdge + childClearance : closestEdge - childClearance;
    const midX = dir === 'left'
      ? Math.min(midpoint, midFromChild)
      : Math.max(midpoint, midFromChild);

    drawLine(startX, startY, midX, startY, color, width);

    const allCYs = childEls.map(ch => rel(ch).cy);
    const minY = Math.min(startY, ...allCYs);
    const maxY = Math.max(startY, ...allCYs);
    drawLine(midX, minY, midX, maxY, color, width);

    childEls.forEach(ch => {{
      const c = rel(ch);
      const endX = dir === 'left' ? c.right : c.left;
      const endY = c.cy;
      drawLine(midX, endY, endX, endY, color, width);
    }});
  }}

  const NODE_SEL = '.branch-node, .sub-node, .leaf, .deep-node';
  const CONTAINER_SEL = ':scope > .children, :scope > .leaf-group, :scope > .deep-group';

  function processChildren(parentNodeEl, containerEl, depth, dir) {{
    if (!containerEl) return;
    const childNodeEls = [];
    for (const wrapper of containerEl.children) {{
      const nodeEl = wrapper.matches?.(NODE_SEL) ? wrapper : wrapper.querySelector(NODE_SEL);
      if (nodeEl) childNodeEls.push(nodeEl);
    }}
    if (!childNodeEls.length) return;
    const style = getLineStyle(depth);
    connect(parentNodeEl, childNodeEls, style.color, style.width, dir);

    for (const wrapper of containerEl.children) {{
      const nodeEl = wrapper.matches?.(NODE_SEL) ? wrapper : wrapper.querySelector(NODE_SEL);
      if (!nodeEl) continue;
      wrapper.querySelectorAll(CONTAINER_SEL).forEach(nc =>
        processChildren(nodeEl, nc, depth + 1, dir)
      );
    }}
  }}

  // Root
  const rootNode = map.querySelector('.root-node');
  if (!rootNode) {{ console.error('❌ .root-node not found'); return; }}

  // Left L1 branches
  const leftBranches = map.querySelectorAll('.left-branches > .left-branch');
  const leftBranchNodes = [];
  leftBranches.forEach(b => {{
    const bn = b.querySelector('.branch-node');
    if (bn) leftBranchNodes.push(bn);
  }});
  if (leftBranchNodes.length) {{
    connect(rootNode, leftBranchNodes, lineStyles[0].color, lineStyles[0].width, 'left');
  }}
  leftBranches.forEach(b => {{
    const bn = b.querySelector('.branch-node');
    if (!bn) return;
    processChildren(bn, b.querySelector(':scope > .children'), 1, 'left');
  }});

  // Right L1 branches
  const rightBranches = map.querySelectorAll('.right-branches > .right-branch');
  const rightBranchNodes = [];
  rightBranches.forEach(b => {{
    const bn = b.querySelector('.branch-node');
    if (bn) rightBranchNodes.push(bn);
  }});
  if (rightBranchNodes.length) {{
    connect(rootNode, rightBranchNodes, lineStyles[0].color, lineStyles[0].width, 'right');
  }}
  rightBranches.forEach(b => {{
    const bn = b.querySelector('.branch-node');
    if (!bn) return;
    processChildren(bn, b.querySelector(':scope > .children'), 1, 'right');
  }});

  map.insertBefore(svg, map.firstChild);
  console.log(`✅ Drew ${{lineCount}} lines`);
}}

window.addEventListener('load', () => setTimeout(drawAllLines, 400));
</script>
</body>
</html>"""


# ============================================================================
# 5. MERMAID CODE BUILDER
# ============================================================================

STATUS_ICON = {"done": "✅", "progress": "🟡", "planned": "⚪"}

def mermaid_escape(s: str) -> str:
    # Mermaid mindmap node text cannot contain certain chars
    return s.replace('"', "'").replace("(", "&#40;").replace(")", "&#41;")


def build_mermaid() -> str:
    lines = ["mindmap"]
    lines.append(f'  root(("AI Investment Brain"))')

    def render_node(label: str, status: str, indent: int):
        icon = STATUS_ICON[status]
        lines.append(f'{"  " * indent}{icon} {mermaid_escape(label)}')

    def render_branch(branch: dict, indent: int):
        render_node(branch["label"], branch["status"], indent)
        for child in branch["children"]:
            if isinstance(child, dict):
                render_node(child["label"], child.get("status", "planned"), indent + 1)
                for c in child["children"]:
                    if isinstance(c, (list, tuple)):
                        render_node(c[0], c[1] if len(c) > 1 else "planned", indent + 2)
                    elif isinstance(c, str):
                        render_node(c, "planned", indent + 2)
            elif isinstance(child, (list, tuple)):
                render_node(child[0], child[1] if len(child) > 1 else "planned", indent + 1)

    # Left branches first, then right
    for b in LEFT_BRANCHES + RIGHT_BRANCHES:
        render_branch(b, 1)

    return "\n".join(lines) + "\n"


# ============================================================================
# 6. RENDER + SCREENSHOT
# ============================================================================

async def screenshot_html_to_png(html_path: Path, png_path: Path):
    """Use Playwright to render HTML at high resolution."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={"width": 2400, "height": 1800},
            device_scale_factor=2,
        )
        await page.goto(f"file://{html_path}", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Expand viewport to fit content
        body_bbox = await page.evaluate("""() => {
            const b = document.body;
            return { width: b.scrollWidth, height: b.scrollHeight };
        }""")
        new_w = max(2400, int(body_bbox["width"]) + 40)
        new_h = int(body_bbox["height"]) + 40
        await page.set_viewport_size({"width": new_w, "height": new_h})
        await page.wait_for_timeout(400)

        # Redraw connectors at new viewport
        await page.evaluate("if(typeof drawAllLines==='function') drawAllLines()")
        await page.wait_for_timeout(400)

        await page.screenshot(path=str(png_path), full_page=True)
        await browser.close()

    print(f"✅ PNG saved: {png_path} ({png_path.stat().st_size / 1024:.0f} KB)")


# ============================================================================
# 7. MAIN
# ============================================================================

def main():
    out_dir = Path("/home/z/my-project/download")
    out_dir.mkdir(parents=True, exist_ok=True)

    html_path = out_dir / "ai_brain_mindmap.html"
    png_path = out_dir / "ai_brain_mindmap.png"
    mmd_path = out_dir / "ai_brain_mindmap.mmd"

    # 1. Write HTML
    html_content = build_html()
    html_path.write_text(html_content, encoding="utf-8")
    print(f"✅ HTML saved: {html_path} ({len(html_content) / 1024:.0f} KB)")

    # 2. Write Mermaid
    mmd_content = build_mermaid()
    mmd_path.write_text(mmd_content, encoding="utf-8")
    print(f"✅ Mermaid saved: {mmd_path} ({len(mmd_content) / 1024:.0f} KB)")

    # 3. Render PNG via Playwright
    import asyncio
    asyncio.run(screenshot_html_to_png(html_path, png_path))

    # Summary
    total_nodes = 1  # root
    for b in LEFT_BRANCHES + RIGHT_BRANCHES:
        total_nodes += 1  # branch
        for c in b["children"]:
            if isinstance(c, dict):
                total_nodes += 1  # sub-node
                total_nodes += len(c["children"])  # leaves
            else:
                total_nodes += 1  # direct leaf
    print(f"\n📊 Total nodes: {total_nodes}")
    print(f"📊 Left branches: {len(LEFT_BRANCHES)}")
    print(f"📊 Right branches: {len(RIGHT_BRANCHES)}")
    print(f"\n📁 Deliverables in: {out_dir}")


if __name__ == "__main__":
    main()
