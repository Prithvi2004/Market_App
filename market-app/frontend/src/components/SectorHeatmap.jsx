import { useState } from "react";
import { useStore } from "../store/useStore.js";
import { useSectors } from "../api/market.js";

// ─── Color logic ──────────────────────────────────────────────────────────────
function shade(pct) {
  if (pct == null) pct = 0;
  const v = Math.min(1, Math.abs(pct) / 4);

  if (pct > 0.3) {
    return {
      background: `rgba(16,185,129,${0.07 + v * 0.22})`,
      borderColor: `rgba(16,185,129,${0.12 + v * 0.38})`,
      color: pct > 2 ? "#6ee7b7" : "#10b981",
    };
  }
  if (pct < -0.3) {
    return {
      background: `rgba(244,63,94,${0.07 + v * 0.22})`,
      borderColor: `rgba(244,63,94,${0.12 + v * 0.38})`,
      color: pct < -2 ? "#fda4af" : "#f43f5e",
    };
  }
  return {
    background: "rgba(30,41,59,0.45)",
    borderColor: "rgba(99,102,241,0.1)",
    color: "#64748b",
  };
}

const SECTOR_ICONS = {
  IT:             "💻",
  Banking:        "🏦",
  Pharma:         "💊",
  Auto:           "🚗",
  Energy:         "⚡",
  FMCG:           "🛒",
  Metals:         "⚙️",
  Financial:      "💰",
  Telecom:        "📡",
  Infrastructure: "🏗️",
  Cement:         "🏭",
  Insurance:      "🛡️",
  Healthcare:     "🏥",
  Consumer:       "🎁",
  Conglomerate:   "🏢",
  Chemicals:      "🧪",
};

// ─── Sector Card ──────────────────────────────────────────────────────────────
function SectorCard({ s, isSelected, onClick }) {
  const st = shade(s.avg_change_pct);
  const icon = SECTOR_ICONS[s.sector] || "📈";
  const pct = s.avg_change_pct ?? 0;

  return (
    <button
      style={st}
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-left border transition-all duration-200 hover:scale-[1.04] hover:shadow-lg active:scale-[0.98] ${
        isSelected ? "ring-2 ring-accent/50 ring-offset-1 ring-offset-ink" : ""
      }`}
    >
      <div className="text-lg mb-1 leading-none">{icon}</div>
      <div className="text-[10px] uppercase tracking-wide font-medium opacity-75 truncate">
        {s.sector}
      </div>
      <div
        className="text-sm font-bold mt-0.5 tabular-nums"
        style={{ color: st.color }}
      >
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </div>
      <div className="text-[9px] opacity-50 mt-0.5">{s.count ?? "—"} stocks</div>
    </button>
  );
}

// ─── Sector Heatmap ───────────────────────────────────────────────────────────
export default function SectorHeatmap() {
  const { data, isLoading } = useSectors();
  const setSectorFilter = useStore((s) => s.setSectorFilter);
  const setNewsFilter   = useStore((s) => s.setNewsFilter);
  const sectorFilter    = useStore((s) => s.sectorFilter);

  function handleClick(sector) {
    const next = sectorFilter === sector ? null : sector;
    setSectorFilter(next);
    setNewsFilter(next ? "sector" : "all");
  }

  // Sort by change (desc)
  const sorted = data
    ? [...data].sort((a, b) => (b.avg_change_pct ?? 0) - (a.avg_change_pct ?? 0))
    : [];

  // Breadth stats
  const bullCount = sorted.filter((s) => (s.avg_change_pct ?? 0) > 0).length;
  const bearCount = sorted.filter((s) => (s.avg_change_pct ?? 0) < 0).length;
  const total     = sorted.length || 1;
  const bullPct   = (bullCount / total) * 100;

  return (
    <section className="glass-card p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Sector Heatmap</h2>
          {isLoading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          )}
        </div>
        <span className="text-[10px] text-muted">Click to filter news</span>
      </div>

      {/* Breadth bar */}
      {sorted.length > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[10px] text-muted">
            <span className="text-bull">▲ {bullCount} advancing</span>
            <span className="text-bear">{bearCount} declining ▼</span>
          </div>
          <div className="h-1.5 bg-bear/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-bull rounded-full transition-all duration-700"
              style={{ width: `${bullPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Sector grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {sorted.length
          ? sorted.map((s) => (
              <SectorCard
                key={s.sector}
                s={s}
                isSelected={sectorFilter === s.sector}
                onClick={() => handleClick(s.sector)}
              />
            ))
          : Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[rgba(99,102,241,0.1)] p-3 space-y-2"
              >
                <div className="shimmer-bg h-2.5 w-10 rounded" />
                <div className="shimmer-bg h-4 w-14 rounded" />
              </div>
            ))}
      </div>

      {/* Active filter pill */}
      {sectorFilter && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Filtering:</span>
          <button
            onClick={() => handleClick(sectorFilter)}
            className="flex items-center gap-1.5 text-xs bg-accent/15 text-accent-light border border-accent/25 px-2 py-0.5 rounded-full hover:bg-accent/25 transition-colors"
          >
            {SECTOR_ICONS[sectorFilter] || "📈"} {sectorFilter}
            <span className="text-accent/60 ml-0.5">×</span>
          </button>
        </div>
      )}
    </section>
  );
}
