"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Bot, User, Send, Activity } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Analyze AAPL — give me technicals and a trade hypothesis",
  "Compare MSFT vs GOOGL on relative strength",
  "Screen the universe for momentum setups right now",
  "Build a trade hypothesis for TSLA with entry, stop, target",
  "What are the key support/resistance levels for NVDA?",
  "Which of NVDA or AMD has better risk/reward right now?",
];

const CAPABILITIES = [
  "Compute RSI, MACD, Bollinger Bands, SMA 50/200, ATR",
  "Identify support/resistance & chart patterns",
  "Build trade hypotheses with entry / stop / target / R:R",
  "Compare stocks on relative strength",
  "Screen for momentum, value, or technical setups",
];

export function AIAgent({ initialTicker }: { initialTicker?: string } = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastInitialRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Auto-send a contextual prompt when a ticker is passed via navigation
  // (e.g. "Analyze with AI Agent" from portfolio / sentiment radar).
  useEffect(() => {
    if (!initialTicker) return;
    if (lastInitialRef.current === initialTicker) return;
    lastInitialRef.current = initialTicker;
    const prompt = `Analyze ${initialTicker} — give me technicals, fundamentals, recent news context, and a trade hypothesis with entry / stop / target.`;
    void send(prompt);
  }, [initialTicker]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      const reply: string =
        data.reply ||
        "_(No response returned.)_";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Agent error: ${msg}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** ${msg}\n\n_Please try again._`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="space-y-5">
      {/* Header / capabilities */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-50">AI Analyst Agent</CardTitle>
              <CardDescription className="text-xs text-cyan-300/90">
                Real-time equity research analyst — compute indicators, build trade hypotheses,
                screen and compare
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CAPABILITIES.map((c) => (
              <div
                key={c}
                className="flex items-start gap-2 rounded-md border border-slate-700 bg-slate-900/40 p-2 text-xs text-slate-300"
              >
                <Activity className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="border-slate-700 bg-slate-800/60 flex flex-col" style={{ height: "62vh", minHeight: 480 }}>
        <CardHeader className="pb-3 border-b border-slate-700 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/15 text-cyan-400">
              <Bot className="h-3.5 w-3.5" />
            </span>
            Live Chat
          </CardTitle>
          <Badge variant="outline" className="border-emerald-700/60 bg-emerald-900/20 text-emerald-300">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
            Online
          </Badge>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-700/40 bg-cyan-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">
                      I&apos;m your autonomous equity analyst. Try one of these to get started:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="rounded border border-slate-700 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-300 hover:border-amber-500/60 hover:text-amber-300 text-left"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 live-dot" />
                <span className="h-2 w-2 rounded-full bg-cyan-400 live-dot" style={{ animationDelay: "0.2s" }} />
                <span className="h-2 w-2 rounded-full bg-cyan-400 live-dot" style={{ animationDelay: "0.4s" }} />
                <span className="ml-2 text-xs text-slate-400">analyzing...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about any stock, comparison, or trade setup..."
              rows={1}
              className="flex-1 resize-none rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 max-h-32"
              style={{ minHeight: 40 }}
            />
            <Button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Press <kbd className="rounded border border-slate-600 bg-slate-900 px-1">Enter</kbd> to send ·
            <kbd className="rounded border border-slate-600 bg-slate-900 px-1">Shift+Enter</kbd> for newline
          </div>
        </div>
      </Card>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUser
            ? "bg-amber-500/15 text-amber-400"
            : "bg-cyan-500/15 text-cyan-400"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-lg border px-3 py-2",
          isUser
            ? "border-amber-700/40 bg-amber-900/10 text-slate-100"
            : "border-slate-700 bg-slate-900/60 text-slate-200"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  );
}
