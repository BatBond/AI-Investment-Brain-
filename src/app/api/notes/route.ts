import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractMeta, toDTO } from "@/lib/notes";

export const runtime = "nodejs";

// GET /api/notes — list all (optional ?tag=X or ?q=search)
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");

  const notes = await db.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  let filtered = notes;
  if (tag) {
    filtered = filtered.filter((n) => {
      try {
        const tags: string[] = JSON.parse(n.tags || "[]");
        return tags.includes(tag.toLowerCase());
      } catch {
        return false;
      }
    });
  }
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(needle) ||
        n.content.toLowerCase().includes(needle)
    );
  }

  return NextResponse.json({ notes: filtered.map(toDTO) });
}

// POST /api/notes — create new note
export async function POST(req: NextRequest) {
  let body: { title?: string; content?: string; tags?: string[]; pinned?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = (body.title ?? "").trim() || "Untitled";
  const content = body.content ?? "";

  const meta = extractMeta(content);
  // Merge any explicit user-supplied tags
  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      const norm = String(t).trim();
      if (norm && !meta.tags.includes(norm.toLowerCase())) {
        meta.tags.push(norm.toLowerCase());
      }
    }
  }

  const created = await db.note.create({
    data: {
      title,
      content,
      tags: JSON.stringify(meta.tags),
      tickerRefs: JSON.stringify(meta.tickerRefs),
      links: JSON.stringify(meta.links),
      pinned: !!body.pinned,
    },
  });

  return NextResponse.json({ note: toDTO(created) });
}
