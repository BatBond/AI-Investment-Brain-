"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { cn } from "@/lib/utils";

interface TabNavProps {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

const GROUP_LABELS: Record<string, string> = {
  core: "Core",
  analyst: "Wall Street Analyst Modules",
  knowledge: "Knowledge & Notes",
};

export function TabNav({ active, onChange }: TabNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  // scroll active tab into view when it changes
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (btn) {
      el.scrollTo({
        left:
          btn.offsetLeft - el.clientWidth / 2 + btn.clientWidth / 2,
        behavior: "smooth",
      });
    }
    updateArrows();
  }, [active]);

  function scrollBy(dir: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  // Precompute which items need a group divider (pure derivation, no side effects in render)
  const itemsWithDivider = SECTIONS.map((s, i) => ({
    section: s,
    showDivider: i === 0 || SECTIONS[i - 1].group !== s.group,
  }));

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-14 z-30 border-b border-slate-700 bg-slate-900/95 backdrop-blur"
    >
      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll tabs left"
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-3 bg-gradient-to-r from-slate-900 via-slate-900 to-transparent"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
        )}
        <div
          ref={scrollerRef}
          className="flex items-stretch gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {itemsWithDivider.map(({ section: s, showDivider }) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <div key={s.id} className="flex items-stretch">
                {showDivider && (
                  <div className="mx-1 flex flex-col justify-center">
                    <span className="hidden lg:block text-[9px] uppercase tracking-widest text-slate-500 px-2 py-0.5">
                      {GROUP_LABELS[s.group]}
                    </span>
                    <div className="hidden lg:block h-px bg-slate-700" />
                  </div>
                )}
                <button
                  data-tab={s.id}
                  onClick={() => onChange(s.id)}
                  title={s.label + (s.firm ? ` — ${s.firm}` : "")}
                  className={cn(
                    "group flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.3)]"
                      : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden font-mono text-[10px]">{s.short}</span>
                </button>
              </div>
            );
          })}
        </div>
        {showRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll tabs right"
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-1 bg-gradient-to-l from-slate-900 via-slate-900 to-transparent"
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>
    </nav>
  );
}
