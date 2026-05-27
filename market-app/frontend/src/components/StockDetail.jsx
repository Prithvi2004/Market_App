import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useStore } from "../store/useStore.js";
import { useQuote, useChart } from "../api/market.js";
import { useTickerNews } from "../api/news.js";
import { formatINR, formatPct, colorClass, formatIndianNumber, formatSigned, relativeTime } from "../utils/formatters.js";
import AIExplainer from "./AIExplainer.jsx";

const RANGES = ["1D", "1W", "1M", "1Y"];

export default function StockDetail() {
  const symbol = useStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const [range, setRange] = useState("1D");

  const { data: q, isLoading } = useQuote(symbol);
  const { data: chart } = useChart(symbol, range);
  const { data: news } = useTickerNews(symbol, 8);

  if (!symbol) return null;

  return (
    <div className="fixed inset-0 z-30 bg-slate-900/40 flex items-stretch justify-end">
      <div className="bg-slate-50 w-full max-w-3xl h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{q?.name || symbol}</h2>
              <span className="text-[10px] uppercase bg-slate-200 px-1.5 py-0.5 rounded">{q?.exchange || "—"}</span>
              {q?.stale && <span className="text-[10px] uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">stale</span>}
            </div>
            <div className="font-mono text-xs text-slate-500">{symbol}</div>
          </div>
          <button onClick={() => setSelectedSymbol(null)} className="text-slate-500 hover:text-slate-900 text-xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            {isLoading ? <div className="text-slate-400 text-sm">Loading quote…</div> : q ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold">{formatINR(q.price)}</span>
                  <span className={`text-sm font-medium ${colorClass(q.change_pct)}`}>
                    {formatSigned(q.change)} ({formatPct(q.change_pct)})
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><div className="text-slate-500">Volume</div><div className="font-medium">{q.volume?.toLocaleString("en-IN")}</div></div>
                  <div><div className="text-slate-500">52W High</div><div className="font-medium">{formatINR(q.high_52w)}</div></div>
                  <div><div className="text-slate-500">52W Low</div><div className="font-medium">{formatINR(q.low_52w)}</div></div>
                  <div><div className="text-slate-500">Market cap</div><div className="font-medium">{formatIndianNumber(q.market_cap)}</div></div>
                </div>
              </>
            ) : <div className="text-slate-400 text-sm">No quote yet — wait for the next poll cycle.</div>}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Price chart</h3>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <button key={r} onClick={() => setRange(r)}
                          className={`text-xs px-2 py-1 rounded ${range === r ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              {chart?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatINR(v)} labelFormatter={(t) => new Date(t).toLocaleString("en-IN")} />
                    <Line type="monotone" dataKey="c" stroke="#0f172a" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="text-slate-400 text-sm h-full grid place-items-center">Loading chart…</div>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Related news</h3>
            {news?.length ? (
              <ul className="space-y-2">
                {news.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-slate-800 hover:underline">{a.title}</a>
                    <div className="text-xs text-slate-500">{a.source} · {relativeTime(a.published_at)} · {a.sentiment_label}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="text-xs text-slate-400">No related articles found yet.</div>}
          </div>

          <AIExplainer symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
