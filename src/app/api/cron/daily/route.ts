/**
 * Vercel Daily Cron (Hobby-tier compatible)
 * ------------------------------------------
 * Vercel Hobby only allows ONE cron job, running at most once per day.
 * This single endpoint consolidates all scheduled work:
 *
 *   1. Process all due scheduled emails (catches up on any missed runs)
 *   2. Run market sentiment scan (Yahoo + Google + Reddit + Twitter)
 *   3. Rotate through portfolio tickers for sentiment scoring
 *
 * Schedule: 0 13 * * *  (1 PM UTC = 8 AM ET / 9 AM ET during DST)
 * This timing aligns with US pre-market hours, perfect for morning briefs
 * and daily top-20 stock emails.
 *
 * The /api/cron/scheduled-emails and /api/cron/sentiment-scan endpoints
 * still exist and can be invoked manually (e.g., from the UI's "Run Now"
 * button, or from an external scheduler like UptimeRobot / cron-job.org
 * if higher frequency is needed).
 *
 * Security: validates CRON_SECRET env var to prevent unauthorized invocation.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateEmailBody } from "@/lib/email-research";
import { sendEmail } from "@/lib/email";
import { scanSentiment } from "@/lib/sentiment-sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const startedAt = new Date();
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron auto-sends Authorization: Bearer <CRON_SECRET>
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    emails: { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] },
    sentiment: { market: 0, portfolioScanned: "", portfolioArticles: 0, error: "" },
    timing: { startedAt: startedAt.toISOString(), finishedAt: "", durationMs: 0 },
  };

  // ─── 1. Process all due scheduled emails ───────────────────────────────
  //
  // On Hobby tier, this cron runs once per day, but users may have multiple
  // scheduled emails configured (morning brief, daily top-20, weekly portfolio
  // review, etc.). We process all of them now — even if their individual cron
  // schedule says they should have run earlier today, this catches them up.
  //
  // For emails marked "enabled" that have a nextRunAt <= now, we:
  //   - Generate body via LLM
  //   - Send via SMTP (or stub-log)
  //   - Update lastRunAt + lastStatus
  //   - Set nextRunAt to the next occurrence of their cron schedule
  try {
    const due = await db.scheduledEmail.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: startedAt },
      },
      take: 5, // Cap at 5 to stay within 60s function timeout
    });

    for (const email of due) {
      results.emails.processed++;
      try {
        const { subject, body } = await generateEmailBody(email.template, {
          ticker: email.ticker ?? undefined,
          portfolioJson: email.portfolioJson ?? undefined,
        });

        await sendEmail({
          to: email.recipient,
          subject: subject,
          html: body,
        });

        await db.emailLog.create({
          data: {
            scheduledEmailId: email.id,
            recipient: email.recipient,
            subject,
            body,
            status: "sent",
          },
        });

        const nextRunAt = computeNextRun(email.cronExpr, startedAt);
        await db.scheduledEmail.update({
          where: { id: email.id },
          data: {
            lastRunAt: startedAt,
            nextRunAt,
            lastStatus: "success",
            lastError: null,
          },
        });

        results.emails.succeeded++;
      } catch (e: any) {
        const errMsg = e instanceof Error ? e.message : String(e);
        results.emails.errors.push(`${email.name}: ${errMsg.slice(0, 200)}`);
        results.emails.failed++;

        const nextRunAt = computeNextRun(email.cronExpr, startedAt);
        await db.scheduledEmail.update({
          where: { id: email.id },
          data: {
            lastRunAt: startedAt,
            nextRunAt,
            lastStatus: "error",
            lastError: errMsg.slice(0, 500),
          },
        });

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
      }
    }
  } catch (e: any) {
    results.emails.errors.push(`FATAL: ${e.message}`);
  }

  // ─── 2. Market sentiment scan ──────────────────────────────────────────
  try {
    const articles = await scanSentiment("MARKET");
    results.sentiment.market = articles.length;
  } catch (e: any) {
    results.sentiment.error = `market: ${e.message}`;
  }

  // ─── 3. Rotate through one portfolio ticker ────────────────────────────
  // Picks one random holding per invocation so all holdings get scanned
  // over time (every ~N days where N = portfolio size).
  try {
    const positions = await db.portfolioPosition.findMany({ take: 50 });
    if (positions.length > 0) {
      const idx = Math.floor(Math.random() * positions.length);
      const ticker = positions[idx].symbol;
      const articles = await scanSentiment(ticker);
      results.sentiment.portfolioScanned = ticker;
      results.sentiment.portfolioArticles = articles.length;
    }
  } catch (e: any) {
    results.sentiment.error = `${results.sentiment.error}; portfolio: ${e.message}`.trim();
  }

  const finishedAt = new Date();
  results.timing.finishedAt = finishedAt.toISOString();
  results.timing.durationMs = finishedAt.getTime() - startedAt.getTime();

  return NextResponse.json({
    ok: true,
    ...results,
  });
}

/**
 * Compute next run time from a 5-field cron expression.
 * Scans minute-by-minute up to 7 days ahead to find next match.
 */
function computeNextRun(cronExpr: string, from: Date): Date {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return new Date(from.getTime() + 24 * 60 * 60 * 1000); // fallback: +1 day
    }
    const [minField, hourField, dayField, monthField, dowField] = parts;

    const parse = (field: string, min: number, max: number): number[] => {
      if (field === "*") return Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const values: number[] = [];
      for (const part of field.split(",")) {
        if (part.includes("/")) {
          const [range, stepStr] = part.split("/");
          const step = parseInt(stepStr);
          const [start, end] = range === "*"
            ? [min, max]
            : range.includes("-") ? range.split("-").map(Number) : [parseInt(range), max];
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

    const candidate = new Date(from);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    for (let i = 0; i < 7 * 24 * 60; i++) {
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

    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  } catch {
    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  }
}
