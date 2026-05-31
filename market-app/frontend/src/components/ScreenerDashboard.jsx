import { useState, useMemo } from "react";
import { useScreenerAlerts } from "../api/market.js";
import { useStore } from "../store/useStore.js";
import { formatPct, formatINR } from "../utils/formatters.js";

const FILTER_OPTIONS = [
  { id: "all", label: "All Breakouts", icon: "🔍" },
  { id: "bullish", label: "Bullish Signals", icon: "📈" },
  { id: "bearish", label: "Bearish Signals", icon: "📉" },
  { id: "Pattern", label: "Candlestick Patterns", icon: "🕯️" },
  { id: "Breakout", label: "Indicator Breakouts", icon: "⚡" },
];

export default function ScreenerDashboard() {
  const { data: alerts, isLoading, refetch, isRefetching } = useScreenerAlerts();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  const setAnalysisSymbol = useStore((s) => s.setAnalysisSymbol);
  const setAnalysisOpen = useStore((s) => s.setAnalysisOpen);

  const stats = useMemo(() => {
    if (!alerts) return { total: 0, bull: 0, bear: 0, neut: 0 };
    let bull = 0, bear = 0, neut = 0;
    alerts.forEach((a) => {
      a.signals.forEach((s) => {
        if (s.direction === "bullish") bull++;
        else if (s.direction === "bearish") bear++;
        else neut++;
      });
    });
    return { total: alerts.length, bull, bear, neut };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts
      .map((a) => {
        // Filter signals inside each stock card
        const matchedSignals = a.signals.filter((s) => {
          if (filter === "all") return true;
          if (filter === "bullish") return s.direction === "bullish";
          if (filter === "bearish") return s.direction === "bearish";
          return s.type === filter;
        });
        return { ...a, signals: matchedSignals };
      })
      .filter((a) => a.signals.length > 0)
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          a.symbol.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.sector.toLowerCase().includes(q)
        );
      });
  }, [alerts, filter, search]);

  function openAnalysis(symbol) {
    setAnalysisSymbol(symbol);
    setAnalysisOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[rgba(212,150,58,0.18)] px-5 py-5"
        style={{
          background:
            "linear-gradient(135deg, #0b0b09 0%, #0e0f14 60%, #0b0b09 100%)",
          boxShadow: "0 0 60px rgba(212,150,58,0.04) inset",
        }}
      >
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                Algorithmic Scanner
              </span>
              <span className="text-[9px] text-muted font-mono">
                Real-time technical screener
              </span>
            </div>
            <h1
              className="text-2xl font-black text-slate-100 leading-tight mb-1"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Technical{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #d4963a, #f0c56a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Breakouts Screener
              </span>
            </h1>
            <p className="text-[11px] text-muted">
              Scanning NIFTY 50 for candlestick patterns, EMA crossovers, and RSI swings
            </p>
          </div>

          {/* Stats counts */}
          {!isLoading && alerts && (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Bullish</div>
                <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">{stats.bull}</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-center">
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Bearish</div>
                <div className="text-sm font-extrabold text-rose-400 font-mono mt-0.5">{stats.bear}</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Neutral</div>
                <div className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">{stats.neut}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control panel (Filters + Search + Refresh) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[rgba(17,17,16,0.3)] p-2 rounded-xl border border-[rgba(212,150,58,0.06)]">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`shrink-0 text-[11px] px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 border font-semibold ${
                filter === opt.id
                  ? "bg-[rgba(212,150,58,0.12)] text-[#d4963a] border-[rgba(212,150,58,0.25)]"
                  : "text-muted hover:text-slate-200 border-transparent hover:bg-white/[0.02]"
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark !min-h-[36px] !py-1 !px-3 font-semibold text-xs"
          />
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-[rgba(212,150,58,0.15)] text-[#7a7060] hover:text-[#d4963a] hover:border-[rgba(212,150,58,0.35)] disabled:opacity-40 transition-all font-semibold"
          >
            {isRefetching ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="shimmer-bg h-4 w-1/3 rounded" />
                <div className="shimmer-bg h-4 w-1/5 rounded" />
              </div>
              <div className="shimmer-bg h-3 w-3/4 rounded" />
              <div className="shimmer-bg h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : !filteredAlerts.length ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(212,150,58,0.06)] border border-[rgba(212,150,58,0.1)] flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-sm font-semibold text-slate-400 mb-1">
            No breakouts found
          </p>
          <p className="text-xs text-muted">
            Try choosing a different signal filter or check your query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAlerts.map((card) => {
            const isPos = card.change_pct >= 0;
            return (
              <div
                key={card.symbol}
                className="glass-card flex flex-col justify-between hover:border-[rgba(212,150,58,0.22)] transition-all duration-200 group overflow-hidden relative"
              >
                <div className="p-4 space-y-3">
                  {/* Symbol Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-mono text-sm font-black text-slate-100 flex items-center gap-1.5">
                        {card.symbol.replace(".NS", "")}
                        <span className="text-[9px] text-[#7a7060] font-sans font-medium uppercase px-1.5 py-0.5 rounded bg-[rgba(212,150,58,0.06)] border border-[rgba(212,150,58,0.1)]">
                          {card.sector}
                        </span>
                      </h3>
                      <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{card.name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-100">{formatINR(card.price)}</div>
                      <div className={`text-[10px] font-mono font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPos ? "+" : ""}{card.change_pct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Signals List */}
                  <div className="space-y-1.5 pt-1 border-t border-[rgba(255,255,255,0.04)]">
                    {card.signals.map((sig, idx) => {
                      const isBull = sig.direction === "bullish";
                      const isBear = sig.direction === "bearish";
                      const color = isBull ? "text-emerald-400 border-emerald-500/15 bg-emerald-500/5" : isBear ? "text-rose-400 border-rose-500/15 bg-rose-500/5" : "text-amber-400 border-amber-500/15 bg-amber-500/5";
                      
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-[10.5px] ${color}`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>{sig.name}</span>
                            <span className="uppercase text-[8px] font-black tracking-widest">{sig.direction}</span>
                          </div>
                          <p className="opacity-75 text-[9.5px] mt-0.5 leading-relaxed">{sig.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inspect button */}
                <button
                  onClick={() => openAnalysis(card.symbol)}
                  className="w-full py-2.5 bg-[rgba(212,150,58,0.04)] border-t border-[rgba(212,150,58,0.08)] hover:bg-[rgba(212,150,58,0.1)] transition-colors text-center text-[10.5px] font-bold text-muted hover:text-[#d4963a] flex items-center justify-center gap-1 font-mono tracking-wide"
                >
                  ⚡ ANALYZE STOCK ⚡
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
