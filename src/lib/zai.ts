import ZAI from "z-ai-web-dev-sdk";
import type { CreateChatCompletionBody } from "z-ai-web-dev-sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let _zai: ZAI | null = null;

/**
 * Initialize the ZAI SDK client.
 *
 * The SDK's default `ZAI.create()` reads from a `.z-ai-config` file which
 * doesn't exist on Vercel/serverless. We bypass it by instantiating `new ZAI(config)`
 * directly with values from env vars.
 *
 * Required env vars (set in Vercel dashboard):
 *   ZAI_API_KEY  — your Z.ai API key
 *   ZAI_BASE_URL — defaults to https://api.z.ai/api/v1
 *
 * If env vars aren't set, falls back to ZAI.create() which searches for
 * .z-ai-config in the project root, home dir, or /etc/ (works in Z.ai sandbox).
 */
export async function getZai(): Promise<ZAI> {
  if (_zai) return _zai;

  const apiKey = process.env.ZAI_API_KEY;
  const baseUrl = process.env.ZAI_BASE_URL || "https://api.z.ai/api/v1";

  if (apiKey && baseUrl) {
    // Production path — use env vars directly (no config file needed)
    _zai = new ZAI({
      baseUrl,
      apiKey,
      chatId: process.env.ZAI_CHAT_ID,
      userId: process.env.ZAI_USER_ID,
    });
    return _zai;
  }

  // Dev/local path — fall back to ZAI.create() which reads .z-ai-config
  _zai = await ZAI.create();
  return _zai;
}

/**
 * Run a single chat completion against the ZAI SDK.
 * Retries up to 3 times on 429 (rate limit) with exponential backoff
 * (2.5s, 4s, 6s) so the 5-persona flow and sentiment scans degrade
 * gracefully instead of surfacing transient throttling errors.
 */
export async function runChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; thinking?: boolean }
): Promise<string> {
  const zai = await getZai();
  const body: CreateChatCompletionBody = {
    messages,
    thinking: { type: opts?.thinking ? "enabled" : "disabled" },
    ...(opts?.temperature !== undefined ? { temperature: opts.temperature } : {}),
    ...(opts?.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
  };
  const backoffs = [2500, 4000, 6000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const completion = await zai.chat.completions.create(body);
      return completion.choices[0]?.message?.content ?? "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 =
        msg.includes("429") || msg.toLowerCase().includes("too many requests");
      if (is429 && attempt < backoffs.length) {
        await new Promise((r) => setTimeout(r, backoffs[attempt]));
        continue;
      }
      throw err;
    }
  }
  // Unreachable
  throw new Error("runChat: exhausted retries");
}

/**
 * Run 5 personas sequentially (the ZAI API rate-limits parallel calls).
 * Falls back to raw text on parse failure.
 */
export async function runPersonas(
  personaPrompts: Record<string, { name: string; color: string; system: string }>,
  userPayload: string
): Promise<
  Array<{
    id: string;
    name: string;
    color: string;
    raw: string;
    parsed?: {
      verdict?: string;
      confidence?: number;
      rationale?: string;
      metrics?: Array<{ label: string; value: string }>;
      thesis?: string;
    };
    error?: string;
  }>
> {
  const ids = Object.keys(personaPrompts);
  const results: Awaited<ReturnType<typeof runOnePersona>>[] = [];
  for (const id of ids) {
    const p = personaPrompts[id];
    // small delay between calls to avoid 429s — Z.ai rate-limits burst traffic
    if (results.length > 0) await new Promise((r) => setTimeout(r, 1200));
    results.push(await runOnePersona(id, p, userPayload));
  }
  return results;
}

async function runOnePersona(
  id: string,
  p: { name: string; color: string; system: string },
  userPayload: string
) {
  try {
    const raw = await runChat(
      [
        { role: "system", content: p.system },
        { role: "user", content: userPayload },
      ],
      { temperature: 0.7, maxTokens: 700 }
    );
    // strip potential markdown fences
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    let parsed: ReturnType<typeof JSON.parse> | undefined;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // try to extract the first {...} block
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = undefined;
        }
      }
    }
    return { id, name: p.name, color: p.color, raw, parsed };
  } catch (err) {
    return {
      id,
      name: p.name,
      color: p.color,
      raw: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
