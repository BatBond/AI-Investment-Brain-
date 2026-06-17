"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { SECTIONS, GROUPED_SECTIONS, type SectionId } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { UniversalSearch } from "@/components/layout/universal-search";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface SidebarProps {
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectTicker: (symbol: string) => void;
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500 font-black text-slate-950">
        AI
      </div>
      {!collapsed && (
        <div className="leading-none min-w-0">
          <div className="truncate text-sm font-bold tracking-tight text-slate-50">
            AI Investment Brain
          </div>
          <div className="text-[9px] uppercase tracking-widest text-amber-400">
            Equity Research Terminal
          </div>
        </div>
      )}
    </div>
  );
}

function MarketStatusPill({ collapsed }: { collapsed: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const marketOpen = now
    ? (() => {
        const day = now.getDay();
        const totalMin = now.getHours() * 60 + now.getMinutes();
        const isWeekday = day >= 1 && day <= 5;
        return isWeekday && totalMin >= 570 && totalMin <= 960;
      })()
    : false;

  return (
    <div className="px-2 py-2">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium",
          marketOpen
            ? "border-emerald-700/60 bg-emerald-900/30 text-emerald-300"
            : "border-rose-700/60 bg-rose-900/30 text-rose-300"
        )}
        title={now ? now.toLocaleString("en-US") : "Loading"}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full live-dot",
            marketOpen ? "bg-emerald-400" : "bg-rose-400"
          )}
        />
        {!collapsed && <span>{marketOpen ? "Market Open" : "Market Closed"}</span>}
      </div>
    </div>
  );
}

interface NavListProps {
  active: SectionId;
  collapsed: boolean;
  onSectionChange: (id: SectionId) => void;
}

function NavList({ active, collapsed, onSectionChange }: NavListProps) {
  return (
    <nav
      aria-label="Sections"
      className="flex-1 overflow-y-auto px-2 py-2 space-y-3 aib-scroll"
    >
      {GROUPED_SECTIONS.map(({ group, label, items }) => (
        <div key={group}>
          {!collapsed && (
            <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </div>
          )}
          {collapsed && (
            <div className="mx-auto mb-1 mt-2 h-px w-6 bg-slate-700/60" />
          )}
          <ul className="space-y-0.5">
            {items.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onSectionChange(s.id)}
                    title={collapsed ? s.label : undefined}
                    className={cn(
                      "group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
                      isActive
                        ? "bg-amber-500/10 text-amber-300"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r border-l-[3px] border-amber-500" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-amber-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{s.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex w-full items-center gap-2 border-t border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-3.5 w-3.5" />
      ) : (
        <PanelLeftClose className="h-3.5 w-3.5" />
      )}
      {!collapsed && <span>Collapse</span>}
    </button>
  );
}

function SidebarInner({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapsed,
  onSelectTicker,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-slate-900 border-r border-slate-700">
      <Brand collapsed={collapsed} />
      <div className="px-2 pb-2">
        <UniversalSearch collapsed={collapsed} onSelect={onSelectTicker} />
      </div>
      <NavList
        active={activeSection}
        collapsed={collapsed}
        onSectionChange={onSectionChange}
      />
      <MarketStatusPill collapsed={collapsed} />
      <CollapseToggle collapsed={collapsed} onClick={onToggleCollapsed} />
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  // Desktop sidebar
  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col transition-[width] duration-200",
        props.collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <SidebarInner {...props} />
    </aside>
  );
}

interface MobileSidebarProps extends SidebarProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
  ...props
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 border-r border-slate-700 bg-slate-900 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarInner {...props} collapsed={false} onToggleCollapsed={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

export { Activity };
