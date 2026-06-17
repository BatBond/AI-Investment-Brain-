"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Render LLM markdown output inside the `.llm-output` styling defined in globals.css.
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("llm-output text-sm leading-relaxed text-slate-200", className)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
