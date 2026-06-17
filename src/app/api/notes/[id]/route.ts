import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractMeta, toDTO } from "@/lib/notes";
import { parseFrontmatter } from "@/components/notes/daily-notes";

export const runtime = "nodejs";

const MAX_VERSIONS = 20;
const VERSION_DIFF_THRESHOLD = 50; // chars

// GET /api/notes/[id] — get one note + backlinks (notes linking TO this one)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = await db.note.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  // Backlinks: any note whose `links` JSON array contains this note's title
  const candidates = await db.note.findMany({
    where: { id: { not: id } },
    select: { id: true, title: true, content: true, tags: true, tickerRefs: true, links: true, pinned: true, createdAt: true, updatedAt: true },
  });
  const title = note.title.toLowerCase();
  const backlinks = candidates
    .filter((c) => {
      try {
        const arr: string[] = JSON.parse(c.links || "[]");
        return arr.some((l) => l.trim().toLowerCase() === title);
      } catch {
        return false;
      }
    })
    .map((c) => toDTO({ ...c } as never));

  return NextResponse.json({ note: toDTO(note), backlinks });
}

// PATCH /api/notes/[id] — update title/content/tags/pinned
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { title?: string; content?: string; tags?: string[]; pinned?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await db.note.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const title = body.title !== undefined ? (body.title.trim() || "Untitled") : existing.title;
  const content = body.content !== undefined ? body.content : existing.content;

  // Re-extract metadata from the new content
  const meta = extractMeta(content);
  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      const norm = String(t).trim();
      if (norm && !meta.tags.includes(norm.toLowerCase())) {
        meta.tags.push(norm.toLowerCase());
      }
    }
  }

  // Parse frontmatter for date field (used by daily notes)
  const { fm } = parseFrontmatter(content);
  const dateField = fm.date !== undefined ? fm.date : existing.date;

  // Versioning: if content changed significantly, save the previous version
  if (body.content !== undefined && Math.abs(body.content.length - existing.content.length) > VERSION_DIFF_THRESHOLD) {
    try {
      await db.noteVersion.create({
        data: {
          noteId: id,
          content: existing.content,
          title: existing.title,
        },
      });
      // Prune: keep only the last MAX_VERSIONS
      const all = await db.noteVersion.findMany({
        where: { noteId: id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (all.length > MAX_VERSIONS) {
        const toDelete = all.slice(MAX_VERSIONS).map((v) => v.id);
        await db.noteVersion.deleteMany({ where: { id: { in: toDelete } } });
      }
    } catch {
      // versioning is best-effort
    }
  }

  const updated = await db.note.update({
    where: { id },
    data: {
      title,
      content,
      tags: JSON.stringify(meta.tags),
      tickerRefs: JSON.stringify(meta.tickerRefs),
      links: JSON.stringify(meta.links),
      pinned: body.pinned !== undefined ? !!body.pinned : existing.pinned,
      date: dateField,
    },
  });

  return NextResponse.json({ note: toDTO(updated) });
}

// DELETE /api/notes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
}
