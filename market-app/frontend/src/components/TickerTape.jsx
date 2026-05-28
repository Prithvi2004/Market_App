import { useStore } from "../store/useStore.js";
import { formatINR, formatPct, colorClass } from "../utils/formatters.js";

export default function TickerTape({ data = [] }) {
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  if (!data.length) return null;

  // Duplicate for seamless infinite loop
  const items = [...data, ...data];

  return (
    <div className="overflow-hidden bg-surface border-b border-[rgba(99,102,241,0.1)] py-2 select-none">
      <div className="ticker-tape-track gap-6">
        {items.map((q, i) => {
          const sym = q.symbol?.replace(".NS", "").replace(".BO", "");
          const isPos = q.change_pct > 0;
          const isNeg = q.change_pct < 0;
          return (
            <button
              key={`${q.symbol}-${i}`}
              onClick={() => setSelectedSymbol(q.symbol)}
              className="flex items-center gap-2 px-2 whitespace-nowrap hover:opacity-75 transition-opacity group"
            >
              {/* Dot indicator */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: isPos ? "#10b981" : isNeg ? "#f43f5e" : "#64748b",
                  boxShadow: isPos
                    ? "0 0 6px rgba(16,185,129,0.5)"
                    : isNeg
                    ? "0 0 6px rgba(244,63,94,0.5)"
                    : "none",
                }}
              />
              {/* Symbol */}
              <span className="font-mono text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                {sym}
              </span>
              {/* Price */}
              <span className="text-xs font-semibold text-slate-100">
                {formatINR(q.price)}
              </span>
              {/* Change */}
              <span className={`text-xs font-medium ${colorClass(q.change_pct)}`}>
                {formatPct(q.change_pct)}
              </span>
              {/* Separator */}
              <span className="text-slate-700 text-xs ml-1">|</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
