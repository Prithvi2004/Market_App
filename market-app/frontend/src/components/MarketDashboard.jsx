import { useEffect, useState } from "react";
import { useIndices, useGainers, useLosers } from "../api/market.js";
import { useStore } from "../store/useStore.js";
import { formatINR, formatPct, colorClass, bgClass } from "../utils/formatters.js";

function Tile({ q }) {
  return (
    <div className={`px-4 py-3 rounded-lg border border-slate-200 ${bgClass(q.change_pct)}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{q.name}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold">{formatINR(q.price)}</span>
        <span className={`text-sm font-medium ${colorClass(q.change_pct)}`}>{formatPct(q.change_pct)}</span>
      </div>
      {q.stale && <div className="text-[10px] text-amber-700 mt-0.5">stale · market closed</div>}
    </div>
  );
}

function MoversTable({ title, rows }) {
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 text-sm font-semibold border-b border-slate-200">{title}</div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr><th className="text-left px-4 py-2">Symbol</th><th className="text-right px-4 py-2">Price</th><th className="text-right px-4 py-2">Change %</th></tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((q) => (
            <tr key={q.symbol} onClick={() => setSelectedSymbol(q.symbol)} className="hover:bg-slate-50 cursor-pointer border-t border-slate-100">
              <td className="px-4 py-2"><div className="font-mono text-xs text-slate-700">{q.symbol}</div><div className="text-xs text-slate-500">{q.name}</div></td>
              <td className="px-4 py-2 text-right">{formatINR(q.price)}</td>
              <td className={`px-4 py-2 text-right font-medium ${colorClass(q.change_pct)}`}>{formatPct(q.change_pct)}</td>
            </tr>
          )) : (
            <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Waiting for first poll cycle…</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LastUpdated() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const live = useStore((s) => s.livePrices);
  // best-effort: use first index timestamp if any
  const ts = live?.indices?.[0]?.timestamp;
  if (!ts) return <span className="text-xs text-slate-400">Last updated: —</span>;
  const secs = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  return <span className="text-xs text-slate-500" key={tick}>Last updated: {secs}s ago</span>;
}

export default function MarketDashboard() {
  const { data: indices } = useIndices();
  const { data: gainers } = useGainers();
  const { data: losers } = useLosers();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Markets</h2>
        <LastUpdated />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices?.map((q) => <Tile key={q.symbol} q={q} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MoversTable title="Top 10 Gainers" rows={gainers} />
        <MoversTable title="Top 10 Losers" rows={losers} />
      </div>
    </section>
  );
}
