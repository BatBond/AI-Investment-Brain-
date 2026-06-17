import { NextRequest, NextResponse } from "next/server";
import { runChat } from "@/lib/zai";
import {
  ANALYST_MODULE_PROMPTS,
  getAnalystModule,
} from "@/lib/analyst-prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalystRequestBody {
  userInput: string;
  // optional context to enrich the prompt (ticker fundamentals, etc.)
  context?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;
  const moduleConfig = getAnalystModule(moduleId);
  if (!moduleConfig) {
    return NextResponse.json(
      { error: `Unknown analyst module: ${moduleId}` },
      { status: 404 }
    );
  }

  let body: AnalystRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userInput = (body.userInput ?? "").trim();
  if (!userInput) {
    return NextResponse.json(
      { error: "userInput is required." },
      { status: 400 }
    );
  }

  const userMessage = body.context
    ? `${userInput}\n\n--- Additional context (representative sample data) ---\n${body.context}`
    : userInput;

  try {
    const result = await runChat(
      [
        { role: "system", content: moduleConfig.system },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.45, maxTokens: 2600 }
    );
    return NextResponse.json({
      moduleId,
      persona: moduleConfig.persona,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Analyst call failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;
  const moduleConfig = getAnalystModule(moduleId);
  if (!moduleConfig) {
    return NextResponse.json(
      { error: `Unknown analyst module: ${moduleId}` },
      { status: 404 }
    );
  }
  return NextResponse.json({
    moduleId,
    persona: moduleConfig.persona,
    availableModules: Object.keys(ANALYST_MODULE_PROMPTS),
  });
}
