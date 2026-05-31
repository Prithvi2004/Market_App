import { useStore } from "../store/useStore.js";
import { formatINR, formatPct, colorClass } from "../utils/formatters.js";

function getLogoMark(name, symbol) {
  const source = (name || symbol || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return source.slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function TickerTape({ data = [] }) {
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  if (!data.length) return null;

  const groups = [data, data];

  return (
    <div className="overflow-hidden bg-surface border-b border-[rgba(212,150,58,0.1)] py-2 select-none">
      <div className="ticker-tape-track">
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="flex min-w-full shrink-0 items-center gap-3 pr-3"
          >
            {group.map((q, i) => {
              const sym = q.symbol?.replace(".NS", "").replace(".BO", "");
              const isPos = q.change_pct > 0;
              const isNeg = q.change_pct < 0;
              const logoMark = getLogoMark(q.name, sym);
              return (
                <button
                  key={`${q.symbol}-${groupIndex}-${i}`}
                  onClick={() => setSelectedSymbol(q.symbol)}
                  className="group flex shrink-0 min-w-[190px] sm:min-w-[240px] items-center gap-2.5 px-3 py-1.5 rounded-xl whitespace-nowrap hover:bg-white/[0.03] hover:opacity-90 transition-all duration-200"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-black tracking-[0.08em] text-[#1a1204] shadow-[0_0_12px_rgba(212,150,58,0.18)]"
                    style={{
                      background: isPos
                        ? "linear-gradient(135deg, #fde68a 0%, #d4963a 100%)"
                        : isNeg
                          ? "linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)"
                          : "linear-gradient(135deg, #f0c56a 0%, #b97d28 100%)",
                      borderColor: isPos
                        ? "rgba(16,185,129,0.22)"
                        : isNeg
                          ? "rgba(244,63,94,0.22)"
                          : "rgba(212,150,58,0.18)",
                    }}
                    aria-hidden="true"
                  >
                    {logoMark}
                  </span>

                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[11px] font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {q.name || sym}
                    </span>
                    <span className="block text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-400 transition-colors">
                      {sym}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span className="text-xs font-semibold text-slate-100 tabular-nums">
                      {formatINR(q.price)}
                    </span>
                    <span
                      className={`text-[11px] font-medium tabular-nums ${colorClass(q.change_pct)}`}
                    >
                      {formatPct(q.change_pct)}
                    </span>
                  </span>

                  <span className="hidden sm:block text-slate-700 text-xs ml-1">
                    |
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
