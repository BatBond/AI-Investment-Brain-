"use client";

import { useEffect, useRef } from "react";

type WidgetType =
  | "advanced-chart"
  | "market-overview"
  | "ticker-tape"
  | "symbol-info"
  | "mini-symbol-overview";

interface TradingViewWidgetProps {
  symbol?: string; // e.g. "NASDAQ:AAPL"
  type?: WidgetType;
  height?: number | string;
  width?: number | string;
  theme?: "dark" | "light";
  interval?: string; // e.g. "D", "W", "60"
  studies?: string[];
  className?: string;
}

const TYPE_CONFIG: Record<
  WidgetType,
  { script: string; containerClass: string }
> = {
  "advanced-chart": {
    script: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
    containerClass: "tradingview-widget-container__widget",
  },
  "market-overview": {
    script: "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
    containerClass: "tradingview-widget-container__widget",
  },
  "ticker-tape": {
    script: "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
    containerClass: "tradingview-widget-container__widget",
  },
  "symbol-info": {
    script: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
    containerClass: "tradingview-widget-container__widget",
  },
  "mini-symbol-overview": {
    script: "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js",
    containerClass: "tradingview-widget-container__widget",
  },
};

export function TradingViewWidget({
  symbol = "NASDAQ:AAPL",
  type = "advanced-chart",
  height = 480,
  width = "100%",
  theme = "dark",
  interval = "D",
  studies = ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
  className,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // clear any previous widget
    container.innerHTML = "";

    const cfg = TYPE_CONFIG[type];
    const widgetDiv = document.createElement("div");
    widgetDiv.className = cfg.containerClass;
    widgetDiv.style.height =
      typeof height === "number" ? `${height}px` : height;
    widgetDiv.style.width = typeof width === "number" ? `${width}px` : width;
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = cfg.script;
    script.async = true;
    script.type = "text/javascript";

    const config: Record<string, unknown> = {
      colorTheme: theme,
      isTransparent: true,
      locale: "en",
      backgroundColor: "rgba(15, 23, 42, 1)",
      gridLineColor: "rgba(51, 65, 85, 0.5)",
    };

    if (type === "advanced-chart") {
      config.symbol = symbol;
      config.interval = interval;
      config.autosize = true;
      config.allow_symbol_change = true;
      config.supported_resolutions = ["60", "D", "W", "M"];
      config.studies = studies;
      config.displayValue = symbol;
    } else if (type === "symbol-info") {
      config.symbol = symbol;
    } else if (type === "mini-symbol-overview") {
      config.symbol = symbol;
      config.width = "100%";
      config.height = typeof height === "number" ? height : 220;
      config.dateRange = "3M";
      config.trendLineColor = "rgba(245, 158, 11, 1)";
      config.underLineColor = "rgba(245, 158, 11, 0.15)";
    } else if (type === "ticker-tape") {
      config.symbols = [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
        { proName: "NASDAQ:AAPL", title: "Apple" },
        { proName: "NASDAQ:NVDA", title: "NVIDIA" },
        { proName: "NASDAQ:MSFT", title: "Microsoft" },
        { proName: "NASDAQ:TSLA", title: "Tesla" },
        { proName: "NASDAQ:AMZN", title: "Amazon" },
        { proName: "NASDAQ:META", title: "Meta" },
        { proName: "NASDAQ:GOOGL", title: "Alphabet" },
      ];
      config.displayMode = "adaptive";
    } else if (type === "market-overview") {
      config.tabs = [
        {
          title: "Indices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
            { s: "FOREXCOM:DJI", d: "Dow 30" },
            { s: "INDEX:RUT", d: "Russell 2000" },
            { s: "INDEX:VIX", d: "VIX" },
          ],
        },
        {
          title: "Futures",
          symbols: [
            { s: "CME_MINI:ES1!", d: "S&P 500" },
            { s: "CME:6E1!", d: "Euro" },
            { s: "COMEX:GC1!", d: "Gold" },
            { s: "NYMEX:CL1!", d: "Crude Oil" },
            { s: "CBOT:ZB1!", d: "T-Bond" },
          ],
        },
        {
          title: "Bonds",
          symbols: [
            { s: "CBOT:ZN1!", d: "10-Yr T-Note" },
            { s: "CBOT:ZB1!", d: "30-Yr T-Bond" },
            { s: "ECONOMICS:US10Y", d: "10Y Yield" },
            { s: "ECONOMICS:US02Y", d: "2Y Yield" },
          ],
        },
      ];
      config.dateRange = "1D";
    }

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);
  }, [symbol, type, height, width, theme, interval, studies]);

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container ${className ?? ""}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
      }}
    />
  );
}
