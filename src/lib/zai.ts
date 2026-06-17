import ZAI from "z-ai-web-dev-sdk";
import type { CreateChatCompletionBody } from "z-ai-web-dev-sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZai() {
  if (!_zai) {
    _zai = await ZAI.create();
  }
  return _zai;
}

/**
 * Run a single chat completion against the ZAI SDK.
 * Retries once on 429 (rate limit) with a 2.5s backoff so the 5-persona
 * flow degrades gracefully instead of surfacing transient throttling errors.
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
  try {
    const completion = await zai.chat.completions.create(body);
    return completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.toLowerCase().includes("too many requests")) {
      await new Promise((r) => setTimeout(r, 2500));
      const completion = await zai.chat.completions.create(body);
      return completion.choices[0]?.message?.content ?? "";
    }
    throw err;
  }
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
