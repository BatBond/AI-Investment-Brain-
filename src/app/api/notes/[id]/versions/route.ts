import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/notes/[id]/versions — list all versions of a note (newest first)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const versions = await db.noteVersion.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      noteId: v.noteId,
      title: v.title,
      content: v.content,
      createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
    })),
  });
}
