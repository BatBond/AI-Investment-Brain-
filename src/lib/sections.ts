import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  Users,
  Bot,
  Sunrise,
  Filter,
  Calculator,
  ShieldAlert,
  CalendarClock,
  PieChart,
  LineChart,
  HandCoins,
  Swords,
  Radar,
  Globe2,
  NotebookPen,
  Network,
  Send,
} from "lucide-react";

export type SectionId =
  | "dashboard"
  | "ticker-search"
  | "personas"
  | "ai-agent"
  | "morning-brief"
  | "gs-screener"
  | "ms-dcf"
  | "bw-risk"
  | "jpm-earnings"
  | "br-portfolio"
  | "cit-technical"
  | "hv-dividend"
  | "bain-competitive"
  | "ren-patterns"
  | "mck-macro"
  | "notes-knowledge"
  | "knowledge-graph"
  | "automation";

export type SectionGroup = "core" | "analyst" | "knowledge" | "automation";

export interface SectionDef {
  id: SectionId;
  label: string;
  short: string;
  icon: LucideIcon;
  group: SectionGroup;
  firm?: string;
}

export const SECTIONS: SectionDef[] = [
  // Core
  { id: "dashboard", label: "Dashboard", short: "DASH", icon: LayoutDashboard, group: "core" },
  { id: "ticker-search", label: "Ticker Search", short: "SRCH", icon: Search, group: "core" },
  { id: "personas", label: "5-Persona Advisory", short: "PER5", icon: Users, group: "core" },
  { id: "ai-agent", label: "AI Agent", short: "AI", icon: Bot, group: "core" },
  { id: "morning-brief", label: "Morning Brief", short: "MRNB", icon: Sunrise, group: "core" },
  // Analyst modules
  { id: "gs-screener", label: "GS Stock Screener", short: "GS", icon: Filter, group: "analyst", firm: "Goldman Sachs" },
  { id: "ms-dcf", label: "MS DCF Valuation", short: "MS", icon: Calculator, group: "analyst", firm: "Morgan Stanley" },
  { id: "bw-risk", label: "BW Risk Framework", short: "BW", icon: ShieldAlert, group: "analyst", firm: "Bridgewater" },
  { id: "jpm-earnings", label: "JPM Earnings Breakdown", short: "JPM", icon: CalendarClock, group: "analyst", firm: "JPMorgan" },
  { id: "br-portfolio", label: "BR Portfolio Model", short: "BR", icon: PieChart, group: "analyst", firm: "BlackRock" },
  { id: "cit-technical", label: "Citadel Technical", short: "CIT", icon: LineChart, group: "analyst", firm: "Citadel" },
  { id: "hv-dividend", label: "HV Dividend Strategy", short: "HV", icon: HandCoins, group: "analyst", firm: "Harvard Endowment" },
  { id: "bain-competitive", label: "Bain Competitive Analysis", short: "BAIN", icon: Swords, group: "analyst", firm: "Bain" },
  { id: "ren-patterns", label: "RenTec Pattern Finder", short: "REN", icon: Radar, group: "analyst", firm: "Renaissance" },
  { id: "mck-macro", label: "McK Macro Impact", short: "MCK", icon: Globe2, group: "analyst", firm: "McKinsey" },
  // Knowledge & Notes
  { id: "notes-knowledge", label: "Notes & Knowledge", short: "NOTE", icon: NotebookPen, group: "knowledge" },
  { id: "knowledge-graph", label: "Knowledge Graph", short: "KGRF", icon: Network, group: "knowledge" },
  // Automation
  { id: "automation", label: "Email Automation", short: "AUTO", icon: Send, group: "automation" },
];

export const SECTION_MAP: Record<SectionId, SectionDef> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s])
) as Record<SectionId, SectionDef>;

export const GROUP_LABELS: Record<SectionGroup, string> = {
  core: "Core",
  analyst: "Wall Street Analyst Modules",
  knowledge: "Knowledge & Notes",
  automation: "Automation",
};

export const GROUP_ORDER: SectionGroup[] = ["core", "analyst", "knowledge", "automation"];

export const GROUPED_SECTIONS: { group: SectionGroup; label: string; items: SectionDef[] }[] =
  GROUP_ORDER.map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    items: SECTIONS.filter((s) => s.group === g),
  }));
