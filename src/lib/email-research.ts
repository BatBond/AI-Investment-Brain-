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
    case "morning-top-20":
      userPrompt = `Perform a comprehensive market scan and identify the TOP 20 STOCKS TO BUY for a 3-6 month investment timeframe.

For each stock, provide:
1. Ticker symbol
2. Company name
3. Current price (use representative sample data)
4. Conviction score (1-10)
5. Investment thesis (2-3 sentences)
6. Catalyst(s) expected in next 3-6 months
7. Entry price zone
8. Target price (12-month)
9. Stop-loss level
10. Risk rating (Low/Medium/High)
11. Sector

Diversify across sectors (no more than 4 stocks per sector). Include a mix of:
- 5 large-cap value stocks (defensive)
- 5 large-cap growth stocks
- 4 mid-cap momentum stocks
- 3 dividend income stocks
- 3 speculative high-conviction picks

Format as a professional HTML email with:
- Executive summary at the top (1 paragraph + key stats: avg conviction, sectors covered, avg risk)
- Full table of 20 stocks with all 11 columns
- "Top 5 Highest Conviction" callout section
- "Risk Warnings" section at the bottom
- Disclaimer at the bottom

Use clean inline-styled HTML. Subject line format: "Daily Top 20 Stocks — <today's date>".`;
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
    { temperature: 0.5, maxTokens: template === "morning-top-20" ? 6000 : 2200 }
  );

  const m = body.match(/^SUBJECT:\s*(.+?)\n([\s\S]+)$/);
  if (m) {
    return { subject: m[1].trim(), body: m[2].trim() };
  }
  return { subject: "AI Investment Brain Report", body: body.trim() };
}
