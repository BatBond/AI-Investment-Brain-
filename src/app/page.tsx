"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { type SectionId } from "@/lib/sections";

import { Dashboard } from "@/components/sections/dashboard";
import { TickerSearch } from "@/components/sections/ticker-search";
import { Personas } from "@/components/sections/personas";
import { AIAgent } from "@/components/sections/ai-agent";
import { MorningBrief } from "@/components/sections/morning-brief";
import { NotesKnowledge } from "@/components/sections/notes-knowledge";
import { KnowledgeGraph } from "@/components/sections/knowledge-graph";
import { Automation } from "@/components/sections/automation";
import { GsScreener } from "@/components/sections/gs-screener";
import { MsDcf } from "@/components/sections/ms-dcf";
import { BwRisk } from "@/components/sections/bw-risk";
import { JpmEarnings } from "@/components/sections/jpm-earnings";
import { BrPortfolio } from "@/components/sections/br-portfolio";
import { CitTechnical } from "@/components/sections/cit-technical";
import { HvDividend } from "@/components/sections/hv-dividend";
import { BainCompetitive } from "@/components/sections/bain-competitive";
import { RenPatterns } from "@/components/sections/ren-patterns";
import { MckMacro } from "@/components/sections/mck-macro";
import { Portfolio } from "@/components/sections/portfolio";
import { SentimentRadar } from "@/components/sections/sentiment-radar";

export default function Home() {
  const [active, setActive] = useState<SectionId>("dashboard");
  // Ticker context that flows from sidebar search / dashboard into deep-dive modules.
  const [tickerContext, setTickerContext] = useState<string | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem("aib-sidebar-collapsed");
      if (v === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("aib-sidebar-collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const navigate = useCallback((id: SectionId, ticker?: string) => {
    if (ticker) setTickerContext(ticker);
    setActive(id);
    setMobileOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const selectTicker = useCallback(
    (t: string) => {
      setTickerContext(t);
      setActive("ticker-search");
      setMobileOpen(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    []
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        activeSection={active}
        onSectionChange={navigate}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onSelectTicker={selectTicker}
      />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        activeSection={active}
        onSectionChange={navigate}
        collapsed={false}
        onToggleCollapsed={() => setMobileOpen(false)}
        onSelectTicker={selectTicker}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={active}
          onMenuClick={() => setMobileOpen(true)}
          showMenu
        />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
            {active === "dashboard" && (
              <Dashboard onNavigate={navigate} onSelectTicker={selectTicker} />
            )}
            {active === "ticker-search" && (
              <TickerSearch
                initialTicker={tickerContext}
                onNavigate={navigate}
              />
            )}
            {active === "personas" && <Personas initialTicker={tickerContext} />}
            {active === "ai-agent" && <AIAgent initialTicker={tickerContext} />}
            {active === "morning-brief" && (
              <MorningBrief onNavigate={navigate} onSelectTicker={selectTicker} />
            )}
            {active === "gs-screener" && <GsScreener />}
            {active === "ms-dcf" && <MsDcf initialTicker={tickerContext} />}
            {active === "bw-risk" && <BwRisk />}
            {active === "jpm-earnings" && (
              <JpmEarnings initialTicker={tickerContext} />
            )}
            {active === "br-portfolio" && <BrPortfolio />}
            {active === "cit-technical" && (
              <CitTechnical initialTicker={tickerContext} />
            )}
            {active === "hv-dividend" && <HvDividend />}
            {active === "bain-competitive" && (
              <BainCompetitive initialTicker={tickerContext} />
            )}
            {active === "ren-patterns" && (
              <RenPatterns initialTicker={tickerContext} />
            )}
            {active === "mck-macro" && <MckMacro />}
            {active === "notes-knowledge" && (
              <NotesKnowledge
                onSelectTicker={selectTicker}
                onNavigate={navigate}
              />
            )}
            {active === "knowledge-graph" && <KnowledgeGraph />}
            {active === "automation" && <Automation />}
            {active === "portfolio" && (
              <Portfolio onNavigate={navigate} onSelectTicker={selectTicker} />
            )}
            {active === "sentiment-radar" && (
              <SentimentRadar onNavigate={navigate} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
