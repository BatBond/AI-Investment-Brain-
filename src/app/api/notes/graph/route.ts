import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/notes/graph — graph data: { nodes, links }
export async function GET() {
  const notes = await db.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  // Parse links for each note and collect edges + node sizes
  const titles = new Map<string, string>(); // lowercase title -> id
  for (const n of notes) {
    titles.set(n.title.toLowerCase(), n.id);
  }

  const nodes: { id: string; title: string; tags: string[]; pinned: boolean; linkCount: number }[] = [];
  const links: { source: string; target: string }[] = [];
  const linkCountById = new Map<string, number>();

  for (const n of notes) {
    let tags: string[] = [];
    let linkTargets: string[] = [];
    try { tags = JSON.parse(n.tags || "[]"); } catch { /* ignore */ }
    try { linkTargets = JSON.parse(n.links || "[]"); } catch { /* ignore */ }

    let count = 0;
    for (const target of linkTargets) {
      const targetId = titles.get(target.trim().toLowerCase());
      if (targetId && targetId !== n.id) {
        links.push({ source: n.id, target: targetId });
        count++;
        linkCountById.set(targetId, (linkCountById.get(targetId) ?? 0) + 1);
      }
    }
    linkCountById.set(n.id, (linkCountById.get(n.id) ?? 0) + count);

    nodes.push({
      id: n.id,
      title: n.title,
      tags,
      pinned: n.pinned,
      linkCount: 0,
    });
  }

  // Fill linkCount for each node = both incoming + outgoing
  for (const node of nodes) {
    node.linkCount = linkCountById.get(node.id) ?? 0;
  }

  const totalLinks = links.length;
  const totalNodes = nodes.length;
  const orphanCount = nodes.filter((n) => n.linkCount === 0).length;

  return NextResponse.json({
    nodes,
    links,
    stats: {
      totalNodes,
      totalLinks,
      avgLinksPerNote: totalNodes ? (totalLinks / totalNodes).toFixed(2) : "0",
      orphanCount,
    },
  });
}
