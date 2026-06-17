import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, isStubMode } from "@/lib/email";
import { generateEmailBody } from "@/lib/email-research";
import { initSchedulerOnce } from "@/lib/scheduler-init";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/email/send-now — generate + send (or preview) immediately
export async function POST(req: NextRequest) {
  initSchedulerOnce();
  let body: {
    template?: string;
    recipient?: string;
    ticker?: string;
    portfolioJson?: string;
    preview?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const template = (body.template ?? "custom").trim();
  const recipient = (body.recipient ?? "").trim();
  const preview = !!body.preview;

  if (!recipient) {
    return NextResponse.json({ error: "recipient is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return NextResponse.json({ error: "recipient is not a valid email" }, { status: 400 });
  }

  try {
    const { subject, body: html } = await generateEmailBody(template, {
      ticker: body.ticker,
      portfolioJson: body.portfolioJson,
    });

    if (preview) {
      return NextResponse.json({
        preview: true,
        subject,
        body: html,
        recipient,
        template,
        stubMode: isStubMode(),
      });
    }

    const result = await sendEmail({ to: recipient, subject, html });
    const log = await db.emailLog.create({
      data: {
        recipient,
        subject,
        body: html,
        status: result.stub ? "stub-logged" : "sent",
        error: null,
      },
    });
    return NextResponse.json({
      preview: false,
      subject,
      body: html,
      recipient,
      template,
      messageId: result.messageId,
      stub: !!result.stub,
      logId: log.id,
      stubMode: isStubMode(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
