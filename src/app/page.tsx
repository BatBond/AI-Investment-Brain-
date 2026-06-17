"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/layout/header";
import { TabNav } from "@/components/layout/tab-nav";
import { Footer } from "@/components/layout/footer";
import { type SectionId } from "@/lib/sections";

import { Dashboard } from "@/components/sections/dashboard";
import { TickerSearch } from "@/components/sections/ticker-search";
import { Personas } from "@/components/sections/personas";
import { AIAgent } from "@/components/sections/ai-agent";
import { MorningBrief } from "@/components/sections/morning-brief";
import { Braindump } from "@/components/sections/braindump";
import { KnowledgeGraph } from "@/components/sections/knowledge-graph";
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

export default function Home() {
  const [active, setActive] = useState<SectionId>("dashboard");
  // Ticker context that flows from header search / dashboard into deep-dive modules.
  const [tickerContext, setTickerContext] = useState<string | undefined>(undefined);

  const navigate = useCallback(
    (id: SectionId, ticker?: string) => {
      if (ticker) setTickerContext(ticker);
      setActive(id);
      // scroll main content to top on section change
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    []
  );

  const selectTicker = useCallback(
    (t: string) => {
      setTickerContext(t);
      setActive("ticker-search");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    []
  );

  const openTickerSearch = useCallback(() => setActive("ticker-search"), []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header
        onSelectTicker={selectTicker}
        onOpenTickerSearch={openTickerSearch}
      />
      <TabNav active={active} onChange={(id) => navigate(id)} />

      <main className="flex-1 bg-slate-950">
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
          {active === "ai-agent" && <AIAgent />}
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
          {active === "braindump" && <Braindump />}
          {active === "knowledge-graph" && <KnowledgeGraph />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
