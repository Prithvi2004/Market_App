import { useEffect, useState } from "react";
import { useIndices, useGainers, useLosers } from "../api/market.js";
import { useStore } from "../store/useStore.js";
import {
  formatINR,
  formatPct,
  colorClass,
  formatIndianNumber,
} from "../utils/formatters.js";

// ─── Index Tile ───────────────────────────────────────────────────────────────
function IndexTile({ q }) {
  const isPos = q.change_pct > 0;
  const isNeg = q.change_pct < 0;
  const accentColor = isPos ? "#10b981" : isNeg ? "#f43f5e" : "#64748b";

  return (
    <div
      className="glass-card p-4 animate-fade-in transition-all duration-200 hover:scale-[1.02] cursor-default"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Index name */}
      <div className="text-[10px] uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}88`,
          }}
        />
        {q.name}
      </div>

      {/* Price */}
      <div className="text-xl font-bold text-slate-100 tabular-nums">
        {formatINR(q.price)}
      </div>

      {/* Change */}
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-sm font-semibold tabular-nums ${colorClass(q.change_pct)}`}>
          {formatPct(q.change_pct)}
        </span>
        {q.stale && (
          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 rounded border border-amber-500/20">
            stale
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Mover Row ────────────────────────────────────────────────────────────────
function MoverRow({ q, rank, isGainer }) {
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const barWidth = Math.min(100, Math.abs(q.change_pct ?? 0) * 10);
  const sym = q.symbol?.replace(".NS", "").replace(".BO", "");

  return (
    <tr
      onClick={() => setSelectedSymbol(q.symbol)}
      className="group cursor-pointer border-t border-[rgba(99,102,241,0.05)] hover:bg-white/[0.025] transition-colors duration-100"
    >
      {/* Symbol + name */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted w-4 text-right tabular-nums shrink-0">
            {rank}
          </span>
          <div className="min-w-0">
            <div className="font-mono text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
              {sym}
            </div>
            <div className="text-[9px] text-muted truncate max-w-[110px]">
              {q.name}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-3 py-2.5 text-right">
        <span className="text-sm font-medium text-slate-200 tabular-nums">
          {formatINR(q.price)}
        </span>
      </td>

      {/* Bar + pct */}
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Mini progress bar */}
          <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${barWidth}%`,
                background: isGainer
                  ? "linear-gradient(90deg, #064e3b, #10b981)"
                  : "linear-gradient(90deg, #4c0519, #f43f5e)",
              }}
            />
          </div>
          {/* Percentage */}
          <span
            className={`text-xs font-bold tabular-nums w-14 text-right ${
              isGainer ? "text-bull" : "text-bear"
            }`}
          >
            {isGainer ? "+" : ""}{q.change_pct?.toFixed(2)}%
          </span>
        </div>
      </td>
    </tr>
  );
}

// ─── Movers Table ─────────────────────────────────────────────────────────────
function MoversTable({ title, rows, isGainer, loading }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(99,102,241,0.07)] flex items-center gap-2">
        <span className={isGainer ? "text-bull text-sm" : "text-bear text-sm"}>
          {isGainer ? "▲" : "▼"}
        </span>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {loading && (
          <div className="ml-auto w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        )}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="text-[9px] uppercase tracking-widest text-muted">
            <th className="text-left px-3 py-2 font-medium">Stock</th>
            <th className="text-right px-3 py-2 font-medium">Price</th>
            <th className="text-right px-3 py-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows?.length
            ? rows.map((q, i) => (
                <MoverRow
                  key={q.symbol}
                  q={q}
                  rank={i + 1}
                  isGainer={isGainer}
                />
              ))
            : Array.from({ length: 7 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-t border-[rgba(99,102,241,0.05)]"
                >
                  <td colSpan={3} className="px-3 py-2.5">
                    <div className="shimmer-bg h-4 rounded w-full" />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock({ fallbackTs }) {
  const [, forceUpdate] = useState(0);
  const livePrices = useStore((s) => s.livePrices);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ts = livePrices?.indices?.[0]?.timestamp || fallbackTs;
  if (!ts) {
    return (
      <span className="text-xs text-muted flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />
        Waiting for data…
      </span>
    );
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  const remaining = Math.max(0, 60 - (elapsed % 60));
  const isFresh = elapsed < 90;

  return (
    <span className="text-xs text-muted flex items-center gap-1.5 font-mono">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isFresh ? "animate-pulse-soft bg-bull" : "bg-amber-500"
        }`}
        style={isFresh ? { boxShadow: "0 0 6px rgba(16,185,129,0.5)" } : {}}
      />
      Refresh: {remaining}s / 60s
    </span>
  );
}

// ─── Exchange Toggle ──────────────────────────────────────────────────────────
function ExchangeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
      {["NSE", "BSE"].map((ex) => (
        <button
          key={ex}
          onClick={() => onChange(ex)}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-200 ${
            value === ex
              ? "bg-accent/20 text-accent-light border border-accent/30"
              : "text-muted hover:text-slate-300"
          }`}
        >
          {ex}
        </button>
      ))}
    </div>
  );
}

// ─── Market Dashboard ─────────────────────────────────────────────────────────
export default function MarketDashboard() {
  const exchange = useStore((s) => s.exchange);
  const setExchange = useStore((s) => s.setExchange);
  const livePrices = useStore((s) => s.livePrices);

  const { data: indicesData } = useIndices();
  const { data: gainersData, isLoading: gainersLoading } = useGainers(exchange, 10);
  const { data: losersData,  isLoading: losersLoading  } = useLosers(exchange, 10);

  // Blend live WebSocket prices with React Query fallback cache data
  const indices = (livePrices?.indices?.length > 0) ? livePrices.indices : indicesData;
  
  const gainers = (exchange === "NSE" && livePrices?.gainers?.length > 0)
    ? livePrices.gainers
    : (exchange === "BSE" && livePrices?.gainers_bse?.length > 0)
    ? livePrices.gainers_bse
    : gainersData;

  const losers = (exchange === "NSE" && livePrices?.losers?.length > 0)
    ? livePrices.losers
    : (exchange === "BSE" && livePrices?.losers_bse?.length > 0)
    ? livePrices.losers_bse
    : losersData;

  return (
    <section className="space-y-4 animate-slide-up">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-100">Market Overview</h2>
        <div className="flex items-center gap-3">
          <ExchangeToggle value={exchange} onChange={setExchange} />
        </div>
      </div>

      {/* Index tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices?.length
          ? indices.map((q) => <IndexTile key={q.symbol} q={q} />)
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 space-y-2">
                <div className="shimmer-bg h-2.5 w-16 rounded" />
                <div className="shimmer-bg h-6 w-28 rounded" />
                <div className="shimmer-bg h-3 w-14 rounded" />
              </div>
            ))}
      </div>

      {/* Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MoversTable
          title="Top Gainers"
          rows={gainers}
          isGainer={true}
          loading={gainersLoading}
        />
        <MoversTable
          title="Top Losers"
          rows={losers}
          isGainer={false}
          loading={losersLoading}
        />
      </div>
    </section>
  );
}
