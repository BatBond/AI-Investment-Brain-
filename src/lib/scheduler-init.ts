/**
 * Scheduler init — singleton guard against dev hot-reload.
 * Call ensureSchedulerStarted() from a server component
 * (e.g. layout.tsx or a route handler) once on app boot.
 *
 * ⚠️ DISABLED on Vercel/serverless — use /api/cron/* endpoints + vercel.json instead.
 * The in-process scheduler only works in long-running processes (local dev, self-hosted).
 *
 * This function is wrapped in try/catch to prevent any failure from crashing
 * the entire app. If the scheduler can't start, the app still works — only
 * scheduled emails/sentiment scans won't run automatically (use Vercel Cron instead).
 */

import { ensureSchedulerStarted } from "./scheduler";

let initStarted = false;

export function initSchedulerOnce() {
  // Skip on Vercel/serverless — cron jobs handle scheduling there
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return;
  }
  if (initStarted) return;
  initStarted = true;
  try {
    ensureSchedulerStarted();
  } catch (e) {
    // Swallow errors — scheduler is non-critical, app should still load
    console.error("[scheduler-init] non-fatal failure:", e instanceof Error ? e.message : String(e));
  }
}


