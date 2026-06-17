import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractMeta } from "@/lib/notes";

export const runtime = "nodejs";

// POST /api/notes/import
// Body: { notes: [{ title, content, pinned? }] }  OR raw markdown text
// with `=== NOTE ===` / `=== END ===` separators.
// Returns count of created notes.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let incoming: { title: string; content: string; pinned?: boolean }[] = [];

  if (body && typeof body === "object" && "notes" in body && Array.isArray((body as { notes: unknown }).notes)) {
    incoming = (body as { notes: unknown[] }).notes
      .filter((n): n is { title: string; content: string; pinned?: boolean } => {
        return (
          typeof n === "object" &&
          n !== null &&
          "title" in n &&
          typeof (n as { title: unknown }).title === "string" &&
          "content" in n &&
          typeof (n as { content: unknown }).content === "string"
        );
      })
      .map((n) => ({
        title: n.title,
        content: n.content,
        pinned: n.pinned ?? false,
      }));
  } else if (body && typeof body === "object" && "markdown" in body && typeof (body as { markdown: unknown }).markdown === "string") {
    // Parse the markdown bundle format
    const md = (body as { markdown: string }).markdown;
    const blocks = md.split(/=== NOTE ===/).slice(1);
    for (const block of blocks) {
      const endIdx = block.indexOf("=== END ===");
      const content = (endIdx >= 0 ? block.slice(0, endIdx) : block).trim();
      // Try to extract frontmatter
      const fmMatch = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(content);
      let title = "Imported note";
      let bodyContent = content;
      let pinned = false;
      if (fmMatch) {
        const yaml = fmMatch[1];
        bodyContent = fmMatch[2] || "";
        for (const line of yaml.split("\n")) {
          const mm = /^(title|pinned):\s*(.*)$/.exec(line.trim());
          if (mm) {
            if (mm[1] === "title") {
              try {
                title = JSON.parse(mm[2]);
              } catch {
                title = mm[2];
              }
            } else if (mm[1] === "pinned") {
              pinned = mm[2] === "true";
            }
          }
        }
      } else {
        // Try to extract title from first markdown heading
        const headingMatch = /^#\s+(.+)$/m.exec(content);
        if (headingMatch) title = headingMatch[1].trim();
      }
      incoming.push({ title, content: bodyContent, pinned });
    }
  } else {
    return NextResponse.json({ error: "Expected { notes: [...] } or { markdown: '...' }" }, { status: 400 });
  }

  if (incoming.length === 0) {
    return NextResponse.json({ error: "No notes to import" }, { status: 400 });
  }

  let created = 0;
  for (const n of incoming) {
    try {
      const meta = extractMeta(n.content);
      await db.note.create({
        data: {
          title: n.title.trim() || "Untitled",
          content: n.content,
          tags: JSON.stringify(meta.tags),
          tickerRefs: JSON.stringify(meta.tickerRefs),
          links: JSON.stringify(meta.links),
          pinned: !!n.pinned,
        },
      });
      created++;
    } catch {
      // skip on error
    }
  }

  return NextResponse.json({ created, total: incoming.length });
}
