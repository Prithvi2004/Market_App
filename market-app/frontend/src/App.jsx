import { useEffect, useRef, useState } from "react";
import { useStore } from "./store/useStore.js";
import { useStatus, useGainers } from "./api/market.js";
import MarketDashboard from "./components/MarketDashboard.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import StockDetail from "./components/StockDetail.jsx";
import SectorHeatmap from "./components/SectorHeatmap.jsx";
import SearchBar from "./components/SearchBar.jsx";
import TickerTape from "./components/TickerTape.jsx";
import ImpactAnalyzer from "./components/ImpactAnalyzer.jsx";
import PortfolioTracker from "./components/PortfolioTracker.jsx";
import AnalysisTerminal from "./components/AnalysisTerminal.jsx";
import PatternGuide from "./components/PatternGuide.jsx";

// ─── WebSocket hook for live prices ───────────────────────────────────────────
function useLivePricesWS() {
  const setLivePrices = useStore((s) => s.setLivePrices);
  const backoff = useRef(1000);

  useEffect(() => {
    let ws;
    let stopped = false;

    function connect() {
      const wsBase = import.meta.env.VITE_WS_URL
        ? import.meta.env.VITE_WS_URL
        : import.meta.env.DEV
          ? "ws://127.0.0.1:8000"
          : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
      const wsUrl = `${wsBase.replace(/\/$/, "")}/ws/prices`;
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        backoff.current = 1000;
      };
      ws.onmessage = (e) => {
        try {
          setLivePrices(JSON.parse(e.data));
        } catch {}
      };
      ws.onclose = () => {
        if (stopped) return;
        setTimeout(connect, backoff.current);
        backoff.current = Math.min(30_000, backoff.current * 2);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      stopped = true;
      try {
        ws?.close();
      } catch {}
    };
  }, [setLivePrices]);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "markets", label: "Markets", icon: "📈" },
  { id: "sectors", label: "Sectors", icon: "🗺️" },
  { id: "guide", label: "Guide", icon: "📖" },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useLivePricesWS();

  const { data: status } = useStatus();
  const { data: gainers50Data } = useGainers("NSE", 50);
  const livePrices = useStore((s) => s.livePrices);

  const gainers50 =
    livePrices?.gainers?.length > 0 ? livePrices.gainers : gainers50Data;

  const setMarketStatus = useStore((s) => s.setMarketStatus);
  const impactOpen = useStore((s) => s.impactOpen);
  const portfolioOpen = useStore((s) => s.portfolioOpen);
  const setImpactOpen = useStore((s) => s.setImpactOpen);
  const setPortfolioOpen = useStore((s) => s.setPortfolioOpen);

  const analysisParams = new URLSearchParams(window.location.search);
  const analysisFlag = analysisParams.get("analysis");
  const analysisSymbol = analysisParams.get("symbol");
  const isAnalysisPage =
    analysisFlag === "1" ||
    analysisFlag === "true" ||
    window.location.pathname === "/analysis";

  useEffect(() => {
    if (isAnalysisPage) {
      // eslint-disable-next-line no-console
      console.info("[App] analysis page detected", {
        href: window.location.href,
        analysisFlag,
        analysisSymbol,
        pathname: window.location.pathname,
        isAnalysisPage,
      });
    }
  }, [isAnalysisPage, analysisFlag, analysisSymbol]);

  const [activeTab, setActiveTab] = useState("markets");
  const [newsFeedMinimized, setNewsFeedMinimized] = useState(false);

  useEffect(() => {
    if (status?.market_status) setMarketStatus(status.market_status);
  }, [status, setMarketStatus]);

  const isOpen = status?.is_open;
  const marketLabel = status?.market_status ?? "…";

  if (isAnalysisPage) {
    return (
      <div className="min-h-screen max-h-screen flex flex-col bg-ink overflow-hidden">
        {/* Status Banner */}
        <div className="px-4 py-2 text-[11px] text-muted border-b border-[rgba(99,102,241,0.08)] bg-[rgba(99,102,241,0.04)] flex items-center justify-between">
          <div>
            <span className="font-semibold text-accent">📊 Analysis Mode</span>
            {" · "}
            <span>symbol: {analysisSymbol || <span className="text-red-400">NONE (check URL)</span>}</span>
            {" · "}
            <span className="text-slate-400 text-[10px]">Check DevTools console for logs</span>
          </div>
        </div>
        {/* Terminal Container - takes remaining height */}
        <div className="flex-1 overflow-hidden bg-ink">
          <AnalysisTerminal symbolOverride={analysisSymbol} standalone={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-ink">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 glass-card rounded-none border-t-0 border-l-0 border-r-0">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-glow-accent"
              style={{
                background: "linear-gradient(135deg, #312e81, #6366f1)",
              }}
            >
              ₹
            </div>
            <div>
              <h1 className="text-sm font-bold gradient-text leading-none tracking-tight">
                MarketPulse
              </h1>
              <div className="text-[10px] text-muted leading-tight">
                NSE · BSE · AI
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-slate-800" />

          {/* Nav tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-accent/15 text-accent-light border border-accent/25"
                    : "text-muted hover:text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Market status pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
              isOpen
                ? "bg-bull/10 text-bull border-bull/20"
                : "bg-slate-800/80 text-muted border-slate-700"
            }`}
          >
            {isOpen ? (
              <span className="live-dot" />
            ) : (
              <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
            )}
            <span className="capitalize">{marketLabel}</span>
          </div>

          {/* Portfolio button */}
          <button
            onClick={() => setPortfolioOpen(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <span>💼</span>
            <span className="hidden sm:inline">Portfolio</span>
          </button>

          {/* Impact button */}
          <button
            onClick={() => setImpactOpen(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Impact</span>
          </button>

          {/* Search */}
          <SearchBar />
        </div>
      </header>

      {/* ── Ticker tape ─────────────────────────────────────── */}
      <TickerTape data={gainers50 || []} />

      {/* ── Main layout ─────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto w-full px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 relative">
        {/* Left / center column */}
        <div className={`${newsFeedMinimized ? "lg:col-span-3" : "lg:col-span-2"} space-y-4 transition-all duration-300`}>
          {activeTab === "markets" && <MarketDashboard />}
          {activeTab === "sectors" && <SectorHeatmap />}
          {activeTab === "guide" && <PatternGuide />}
        </div>

        {/* Right column — sticky news feed */}
        {!newsFeedMinimized && (
          <div className="lg:col-span-1 lg:sticky lg:top-[4.5rem] h-[calc(100vh-5.5rem)] animate-fade-in">
            <NewsFeed onMinimize={() => setNewsFeedMinimized(true)} />
          </div>
        )}

        {/* Floating Restore News Button — bottom-right corner tab, non-blocking */}
        {newsFeedMinimized && (
          <button
            onClick={() => setNewsFeedMinimized(false)}
            title="Expand News Feed"
            className="fixed bottom-6 right-4 flex items-center gap-2 bg-slate-900/95 backdrop-blur-sm border border-[rgba(99,102,241,0.30)] hover:border-indigo-500/60 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-indigo-300 shadow-2xl z-40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group"
          >
            <span className="text-sm">📰</span>
            <span className="uppercase tracking-wider text-[10px]">News Feed</span>
            <span className="text-indigo-500 group-hover:text-indigo-300 transition-colors">⟪</span>
          </button>
        )}
      </main>

      {/* ── Overlays ────────────────────────────────────────── */}
      <StockDetail />
      {impactOpen && <ImpactAnalyzer />}
      {portfolioOpen && <PortfolioTracker />}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(99,102,241,0.08)] py-2.5">
        <div className="max-w-[1600px] mx-auto px-4 text-[10px] text-muted flex items-center justify-between">
          <span>MarketPulse · Local-first · LLM via Ollama</span>
          <span className="text-rose-600/60 font-medium">
            Not financial advice
          </span>
        </div>
      </footer>
    </div>
  );
}
