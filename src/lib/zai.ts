import ZAI from "z-ai-web-dev-sdk";
import type { CreateChatCompletionBody } from "z-ai-web-dev-sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let _zai: ZAI | null = null;
let _provider: "zai-sdk" | "openai-compatible" | "none" = "none";

/**
 * Initialize the LLM provider.
 *
 * Provider priority:
 * 1. If OPENAI_API_KEY is set → use OpenAI-compatible API directly via fetch
 *    (works on Vercel, supports OpenAI, Anthropic via proxy, GLM, Groq, etc.)
 * 2. If ZAI_API_KEY is set → use the z-ai-web-dev-sdk with explicit config
 *    (works on Vercel if you have a real Z.ai API key)
 * 3. Otherwise → fall back to ZAI.create() which reads .z-ai-config
 *    (works in Z.ai sandbox only — NOT on Vercel)
 *
 * ─── Vercel setup (pick ONE provider) ─────────────────────────────────
 *
 * Option A: OpenAI (most common)
 *   OPENAI_API_KEY=sk-...
 *   OPENAI_BASE_URL=https://api.openai.com/v1   (default)
 *   OPENAI_MODEL=gpt-4o-mini                    (default)
 *
 * Option B: GLM-4 (Z.ai's public API — get key at https://open.bigmodel.cn)
 *   OPENAI_API_KEY=your-glm-key
 *   OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
 *   OPENAI_MODEL=glm-4-flash
 *
 * Option C: Groq (fast + free tier)
 *   OPENAI_API_KEY=gsk_...
 *   OPENAI_BASE_URL=https://api.groq.com/openai/v1
 *   OPENAI_MODEL=llama-3.3-70b-versatile
 *
 * Option D: Any other OpenAI-compatible API (together.ai, fireworks, etc.)
 *   OPENAI_API_KEY=...
 *   OPENAI_BASE_URL=...
 *   OPENAI_MODEL=...
 */
export async function getZai(): Promise<ZAI | "openai-compatible"> {
  if (_provider !== "none") {
    return _provider === "openai-compatible" ? "openai-compatible" : _zai!;
  }

  // 1. OpenAI-compatible (preferred for Vercel — most flexible)
  if (process.env.OPENAI_API_KEY) {
    _provider = "openai-compatible";
    console.log("[zai] Using OpenAI-compatible provider:", process.env.OPENAI_BASE_URL || "https://api.openai.com/v1", "model:", process.env.OPENAI_MODEL || "gpt-4o-mini");
    return "openai-compatible";
  }

  // 2. Z.ai SDK with explicit env vars
  const zaiApiKey = process.env.ZAI_API_KEY;
  const zaiBaseUrl = process.env.ZAI_BASE_URL;
  if (zaiApiKey && zaiBaseUrl) {
    _provider = "zai-sdk";
    _zai = new ZAI({
      baseUrl: zaiBaseUrl,
      apiKey: zaiApiKey,
      chatId: process.env.ZAI_CHAT_ID,
      userId: process.env.ZAI_USER_ID,
    });
    return _zai;
  }

  // 3. Z.ai SDK with .z-ai-config file (sandbox/local dev only)
  _provider = "zai-sdk";
  _zai = await ZAI.create();
  return _zai;
}

/**
 * Run a single chat completion.
 * Works with both the z-ai-web-dev-sdk AND any OpenAI-compatible API.
 *
 * Retries up to 3 times on 429 (rate limit) with exponential backoff
 * (2.5s, 4s, 6s) so the 5-persona flow and sentiment scans degrade
 * gracefully instead of surfacing transient throttling errors.
 */
export async function runChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; thinking?: boolean }
): Promise<string> {
  const provider = await getZai();

  // ─── OpenAI-compatible path (Vercel) ────────────────────────────────
  if (provider === "openai-compatible") {
    return runChatOpenAICompatible(messages, opts);
  }

  // ─── Z.ai SDK path (sandbox or env-configured) ──────────────────────
  const zai = provider as ZAI;
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
  throw new Error("runChat: exhausted retries");
}

/**
 * Call an OpenAI-compatible chat completions endpoint directly via fetch.
 * Works with OpenAI, GLM (open.bigmodel.cn), Groq, Together, Fireworks,
 * Anthropic via proxy, local LLMs (Ollama, vLLM), and more.
 */
async function runChatOpenAICompatible(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; thinking?: boolean }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    ...(opts?.temperature !== undefined ? { temperature: opts.temperature } : {}),
    ...(opts?.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
  };

  const backoffs = [2500, 4000, 6000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const msg = `OpenAI-compatible API error ${res.status}: ${errBody.slice(0, 300)}`;
        const is429 = res.status === 429;
        if (is429 && attempt < backoffs.length) {
          console.warn(`[zai] 429 on attempt ${attempt + 1}, retrying in ${backoffs[attempt]}ms…`);
          await new Promise((r) => setTimeout(r, backoffs[attempt]));
          continue;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429") || msg.toLowerCase().includes("too many requests");
      if (is429 && attempt < backoffs.length) {
        await new Promise((r) => setTimeout(r, backoffs[attempt]));
        continue;
      }
      throw err;
    }
  }
  throw new Error("runChatOpenAICompatible: exhausted retries");
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
