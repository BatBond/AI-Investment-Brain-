/**
 * Email scheduler.
 * ---------------------------------------------------------------
 * Uses `node-cron` to validate cron expressions and compute next runs.
 * The scheduler tick runs every minute and picks up any due emails.
 *
 * A singleton global flag prevents duplicate schedulers when Next.js
 * dev server hot-reloads.
 */

import cron from "node-cron";
import { db } from "./db";
import { sendEmail, isStubMode } from "./email";
import { generateEmailBody } from "./email-research";
import { scanSentiment } from "./sentiment-sources";

const SCHEDULER_TICK_CRON = "* * * * *"; // every minute
const SENTIMENT_MARKET_CRON = "*/30 * * * *"; // every 30 min — market-wide scan
const SENTIMENT_HOLDINGS_CRON = "0 */2 * * *"; // every 2 hours — per-holding scan

interface GlobalWithScheduler {
  __aibSchedulerStarted?: boolean;
  __aibSchedulerTask?: cron.ScheduledTask;
  __aibSentimentMarketTask?: cron.ScheduledTask;
  __aibSentimentHoldingsTask?: cron.ScheduledTask;
  __aibLastSentimentScan?: number;
}

const g = globalThis as unknown as GlobalWithScheduler;

export function validateCron(expr: string): boolean {
  try {
    return cron.validate(expr);
  } catch {
    return false;
  }
}

export function getNextRunAt(expr: string, from: Date = new Date()): Date | null {
  if (!validateCron(expr)) return null;
  // node-cron doesn't expose "next run" directly — use a small heuristic.
  // We schedule a one-off task with a custom tick handler that captures
  // the next fire time via cron-parser-style computation.
  // Simpler: brute-force walk forward minute by minute for up to ~7 days.
  const fields = parseCronFields(expr);
  if (!fields) return null;
  const d = new Date(from.getTime() + 60_000);
  d.setSeconds(0, 0);
  for (let i = 0; i < 7 * 24 * 60; i++) {
    if (matchesCron(d, fields)) return d;
    d.setMinutes(d.getMinutes() + 1);
  }
  return null;
}

interface CronFields {
  minute: number[] | null; // null = *
  hour: number[] | null;
  dom: number[] | null;
  month: number[] | null;
  dow: number[] | null;
}

function parseCronFields(expr: string): CronFields | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  function parseField(f: string, min: number, max: number): number[] | null {
    if (f === "*") return null;
    const out = new Set<number>();
    for (const part of f.split(",")) {
      const stepMatch = part.match(/^(.*)\/(\d+)$/);
      let range = part;
      let step = 1;
      if (stepMatch) {
        range = stepMatch[1];
        step = parseInt(stepMatch[2], 10);
        if (isNaN(step) || step < 1) return null;
      }
      let lo = min;
      let hi = max;
      if (range !== "*") {
        if (range.includes("-")) {
          const [a, b] = range.split("-");
          lo = parseInt(a, 10);
          hi = parseInt(b, 10);
          if (isNaN(lo) || isNaN(hi)) return null;
        } else {
          lo = parseInt(range, 10);
          if (isNaN(lo)) return null;
          hi = lo;
        }
      }
      for (let v = lo; v <= hi; v += step) out.add(v);
    }
    return Array.from(out);
  }
  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dom: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dow: parseField(parts[4], 0, 6),
  };
}

function matchesCron(d: Date, f: CronFields): boolean {
  if (f.minute !== null && !f.minute.includes(d.getMinutes())) return false;
  if (f.hour !== null && !f.hour.includes(d.getHours())) return false;
  if (f.dom !== null && !f.dom.includes(d.getDate())) return false;
  if (f.month !== null && !f.month.includes(d.getMonth() + 1)) return false;
  // JS getDay: 0=Sunday..6=Saturday — matches cron convention
  if (f.dow !== null && !f.dow.includes(d.getDay())) return false;
  return true;
}

