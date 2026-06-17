import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCron, getNextRunAt } from "@/lib/scheduler";
import { initSchedulerOnce } from "@/lib/scheduler-init";

export const runtime = "nodejs";

// PATCH /api/email/scheduled/[id] — update fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  initSchedulerOnce();
  const { id } = await params;
  let body: {
    name?: string;
    recipient?: string;
    subject?: string;
    template?: string;
    cronExpr?: string;
    ticker?: string;
    portfolioJson?: string;
    enabled?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await db.scheduledEmail.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cronExpr = body.cronExpr ?? existing.cronExpr;
  if (body.cronExpr !== undefined && !validateCron(cronExpr)) {
    return NextResponse.json({ error: `Invalid cron: ${cronExpr}` }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.recipient !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.recipient)) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }
    data.recipient = body.recipient;
  }
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.template !== undefined) data.template = body.template;
  if (body.cronExpr !== undefined) {
    data.cronExpr = body.cronExpr;
    data.nextRunAt = getNextRunAt(cronExpr);
  }
  if (body.ticker !== undefined) data.ticker = body.ticker || null;
  if (body.portfolioJson !== undefined) data.portfolioJson = body.portfolioJson || null;
  if (body.enabled !== undefined) data.enabled = !!body.enabled;

  const updated = await db.scheduledEmail.update({ where: { id }, data });
  return NextResponse.json({ scheduledEmail: updated });
}

// DELETE /api/email/scheduled/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.scheduledEmail.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
