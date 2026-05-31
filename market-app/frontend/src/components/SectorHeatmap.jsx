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
    borderColor: "rgba(212,150,58,0.1)",
    color: "#64748b",
  };
}

const SECTOR_ICONS = {
  IT: "💻",
  Banking: "🏦",
  Pharma: "💊",
  Auto: "🚗",
  Energy: "⚡",
  FMCG: "🛒",
  Metals: "⚙️",
  Financial: "💰",
  Telecom: "📡",
  Infrastructure: "🏗️",
  Cement: "🏭",
  Insurance: "🛡️",
  Healthcare: "🏥",
  Consumer: "🎁",
  Conglomerate: "🏢",
  Chemicals: "🧪",
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
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-lg leading-none">{icon}</div>
        <div className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-muted whitespace-nowrap">
          {s.count ?? "—"}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wide font-semibold opacity-80 truncate">
        {s.sector}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-muted">
        <span>{s.advance_count ?? 0} up</span>
        <span>{s.decline_count ?? 0} down</span>
      </div>
      <div
        className="text-sm font-bold mt-1 tabular-nums"
        style={{ color: st.color }}
      >
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </div>
    </button>
  );
}

function formatPrice(value) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function SectorStockRow({ stock }) {
  const pct = stock.change_pct;
  const positive = (pct ?? 0) > 0;
  const negative = (pct ?? 0) < 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(212,150,58,0.08)] bg-black/15 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-100 truncate">
          {stock.name}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted truncate">
          {stock.symbol}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-slate-100 tabular-nums">
          {formatPrice(stock.price)}
        </div>
        <div
          className={`text-[11px] font-medium tabular-nums ${positive ? "text-bull" : negative ? "text-bear" : "text-muted"}`}
        >
          {pct == null ? "pending" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
        </div>
      </div>
    </div>
  );
}

// ─── Sector Heatmap ───────────────────────────────────────────────────────────
export default function SectorHeatmap() {
  const { data, isLoading } = useSectors();
  const setSectorFilter = useStore((s) => s.setSectorFilter);
  const setNewsFilter = useStore((s) => s.setNewsFilter);
  const sectorFilter = useStore((s) => s.sectorFilter);
  const [selectedSector, setSelectedSector] = useState(null);

  function handleClick(sector) {
    const next = sectorFilter === sector ? null : sector;
    setSectorFilter(next);
    setNewsFilter(next ? "sector" : "all");
    setSelectedSector(next);
  }

  // Sort by change (desc)
  const sorted = data
    ? [...data].sort(
        (a, b) => (b.avg_change_pct ?? 0) - (a.avg_change_pct ?? 0),
      )
    : [];

  const activeSector =
    sorted.find(
      (s) => s.sector === selectedSector || s.sector === sectorFilter,
    ) || null;

  // Breadth stats
  const bullCount = sorted.filter((s) => (s.avg_change_pct ?? 0) > 0).length;
  const bearCount = sorted.filter((s) => (s.avg_change_pct ?? 0) < 0).length;
  const total = sorted.length || 1;
  const bullPct = (bullCount / total) * 100;

  return (
    <section className="glass-card p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">
            Sector Heatmap
          </h2>
          {isLoading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          )}
        </div>
        <span className="text-[10px] text-muted">
          Click a sector to inspect all stocks
        </span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
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
                className="rounded-xl border border-[rgba(212,150,58,0.1)] p-3 space-y-2"
              >
                <div className="shimmer-bg h-2.5 w-10 rounded" />
                <div className="shimmer-bg h-4 w-14 rounded" />
              </div>
            ))}
      </div>

      {/* Selected sector detail */}
      {activeSector && (
        <div className="mt-4 rounded-2xl border border-[rgba(212,150,58,0.12)] bg-black/20 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {SECTOR_ICONS[activeSector.sector] || "📈"}
                </span>
                <h3 className="text-base font-semibold text-slate-100">
                  {activeSector.sector}
                </h3>
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {activeSector.count} stocks · {activeSector.advance_count}{" "}
                advancing · {activeSector.decline_count} declining
              </div>
            </div>
            <button
              onClick={() => handleClick(activeSector.sector)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[rgba(212,150,58,0.15)] text-muted hover:text-slate-200 hover:border-[rgba(212,150,58,0.3)] transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {activeSector.stocks.map((stock) => (
              <SectorStockRow key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      )}

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
