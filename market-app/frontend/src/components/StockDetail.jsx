import { useState, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useStore } from "../store/useStore.js";
import { useQuote, useChart } from "../api/market.js";
import { useTickerNews } from "../api/news.js";
import {
  formatINR,
  formatPct,
  colorClass,
  formatIndianNumber,
  formatSigned,
  relativeTime,
} from "../utils/formatters.js";
import AIExplainer from "./AIExplainer.jsx";

const RANGES = ["1D", "1W", "1M", "1Y"];

// ─── Custom Tooltip for chart ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const fmt = range === "1D"
    ? new Date(label).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: range === "1Y" ? "2-digit" : undefined });

  return (
    <div className="glass-card px-3 py-2.5 text-xs space-y-1 min-w-[140px]">
      <div className="text-muted mb-1.5">{fmt}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {d.o != null && (
          <>
            <span className="text-muted">Open</span>
            <span className="text-slate-200 text-right tabular-nums">{formatINR(d.o)}</span>
          </>
        )}
        {d.h != null && (
          <>
            <span className="text-muted">High</span>
            <span className="text-bull text-right tabular-nums">{formatINR(d.h)}</span>
          </>
        )}
        {d.l != null && (
          <>
            <span className="text-muted">Low</span>
            <span className="text-bear text-right tabular-nums">{formatINR(d.l)}</span>
          </>
        )}
        <span className="text-muted">Close</span>
        <span className="text-slate-100 font-semibold text-right tabular-nums">
          {formatINR(d.c)}
        </span>
      </div>
      {d.v != null && (
        <div className="pt-1 border-t border-[rgba(99,102,241,0.1)] flex justify-between">
          <span className="text-muted">Volume</span>
          <span className="text-slate-400 tabular-nums">
            {Number(d.v).toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── 52-week range slider ─────────────────────────────────────────────────────
function Range52W({ price, high, low }) {
  const range = (high ?? 0) - (low ?? 0);
  const pct   = range > 0 ? (((price ?? 0) - (low ?? 0)) / range) * 100 : 50;
  const clamped = Math.max(2, Math.min(98, pct));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-muted">
        <span>52W Low {formatINR(low)}</span>
        <span>52W High {formatINR(high)}</span>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${clamped}%`,
            background: "linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%)",
          }}
        />
      </div>
      <div className="relative h-0">
        <div
          className="absolute -top-3 w-2.5 h-2.5 rounded-full border-2 border-white bg-accent shadow-glow-accent -translate-x-1/2"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="pt-1.5 text-center text-[10px] text-muted">
        At {pct.toFixed(0)}% of 52-week range
      </div>
    </div>
  );
}

// ─── Stat Box ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, colorCls }) {
  return (
    <div className="bg-surface/60 rounded-lg p-2.5 border border-[rgba(99,102,241,0.08)]">
      <div className="text-[10px] text-muted mb-1">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${colorCls || "text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}

// ─── StockDetail ─────────────────────────────────────────────────────────────
export default function StockDetail() {
  const symbol          = useStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const resetExplain    = useStore((s) => s.resetExplain);

  const [range, setRange] = useState("1D");

  const { data: q, isLoading } = useQuote(symbol);
  const { data: chart }        = useChart(symbol, range);
  const { data: news }         = useTickerNews(symbol, 8);

  // Reset explainer when a new symbol opens
  useEffect(() => {
    if (symbol) {
      resetExplain();
      setRange("1D");
    }
  }, [symbol]);

  if (!symbol) return null;

  const chartColor = (q?.change_pct ?? 0) >= 0 ? "#10b981" : "#f43f5e";
  const chartGradient = (q?.change_pct ?? 0) >= 0
    ? "rgba(16,185,129,0.15)"
    : "rgba(244,63,94,0.15)";

  // Y-axis formatter
  const yFmt = (v) => {
    if (v >= 1e5) return `₹${(v / 1e3).toFixed(0)}k`;
    return `₹${v}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        onClick={() => setSelectedSymbol(null)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-30 w-full max-w-3xl bg-ink border-l border-[rgba(99,102,241,0.15)] overflow-y-auto shadow-2xl animate-slide-in-right">
        {/* ── Sticky header ────────────────────── */}
        <div className="sticky top-0 z-10 glass-card rounded-none border-t-0 border-r-0 border-l-0 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-100 truncate">
                  {q?.name || symbol}
                </h2>
                <span className="text-[10px] bg-accent/10 text-accent-light px-1.5 py-0.5 rounded border border-accent/20 shrink-0">
                  {q?.exchange || "NSE"}
                </span>
                {q?.stale && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                    stale
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-muted mt-0.5">{symbol}</div>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-muted hover:text-slate-100 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-xl leading-none shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Content ──────────────────────────── */}
        <div className="p-5 space-y-4">
          {/* Quote card */}
          <div className="glass-card p-5">
            {isLoading ? (
              <div className="space-y-3">
                <div className="shimmer-bg h-9 w-40 rounded" />
                <div className="shimmer-bg h-5 w-28 rounded" />
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="shimmer-bg h-12 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : q ? (
              <>
                {/* Price + change */}
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-4xl font-bold text-slate-100 tabular-nums">
                    {formatINR(q.price)}
                  </span>
                  <span className={`text-lg font-semibold tabular-nums ${colorClass(q.change_pct)}`}>
                    {formatSigned(q.change)} ({formatPct(q.change_pct)})
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatBox label="Volume" value={q.volume?.toLocaleString("en-IN") ?? "—"} />
                  <StatBox label="Market Cap" value={formatIndianNumber(q.market_cap)} />
                  <StatBox
                    label="52W High"
                    value={formatINR(q.high_52w)}
                    colorCls="text-bull"
                  />
                  <StatBox
                    label="52W Low"
                    value={formatINR(q.low_52w)}
                    colorCls="text-bear"
                  />
                </div>

                {/* 52W Range */}
                <Range52W
                  price={q.price}
                  high={q.high_52w}
                  low={q.low_52w}
                />
              </>
            ) : (
              <p className="text-sm text-muted">No quote yet — wait for next poll.</p>
            )}
          </div>

          {/* Chart */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Price Chart</h3>
              <div className="flex gap-1 p-0.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all duration-200 font-medium ${
                      range === r
                        ? "bg-accent/20 text-accent-light border border-accent/30"
                        : "text-muted hover:text-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56">
              {chart?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chart}
                    margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={chartColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(99,102,241,0.09)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(t) => {
                        const d = new Date(t);
                        if (range === "1D")
                          return d.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                        if (range === "1Y")
                          return d.toLocaleDateString("en-IN", {
                            month: "short",
                          });
                        return d.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        });
                      }}
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={yFmt}
                    />
                    <Tooltip
                      content={<ChartTooltip range={range} />}
                      cursor={{
                        stroke: "rgba(99,102,241,0.3)",
                        strokeWidth: 1,
                        strokeDasharray: "4 2",
                      }}
                    />
                    {/* Volume bars (hidden but data present for tooltip) */}
                    <Bar dataKey="v" fill="rgba(99,102,241,0.12)" radius={1} maxBarSize={4} />
                    {/* Glowing Area Fill */}
                    <Area
                      type="monotone"
                      dataKey="c"
                      stroke="none"
                      fill="url(#chartGrad)"
                      connectNulls
                    />
                    {/* Price line */}
                    <Line
                      type="monotone"
                      dataKey="c"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4.5, fill: chartColor, strokeWidth: 0 }}
                    />
                    {/* Opening price reference */}
                    {chart[0]?.o && (
                       <ReferenceLine
                        y={chart[0].o}
                        stroke="rgba(99,102,241,0.3)"
                        strokeDasharray="4 2"
                        strokeWidth={1}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Related news */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              Related News
              {news?.length > 0 && (
                <span className="ml-2 text-xs text-muted font-normal">
                  ({news.length})
                </span>
              )}
            </h3>
            {news?.length ? (
              <ul className="space-y-3">
                {news.map((a) => (
                  <li key={a.id} className="group">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-300 group-hover:text-accent-light transition-colors line-clamp-2 leading-snug"
                    >
                      {a.title}
                    </a>
                    <div className="text-[10px] text-muted mt-0.5 flex items-center gap-1.5">
                      <span>{a.source}</span>
                      <span>·</span>
                      <span>{relativeTime(a.published_at)}</span>
                      <span
                        className={`ml-auto font-medium ${
                          a.sentiment_label === "positive"
                            ? "text-bull"
                            : a.sentiment_label === "negative"
                            ? "text-bear"
                            : "text-muted"
                        }`}
                      >
                        {a.sentiment_label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No related articles yet.</p>
            )}
          </div>

          {/* AI Explainer */}
          <AIExplainer symbol={symbol} quote={q} />
        </div>
      </div>
    </>
  );
}
