/**
 * Email template definitions (shared between client + server).
 * Keep this file free of any server-only imports (no z-ai-web-dev-sdk).
 */

export type EmailTemplate =
  | "morning-brief"
  | "portfolio-review"
  | "signal-alert"
  | "dcf-deepdive"
  | "custom";

export const EMAIL_TEMPLATES: { id: EmailTemplate; label: string; description: string }[] = [
  { id: "morning-brief", label: "Morning Brief", description: "Pre-market summary, top movers, news catalysts, watchlist alerts" },
  { id: "portfolio-review", label: "Portfolio Review", description: "Weekly performance summary, top contributors, risk assessment" },
  { id: "signal-alert", label: "Signal Alert", description: "Ticker-specific signal trigger with entry/stop/target" },
  { id: "dcf-deepdive", label: "DCF Deep-Dive", description: "5Y revenue projection, WACC, terminal value, fair value vs price" },
  { id: "custom", label: "Custom Research", description: "Free-form AI-generated equity research email" },
];
