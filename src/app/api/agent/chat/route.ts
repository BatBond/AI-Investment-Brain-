import { NextRequest, NextResponse } from "next/server";
import { runChat } from "@/lib/zai";
import { AGENT_SYSTEM_PROMPT } from "@/lib/analyst-prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AgentRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function POST(req: NextRequest) {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return NextResponse.json(
      { error: "messages[] is required." },
      { status: 400 }
    );
  }

  // Keep memory bounded — last 12 turns
  const trimmed = incoming.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const reply = await runChat(
      [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        ...trimmed,
      ],
      { temperature: 0.55, maxTokens: 1400 }
    );
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Agent call failed: ${message}` },
      { status: 500 }
    );
  }
}
