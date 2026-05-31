import { useEffect, useRef, useState } from "react";
import { useStore } from "./store/useStore.js";
import { useStatus, useGainers, useCategoryCount } from "./api/market.js";
import { useNewsByCategory } from "./api/news.js";
import { NEWS_CATEGORIES } from "./utils/constants.js";
import { relativeTime } from "./utils/formatters.js";
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

// ─── WebSocket hook ───────────────────────────────────────────────────────────
function useLivePricesWS() {
  const setLivePrices = useStore((s) => s.setLivePrices);
  const backoff = useRef(1000);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    let ws = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      const wsBase = import.meta.env.VITE_WS_URL
        ? import.meta.env.VITE_WS_URL
        : import.meta.env.DEV
          ? "ws://127.0.0.1:8000"
          : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
      ws = new WebSocket(`${wsBase.replace(/\/$/, "")}/ws/prices`);
      ws.onopen = () => {
        backoff.current = 1000;
      };
      ws.onmessage = (e) => {
        try {
          setLivePrices(JSON.parse(e.data));
        } catch {}
      };
      ws.onclose = () => {
        ws = null;
        if (stopped) return;
        reconnectTimer.current = setTimeout(() => {
          backoff.current = Math.min(30_000, backoff.current * 2);
          connect();
        }, backoff.current);
      };
      ws.onerror = () => {};
    }

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
    };
  }, [setLivePrices]);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "markets", label: "Markets", icon: "📈" },
  { id: "news", label: "News", icon: "📰" },
  { id: "sectors", label: "Sectors", icon: "🗺️" },
  { id: "guide", label: "Guide", icon: "📖" },
];

// ─── Sentiment badge config ───────────────────────────────────────────────────
const SENT = {
  positive: {
    dot: "#10b981",
    border: "rgba(16,185,129,0.28)",
    label: "BULL",
    color: "#10b981",
  },
  negative: {
    dot: "#f43f5e",
    border: "rgba(244,63,94,0.28)",
    label: "BEAR",
    color: "#f43f5e",
  },
  neutral: {
    dot: "#64748b",
    border: "rgba(100,116,139,0.18)",
    label: "NEU",
    color: "#64748b",
  },
};

