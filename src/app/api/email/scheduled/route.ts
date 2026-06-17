import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCron, getNextRunAt } from "@/lib/scheduler";
import { initSchedulerOnce } from "@/lib/scheduler-init";

export const runtime = "nodejs";

// GET /api/email/scheduled — list all
export async function GET() {
  // Ensure scheduler is running whenever someone visits the API.
  initSchedulerOnce();
  const emails = await db.scheduledEmail.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ scheduledEmails: emails });
}

// POST /api/email/scheduled — create new
export async function POST(req: NextRequest) {
  initSchedulerOnce();
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

  const name = (body.name ?? "").trim();
  const recipient = (body.recipient ?? "").trim();
  const template = (body.template ?? "custom").trim();
  const cronExpr = (body.cronExpr ?? "0 8 * * *").trim();

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!recipient) return NextResponse.json({ error: "recipient is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
    return NextResponse.json({ error: "recipient is not a valid email" }, { status: 400 });
  if (!validateCron(cronExpr))
    return NextResponse.json({ error: `Invalid cron expression: ${cronExpr}` }, { status: 400 });

  const nextRunAt = getNextRunAt(cronExpr);
  const subject = body.subject?.trim() || `${name} (auto)`;

  const created = await db.scheduledEmail.create({
    data: {
      name,
      recipient,
      subject,
      template,
      cronExpr,
      ticker: body.ticker || null,
      portfolioJson: body.portfolioJson || null,
      enabled: body.enabled !== false,
      nextRunAt,
      lastStatus: "pending",
    },
  });

  return NextResponse.json({ scheduledEmail: created });
}
