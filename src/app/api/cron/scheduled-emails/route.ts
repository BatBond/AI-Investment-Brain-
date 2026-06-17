/**
 * Vercel Cron: Process scheduled emails
 *
 * Vercel Cron invokes this endpoint every minute (see vercel.json).
 * Replaces the in-process node-cron scheduler (which doesn't work on serverless).
 *
 * Security: validates CRON_SECRET env var to prevent unauthorized invocation.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateEmailBody } from "@/lib/email-research";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically; also accept CRON_SECRET for manual triggers
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const due = await db.scheduledEmail.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: now },
      },
      take: 10, // Process at most 10 per invocation to stay within 60s limit
    });

    for (const email of due) {
      processed++;
      try {
        // Generate the email body via LLM
        const { subject, body } = await generateEmailBody(email.template, {
          ticker: email.ticker ?? undefined,
          portfolioJson: email.portfolioJson ?? undefined,
        });

        // Send (or stub-log if no SMTP configured)
        await sendEmail({
          to: email.recipient,
          subject: subject,
          html: body,
        });

        // Log it
        await db.emailLog.create({
          data: {
            scheduledEmailId: email.id,
            recipient: email.recipient,
            subject,
            body,
            status: "sent",
          },
        });

        // Compute next run time from cron expression
        const nextRunAt = computeNextRun(email.cronExpr, now);

        await db.scheduledEmail.update({
          where: { id: email.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            lastStatus: "success",
            lastError: null,
          },
        });

        succeeded++;
      } catch (e: any) {
        const errMsg = e instanceof Error ? e.message : String(e);
        errors.push(`${email.name}: ${errMsg}`);

        // Still update lastRunAt + nextRunAt so we don't retry immediately
        const nextRunAt = computeNextRun(email.cronExpr, now);
        await db.scheduledEmail.update({
          where: { id: email.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            lastStatus: "error",
            lastError: errMsg.slice(0, 500),
          },
        });

        // Log failure
        await db.emailLog.create({
          data: {
            scheduledEmailId: email.id,
            recipient: email.recipient,
            subject: email.subject || email.template,
            body: "",
            status: "failed",
            error: errMsg,
          },
        });

        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      processed,
      succeeded,
      failed,
      errors: errors.slice(0, 5),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message, timestamp: now.toISOString() },
      { status: 500 }
    );
  }
}

/**
 * Compute the next run time from a cron expression.
 * Simple parser supporting standard 5-field cron: minute hour day month dayOfWeek
 * For simplicity, finds the next matching minute in the next 7 days.
 */
function computeNextRun(cronExpr: string, from: Date): Date {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      // Fallback: 1 hour from now
      return new Date(from.getTime() + 60 * 60 * 1000);
    }
    const [minField, hourField, dayField, monthField, dowField] = parts;

    // Parse fields (supports *, single values, lists, ranges, step values)
    const parse = (field: string, min: number, max: number): number[] => {
      if (field === "*") return Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const values: number[] = [];
      for (const part of field.split(",")) {
        if (part.includes("/")) {
          const [range, stepStr] = part.split("/");
          const step = parseInt(stepStr);
          const [start, end] = range === "*" ? [min, max] : range.includes("-") ? range.split("-").map(Number) : [parseInt(range), max];
          for (let i = start; i <= end; i += step) values.push(i);
        } else if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          for (let i = start; i <= end; i++) values.push(i);
        } else {
          values.push(parseInt(part));
        }
      }
      return [...new Set(values)].filter(v => v >= min && v <= max).sort((a, b) => a - b);
    };

    const minutes = parse(minField, 0, 59);
    const hours = parse(hourField, 0, 23);
    const days = parse(dayField, 1, 31);
    const months = parse(monthField, 1, 12);
    const dows = parse(dowField, 0, 6);

    // Find next matching time in the next 7 days
    const candidate = new Date(from);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    for (let i = 0; i < 7 * 24 * 60; i++) { // 7 days of minutes
      if (
        minutes.includes(candidate.getMinutes()) &&
        hours.includes(candidate.getHours()) &&
        days.includes(candidate.getDate()) &&
        months.includes(candidate.getMonth() + 1) &&
        dows.includes(candidate.getDay())
      ) {
        return candidate;
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    // Fallback: 1 day from now
    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  } catch {
    return new Date(from.getTime() + 60 * 60 * 1000);
  }
}
