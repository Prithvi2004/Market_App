import { useStore } from "../store/useStore.js";
import { useSectors } from "../api/market.js";

function shade(pct) {
  const v = Math.min(1, Math.abs(pct) / 3);
  const alpha = (0.15 + v * 0.55).toFixed(2);
  if (pct > 0) return { background: `rgba(22,163,74,${alpha})`, color: "#052e16" };
  if (pct < 0) return { background: `rgba(220,38,38,${alpha})`, color: "#450a0a" };
  return { background: "#f1f5f9", color: "#334155" };
}

export default function SectorHeatmap() {
  const { data } = useSectors();
  const setSectorFilter = useStore((s) => s.setSectorFilter);
  const setNewsFilter = useStore((s) => s.setNewsFilter);

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-3">
      <h2 className="text-sm font-semibold mb-2">Sector heatmap (avg %)</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {data?.length ? data.map((s) => (
          <button
            key={s.sector}
            style={shade(s.avg_change_pct)}
            onClick={() => { setSectorFilter(s.sector); setNewsFilter("sector"); }}
            className="rounded-md px-3 py-3 text-left"
          >
            <div className="text-xs uppercase tracking-wide">{s.sector}</div>
            <div className="text-sm font-semibold">
              {s.avg_change_pct >= 0 ? "+" : ""}{s.avg_change_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] opacity-70">{s.count} stocks</div>
          </button>
        )) : (
          <div className="text-xs text-slate-400 col-span-full text-center py-6">Waiting for poll data…</div>
        )}
      </div>
    </section>
  );
}