// ─── Full-width News Page (desktop) ──────────────────────────────────────────
function FullWidthNewsFeed() {
  const newsFilter = useStore((s) => s.newsFilter);
  const setNewsFilter = useStore((s) => s.setNewsFilter);
  const sectorFilter = useStore((s) => s.sectorFilter);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const setImpactOpen = useStore((s) => s.setImpactOpen);
  const setImpactHeadline = useStore((s) => s.setImpactHeadline);
  const setImpactSummary = useStore((s) => s.setImpactSummary);

  const limit = 80;
  const sectorParam = newsFilter === "sector" ? sectorFilter : null;
  const { data, isLoading } = useNewsByCategory(newsFilter, limit, sectorParam);
  const { data: counts } = useCategoryCount();
  const [showAll, setShowAll] = useState(false);

  const articles = showAll ? data : data?.slice(0, 40);

  function handleImpact(a) {
    setImpactHeadline(a.title);
    setImpactSummary(a.summary ?? "");
    setImpactOpen(true);
  }

  /* Sentiment summary */
  const pos = data?.filter((a) => a.sentiment_label === "positive").length || 0;
  const neg = data?.filter((a) => a.sentiment_label === "negative").length || 0;
  const neu = (data?.length || 0) - pos - neg;
  const total = data?.length || 0;

  return (
    <div className="space-y-4">
      {/* ── Page hero header */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[rgba(212,150,58,0.18)] px-5 py-5"
        style={{
          background:
            "linear-gradient(135deg, #0b0b09 0%, #0e0f14 60%, #0b0b09 100%)",
          boxShadow: "0 0 60px rgba(212,150,58,0.04) inset",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 opacity-[0.035] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #d4963a 0%, transparent 65%)",
            transform: "translate(35%,-35%)",
          }}
        />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border"
                style={{
                  background: "rgba(212,150,58,0.1)",
                  color: "#d4963a",
                  borderColor: "rgba(212,150,58,0.25)",
                }}
              >
                Market Intelligence
              </span>
              {data?.length > 0 && (
                <span className="text-[9px] text-muted font-mono">
                  {data.length} stories collected
                </span>
              )}
            </div>
            <h1
              className="text-2xl font-black text-slate-100 leading-tight mb-1"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Today&apos;s{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #d4963a, #f0c56a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Market News
              </span>
            </h1>
            <p className="text-[11px] text-muted">
              NSE · BSE · Global markets · FII/DII flows · Economy · Sectors
            </p>
          </div>

          {/* Sentiment meter */}
          {total > 0 && (
            <div className="shrink-0 min-w-[180px]">
              <div className="text-[9px] text-muted uppercase tracking-widest mb-1.5 font-bold">
                Sentiment Overview
              </div>
              <div className="flex gap-px h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500/60 transition-all duration-700"
                  style={{ width: `${((pos / total) * 100).toFixed(0)}%` }}
                />
                <div
                  className="bg-slate-600/40 transition-all duration-700"
                  style={{ width: `${((neu / total) * 100).toFixed(0)}%` }}
                />
                <div
                  className="bg-rose-500/60 transition-all duration-700"
                  style={{ width: `${((neg / total) * 100).toFixed(0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-emerald-500/70 font-semibold">
                  {pos} bullish
                </span>
                <span className="text-muted">{neu} neutral</span>
                <span className="text-rose-500/70 font-semibold">
                  {neg} bearish
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {NEWS_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setNewsFilter(c.id);
              setShowAll(false);
            }}
            className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 border font-semibold ${
              newsFilter === c.id
                ? "bg-[rgba(212,150,58,0.12)] text-[#d4963a] border-[rgba(212,150,58,0.25)]"
                : "text-muted hover:text-slate-200 border-transparent hover:border-[rgba(212,150,58,0.12)] hover:bg-white/[0.02]"
            }`}
          >
            {c.label}
            {counts?.[c.id] != null && (
              <span className="text-[9px] opacity-50 tabular-nums">
                ({counts[c.id]})
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setImpactOpen(true)}
          className="ml-auto shrink-0 text-[10px] px-3 py-1.5 rounded-full border border-[rgba(212,150,58,0.15)] text-[#d4963a] hover:bg-[rgba(212,150,58,0.08)] transition-all font-semibold flex items-center gap-1"
        >
          ⚡ AI Impact
        </button>
      </div>

      {/* ── Article grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-2.5 animate-pulse">
              <div className="shimmer-bg h-4 w-full rounded" />
              <div className="shimmer-bg h-4 w-4/5 rounded" />
              <div className="shimmer-bg h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : !articles?.length ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(212,150,58,0.06)] border border-[rgba(212,150,58,0.1)] flex items-center justify-center mb-4">
            <span className="text-2xl">📰</span>
          </div>
          <p className="text-sm font-semibold text-slate-400 mb-1">
            No articles yet
          </p>
          <p className="text-xs text-muted">
            First pull runs at startup — check back in a moment.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {articles.map((a) => {
              const s = SENT[a.sentiment_label] ?? SENT.neutral;
              return (
                <article
                  key={a.id}
                  className="glass-card group hover:border-[rgba(212,150,58,0.2)] transition-all duration-200 overflow-hidden"
                  style={{ borderLeft: `3px solid ${s.border}` }}
                >
                  <div className="p-4">
                    {/* Title + sentiment */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0 mt-1.5"
                        style={{
                          background: s.dot,
                          boxShadow: `0 0 6px ${s.dot}66`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <h3 className="text-[13px] font-semibold text-slate-200 line-clamp-2 group-hover:text-[#f0c56a] transition-colors leading-snug tracking-[-0.01em]">
                            {a.title}
                          </h3>
                        </a>
                        {/* Summary */}
                        {a.summary && (
                          <p className="text-[11px] text-muted line-clamp-2 mt-1 leading-relaxed">
                            {a.summary}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded border mt-0.5"
                        style={{
                          color: s.color,
                          background: `${s.dot}14`,
                          borderColor: `${s.dot}30`,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted flex-wrap ml-4.5">
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-black shrink-0"
                        style={{
                          background: "rgba(212,150,58,0.1)",
                          color: "#d4963a",
                          border: "1px solid rgba(212,150,58,0.18)",
                        }}
                      >
                        {(a.source || "?")[0].toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-500">
                        {a.source}
                      </span>
                      <span className="text-[#2a2826]">·</span>
                      <span>{relativeTime(a.published_at)}</span>
                      {a.category && (
                        <>
                          <span className="text-[#2a2826]">·</span>
                          <span className="bg-[rgba(212,150,58,0.06)] border border-[rgba(212,150,58,0.1)] text-[#7a7060] px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wide font-semibold">
                            {a.category}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Tickers + impact */}
                    {a.tickers?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1 ml-4.5">
                        {a.tickers.slice(0, 5).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedSymbol(t)}
                            className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-accent/8 text-[#d4963a] border border-accent/15 hover:bg-accent/18 transition-colors"
                          >
                            {t.replace(".NS", "").replace(".BO", "")}
                          </button>
                        ))}
                        <button
                          onClick={() => handleImpact(a)}
                          className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/18 hover:text-amber-300 transition-all"
                        >
                          ⚡ Impact
                        </button>
                      </div>
                    )}
                    {!a.tickers?.length && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleImpact(a)}
                          className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/18 hover:text-amber-300 transition-all"
                        >
                          ⚡ Impact
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Load more */}
          {!showAll && data.length > 40 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3.5 glass-card hover:border-[rgba(212,150,58,0.2)] transition-all text-[12px] font-semibold text-muted hover:text-[#d4963a] flex items-center justify-center gap-2"
            >
              <span>↓</span>
              Load {data.length - 40} more stories
            </button>
          )}
          {showAll && data.length > 40 && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-3 text-[11px] text-muted hover:text-[#d4963a] transition-colors flex items-center justify-center gap-1.5"
            >
              ↑ Show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Mobile Search Overlay ───────────────────────────────────────────────────
function MobileSearchOverlay({ onClose }) {
  return (
    <div
      className="mobile-search-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center gap-3 pt-4 pb-3">
        <div className="flex-1">
          <SearchBar autoFocus onResultPicked={onClose} />
        </div>
        <button
          onClick={onClose}
          className="text-sm text-[#7a7060] hover:text-[#ede8df] px-2 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── News restore pill ────────────────────────────────────────────────────────
function NewsRestoreBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Expand News Feed"
      className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group animate-fade-in"
      style={{
        background: "rgba(17,17,16,0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(212,150,58,0.28)",
        color: "#7a7060",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <span className="text-sm">📰</span>
      <span className="uppercase tracking-wider text-[10px] group-hover:text-[#d4963a] transition-colors">
        News Feed
      </span>
      <span className="text-[#d4963a]">⟪</span>
    </button>
  );
}

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

  const params = new URLSearchParams(window.location.search);
  const analysisFlag = params.get("analysis");
  const analysisSymbol = params.get("symbol");
  const isAnalysisPage =
    analysisFlag === "1" ||
    analysisFlag === "true" ||
    window.location.pathname === "/analysis";

  const [activeTab, setActiveTab] = useState("markets");
  const [mobileSearchOpen, setMobileSearch] = useState(false);
  const [newsCollapsed, setNewsCollapsed] = useState(false);

  useEffect(() => {
    if (status?.market_status) setMarketStatus(status.market_status);
  }, [status, setMarketStatus]);

  const isOpen = status?.is_open;
  const marketLabel = status?.market_status ?? "…";

  // ── Analysis page — full-screen terminal
  if (isAnalysisPage) {
    return (
      <div className="min-h-screen max-h-screen flex flex-col bg-ink overflow-hidden">
        <div className="px-4 py-2 text-[11px] text-[#7a7060] border-b border-[rgba(212,150,58,0.08)] bg-[rgba(212,150,58,0.03)] flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#d4963a]">📊 Analysis Mode</span>
          <span>·</span>
          <span className="text-[#b8af9e] font-mono">
            {analysisSymbol || <span className="text-red-400">no symbol</span>}
          </span>
        </div>
        <div className="flex-1 overflow-hidden bg-ink">
          <AnalysisTerminal symbolOverride={analysisSymbol} standalone={true} />
        </div>
      </div>
    );
  }

  // ── Tab content (non-news)
  const mainContent = () => {
    if (activeTab === "markets") return <MarketDashboard />;
    if (activeTab === "sectors") return <SectorHeatmap />;
    if (activeTab === "guide") return <PatternGuide />;
    return null;
  };

  // Grid cols for current state
  const gridCols =
    activeTab === "news"
      ? "md:grid-cols-1"
      : newsCollapsed || activeTab === "sectors" || activeTab === "guide"
        ? "md:grid-cols-1"
        : "md:grid-cols-3";

  return (
    <div className="min-h-full flex flex-col bg-ink">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 glass-card rounded-none border-t-0 border-l-0 border-r-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5 xs:gap-2 shrink-0 min-w-0">
            <img
              src="/logo.png"
              alt="MarketPulse Logo"
              className="w-8 h-8 rounded-lg shadow-amber-md object-cover shrink-0"
            />
            <div className="block min-w-0">
              <h1
                className="text-sm font-bold gradient-text leading-none whitespace-nowrap"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  letterSpacing: "-0.01em",
                }}
              >
                MarketPulse
              </h1>
              <div
                className="text-[8px] text-[#4a4540] leading-tight tracking-widest uppercase whitespace-nowrap"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                NSE · BSE · AI
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block w-px h-5 bg-[rgba(212,150,58,0.12)] mx-1" />
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[rgba(212,150,58,0.12)] text-[#d4963a] border border-[rgba(212,150,58,0.25)]"
                    : "text-[#7a7060] hover:text-[#ede8df] hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Market status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 shrink-0 ${
              isOpen
                ? "bg-bull/10 text-bull border-bull/20"
                : "bg-[#111110]/80 text-[#7a7060] border-[rgba(212,150,58,0.12)]"
            }`}
          >
            {isOpen ? (
              <span className="live-dot" />
            ) : (
              <span className="inline-block w-2 h-2 rounded-full bg-[#333]" />
            )}
            <span className="capitalize">{marketLabel}</span>
          </div>

          {/* Mobile search */}
          <button
            onClick={() => setMobileSearch(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#7a7060] hover:text-[#ede8df] hover:bg-white/[0.05] transition-colors"
            aria-label="Search"
          >
            🔍
          </button>

          {/* Desktop search */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* News sidebar toggle (only on markets tab) */}
          {activeTab === "markets" && (
            <button
              onClick={() => setNewsCollapsed((v) => !v)}
              title={newsCollapsed ? "Show News" : "Hide News"}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(212,150,58,0.15)] text-[#7a7060] hover:text-[#d4963a] hover:border-[rgba(212,150,58,0.35)] transition-all duration-200"
              style={{ fontSize: 14 }}
            >
              {newsCollapsed ? "⟫" : "⟪"}
            </button>
          )}

          <button
            onClick={() => setPortfolioOpen(true)}
            className="hidden sm:flex btn-ghost text-xs items-center gap-1.5 !min-h-[36px] !py-1.5"
          >
            <span>💼</span>
            <span className="hidden lg:inline">Portfolio</span>
          </button>
          <button
            onClick={() => setImpactOpen(true)}
            className="btn-primary text-xs !min-h-[36px] !py-1.5 !px-3"
          >
            <span>⚡</span>
            <span className="hidden sm:inline ml-1">Impact</span>
          </button>
        </div>
      </header>

      {/* ── Ticker tape ──────────────────────────────────────────────── */}
      <TickerTape data={gainers50 || []} />

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main
        className={`max-w-[1600px] mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex-1 pb-[calc(var(--bottom-nav-h)+1rem)] md:pb-4 md:grid md:gap-4 ${gridCols}`}
      >
        {/* NEWS TAB — full width, own layout */}
        {activeTab === "news" && (
          <div className="md:col-span-1">
            {/* Mobile: compact feed */}
            <div className="block md:hidden">
              <NewsFeed />
            </div>
            {/* Desktop: rich 2-col grid */}
            <div className="hidden md:block">
              <FullWidthNewsFeed />
            </div>
          </div>
        )}

        {/* NON-NEWS main column */}
        {activeTab !== "news" && (
          <div
            className={`space-y-4 ${
              newsCollapsed || activeTab === "sectors" || activeTab === "guide"
                ? "md:col-span-1"
                : "md:col-span-2"
            }`}
          >
            {mainContent()}
          </div>
        )}

        {/* Markets tab: sticky news sidebar */}
        {activeTab === "markets" && !newsCollapsed && (
          <div className="hidden md:block md:col-span-1 md:sticky md:top-[4.5rem] md:h-[calc(100vh-5.5rem)]">
            <NewsFeed onMinimize={() => setNewsCollapsed(true)} />
          </div>
        )}
      </main>

      {/* News restore pill (when sidebar collapsed on markets) */}
      {newsCollapsed && activeTab === "markets" && (
        <NewsRestoreBtn onClick={() => setNewsCollapsed(false)} />
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav
        className="mobile-bottom-nav md:hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mobile-nav-btn ${activeTab === tab.id ? "active" : ""}`}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <span className="mobile-nav-btn-icon">{tab.icon}</span>
            <span className="mobile-nav-btn-label">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setPortfolioOpen(true)}
          className="mobile-nav-btn"
          aria-label="Portfolio"
        >
          <span className="mobile-nav-btn-icon">💼</span>
          <span className="mobile-nav-btn-label">Portfolio</span>
        </button>
      </nav>

      {mobileSearchOpen && (
        <MobileSearchOverlay onClose={() => setMobileSearch(false)} />
      )}

      <StockDetail />
      {impactOpen && <ImpactAnalyzer />}
      {portfolioOpen && <PortfolioTracker />}

      <footer className="hidden md:block border-t border-[rgba(212,150,58,0.08)] py-2">
        <div
          className="max-w-[1600px] mx-auto px-4 text-[10px] text-[#7a7060] flex items-center justify-between"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          <span>MarketPulse · NSE/BSE · AI via Ollama</span>
          <span className="text-rose-600/50 font-medium">
            Not financial advice
          </span>
        </div>
      </footer>
    </div>
  );
}