async function tick() {
  try {
    const now = new Date();
    const due = await db.scheduledEmail.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: now },
      },
    });

    for (const email of due) {
      try {
        const { subject, body } = await generateEmailBody(email.template, {
          ticker: email.ticker || undefined,
          portfolioJson: email.portfolioJson || undefined,
        });
        const result = await sendEmail({
          to: email.recipient,
          subject: subject || email.subject || "AI Investment Brain Report",
          html: body,
        });
        await db.emailLog.create({
          data: {
            scheduledEmailId: email.id,
            recipient: email.recipient,
            subject: subject || email.subject,
            body,
            status: result.stub ? "stub-logged" : "sent",
            error: null,
          },
        });
        const next = getNextRunAt(email.cronExpr, now);
        await db.scheduledEmail.update({
          where: { id: email.id },
          data: {
            lastRunAt: now,
            lastStatus: "success",
            lastError: null,
            nextRunAt: next,
          },
        });
        console.log(
          `[scheduler] sent email "${email.name}" to ${email.recipient} (${
            result.stub ? "stub" : "live"
          }) — next run: ${next?.toISOString() ?? "n/a"}`
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[scheduler] email "${email.name}" failed:`, msg);
        try {
          await db.emailLog.create({
            data: {
              scheduledEmailId: email.id,
              recipient: email.recipient,
              subject: email.subject,
              body: "",
              status: "failed",
              error: msg,
            },
          });
          const next = getNextRunAt(email.cronExpr, now);
          await db.scheduledEmail.update({
            where: { id: email.id },
            data: {
              lastRunAt: now,
              lastStatus: "error",
              lastError: msg,
              nextRunAt: next,
            },
          });
        } catch (inner) {
          console.error("[scheduler] failed to record error:", inner);
        }
      }
    }
  } catch (e) {
    console.error(
      "[scheduler] tick error:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

export function ensureSchedulerStarted() {
  if (g.__aibSchedulerStarted) {
    return;
  }
  g.__aibSchedulerStarted = true;
  const task = cron.schedule(SCHEDULER_TICK_CRON, () => {
    void tick();
  });
  g.__aibSchedulerTask = task;

  // Sentiment Radar — market-wide scan every 30 minutes
  const sentimentTask = cron.schedule(SENTIMENT_MARKET_CRON, () => {
    void runSentimentMarketScan();
  });
  g.__aibSentimentMarketTask = sentimentTask;

  // Sentiment Radar — per-holding scan every 2 hours
  const holdingsTask = cron.schedule(SENTIMENT_HOLDINGS_CRON, () => {
    void runSentimentHoldingsScan();
  });
  g.__aibSentimentHoldingsTask = holdingsTask;

  console.log(
    `[scheduler] started (1-minute tick). SMTP mode: ${
      isStubMode() ? "STUB (file log)" : "LIVE"
    }. Sentiment radar: market scan every 30min, holdings every 2h.`
  );
}

async function runSentimentMarketScan() {
  try {
    const now = Date.now();
    if (g.__aibLastSentimentScan && now - g.__aibLastSentimentScan < 25 * 60 * 1000) {
      return; // debounce — don't double-run
    }
    g.__aibLastSentimentScan = now;
    console.log("[scheduler] starting market-wide sentiment scan…");
    const articles = await scanSentiment("MARKET");
    console.log(
      `[scheduler] market sentiment scan complete: ${articles.length} articles processed`
    );
  } catch (e) {
    console.error(
      "[scheduler] market sentiment scan failed:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

async function runSentimentHoldingsScan() {
  try {
    const positions = await db.portfolioPosition.findMany({ select: { symbol: true } });
    if (positions.length === 0) return;
    console.log(
      `[scheduler] starting per-holding sentiment scan for ${positions.length} positions…`
    );
    // Process sequentially with a small delay to avoid hammering the LLM
    let processed = 0;
    for (const p of positions) {
      try {
        await scanSentiment(p.symbol);
        processed += 1;
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        console.error(
          `[scheduler] sentiment scan failed for ${p.symbol}:`,
          e instanceof Error ? e.message : String(e)
        );
      }
    }
    console.log(
      `[scheduler] per-holding sentiment scan complete: ${processed}/${positions.length} done`
    );
  } catch (e) {
    console.error(
      "[scheduler] per-holding sentiment scan failed:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

export function stopScheduler() {
  if (g.__aibSchedulerTask) {
    g.__aibSchedulerTask.stop();
    g.__aibSchedulerTask = undefined;
  }
  if (g.__aibSentimentMarketTask) {
    g.__aibSentimentMarketTask.stop();
    g.__aibSentimentMarketTask = undefined;
  }
  if (g.__aibSentimentHoldingsTask) {
    g.__aibSentimentHoldingsTask.stop();
    g.__aibSentimentHoldingsTask = undefined;
  }
  g.__aibSchedulerStarted = false;
}
