/**
 * Scheduler init — singleton guard against dev hot-reload.
 * Call ensureSchedulerStarted() from a server component
 * (e.g. layout.tsx or a route handler) once on app boot.
 */

import { ensureSchedulerStarted } from "./scheduler";

let initStarted = false;

export function initSchedulerOnce() {
  if (initStarted) return;
  initStarted = true;
  try {
    ensureSchedulerStarted();
  } catch (e) {
    console.error("[scheduler-init] failed:", e instanceof Error ? e.message : String(e));
  }
}
