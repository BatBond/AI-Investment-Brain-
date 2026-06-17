/**
 * Scheduler init — singleton guard against dev hot-reload.
 * Call ensureSchedulerStarted() from a server component
 * (e.g. layout.tsx or a route handler) once on app boot.
 *
 * ⚠️ DISABLED on Vercel/serverless — use /api/cron/* endpoints + vercel.json instead.
 * The in-process scheduler only works in long-running processes (local dev, self-hosted).
 */

import { ensureSchedulerStarted } from "./scheduler";

let initStarted = false;

export function initSchedulerOnce() {
  // Skip on Vercel/serverless — cron jobs handle scheduling there
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    console.log("[scheduler] skipped (Vercel/production — using /api/cron/* endpoints instead)");
    return;
  }
  if (initStarted) return;
  initStarted = true;
  try {
    ensureSchedulerStarted();
  } catch (e) {
    console.error("[scheduler-init] failed:", e instanceof Error ? e.message : String(e));
  }
}

