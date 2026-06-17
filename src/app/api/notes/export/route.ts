import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/notes/export?format=md|json
// We don't have JSZip — produce a concatenated markdown bundle with
// explicit note separators (=== NOTE === / === END ===) so it can be
// re-imported. Users can also use format=json for a structured export.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "md";
  const notes = await db.note.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  if (format === "json") {
    return NextResponse.json({
      notes: notes.map((n) => ({
        title: n.title,
        content: n.content,
        tags: JSON.parse(n.tags || "[]"),
        pinned: n.pinned,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : n.updatedAt,
      })),
    });
  }

  // Markdown bundle
  const body = notes
    .map((n) => {
      const tags = JSON.parse(n.tags || "[]") as string[];
      const fm = [
        "---",
        `title: ${JSON.stringify(n.title)}`,
        `tags: [${tags.join(", ")}]`,
        `pinned: ${n.pinned}`,
        `createdAt: ${n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt}`,
        "---",
      ].join("\n");
      return `=== NOTE ===\n${fm}\n\n${n.content}\n\n=== END ===`;
    })
    .join("\n\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="notes-export.md"',
    },
  });
}
