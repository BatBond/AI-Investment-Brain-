/**
 * AI research email body generator.
 * ---------------------------------------------------------------
 * For each template, ask the LLM to produce a professional HTML
 * email body. The response is parsed as `SUBJECT: <subject>\n<body>`.
 */

import { runChat } from "./zai";
import type { EmailTemplate } from "./email-templates";

export type { EmailTemplate };

export interface GenerateEmailOpts {
  ticker?: string;
  portfolioJson?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string; // HTML body
}

export async function generateEmailBody(
  template: string,
  opts: GenerateEmailOpts
): Promise<GeneratedEmail> {
  let userPrompt = "";
  switch (template) {
    case "morning-brief":
      userPrompt =
        "Generate a professional morning brief email for an institutional investor. " +
        "Cover: pre-market summary, top 3 movers (use sample tickers AAPL, NVDA, TSLA, MSFT), " +
        "news catalysts (3-4 headlines), watchlist alerts (3 items with ticker + signal + reasoning). " +
        "Format as a clean HTML email with H2 headings, bullet lists, and a short summary table. " +
        "Use inline CSS only (dark theme: bg #0f172a, accent amber #f59e0b). Do not include external CSS.";
      break;
    case "portfolio-review":
      userPrompt = `Generate a weekly portfolio review email. Portfolio: ${
        opts.portfolioJson || "Sample 60/40 portfolio: 60% VTI, 25% VXUS, 10% BND, 5% cash"
      }. Cover: weekly performance summary, top contributor, top detractor, risk assessment (volatility, beta), recommendation for the week ahead. HTML email format with inline CSS (dark theme: bg #0f172a, accent amber #f59e0b).`;
      break;
    case "signal-alert":
      userPrompt = `Generate a signal alert email for ticker ${opts.ticker || "AAPL"}. Cover: current price (use representative data), recent signal triggered (RSI/MACD/breakout), trade hypothesis with entry/stop/target, confidence level, and the catalyst thesis in 3 sentences. HTML email format with inline CSS (dark theme: bg #0f172a, accent amber #f59e0b).`;
      break;
    case "dcf-deepdive":
      userPrompt = `Generate a DCF deep-dive email for ${opts.ticker || "AAPL"}. Include a summary table with 5Y revenue projection (Year, Revenue $B, YoY %), WACC breakdown, terminal value (both methods), fair value vs current price (gap %), and verdict (Undervalued/Fairly Valued/Overvalued). HTML email format with a small summary table and inline CSS (dark theme: bg #0f172a, accent amber #f59e0b).`;
      break;
    default:
      userPrompt = `Generate a custom research email${opts.ticker ? ` about ${opts.ticker}` : ""}. Cover thesis, valuation, risks, and a recommendation. HTML format with inline CSS (dark theme: bg #0f172a, accent amber #f59e0b).`;
  }

  const body = await runChat(
    [
      {
        role: "system",
        content:
          "You are an AI equity research assistant generating professional HTML email content for an institutional investor. " +
          "Use clean HTML (no external CSS), embed inline styles. " +
          "Subject line should be 6-10 words, compelling. " +
          "Format your response as:\n\nSUBJECT: <subject line>\n\n<HTML body>\n\n" +
          "Do not wrap the body in markdown fences.",
      },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.5, maxTokens: 2200 }
  );

  const m = body.match(/^SUBJECT:\s*(.+?)\n([\s\S]+)$/);
  if (m) {
    return { subject: m[1].trim(), body: m[2].trim() };
  }
  return { subject: "AI Investment Brain Report", body: body.trim() };
}
