/**
 * Email template definitions (shared between client + server).
 * Keep this file free of any server-only imports (no z-ai-web-dev-sdk).
 */

export type EmailTemplate =
  | "morning-brief"
  | "portfolio-review"
  | "signal-alert"
  | "dcf-deepdive"
  | "morning-top-20"
  | "custom";

export const EMAIL_TEMPLATES: { id: EmailTemplate; label: string; description: string }[] = [
  { id: "morning-brief", label: "Morning Brief", description: "Pre-market summary, top movers, news catalysts, watchlist alerts" },
  { id: "portfolio-review", label: "Portfolio Review", description: "Weekly performance summary, top contributors, risk assessment" },
  { id: "signal-alert", label: "Signal Alert", description: "Ticker-specific signal trigger with entry/stop/target" },
  { id: "dcf-deepdive", label: "DCF Deep-Dive", description: "5Y revenue projection, WACC, terminal value, fair value vs price" },
  { id: "morning-top-20", label: "Daily Top-20 Stocks", description: "AI brain scans market, picks top 20 stocks for 3-6 month timeframe" },
  { id: "custom", label: "Custom Research", description: "Free-form AI-generated equity research email" },
];

/** Default cron expression for each template (used when creating a new schedule). */
export const DEFAULT_CRON: Record<EmailTemplate, string> = {
  "morning-brief": "0 8 * * 1-5",
  "portfolio-review": "0 18 * * 5",
  "signal-alert": "0 9 * * 1-5",
  "dcf-deepdive": "0 8 * * 1",
  "morning-top-20": "0 8 * * 1-5",
  custom: "0 8 * * *",
};
