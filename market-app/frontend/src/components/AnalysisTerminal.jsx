/**
 * AnalysisTerminal.jsx
 * Full-screen institutional-grade stock analysis overlay.
 *
 * Layout: single position:fixed wrapper (z:9999)
 *   ├─ backdrop: position:absolute, click-to-close
 *   └─ panel:    position:absolute, inset:0, flex column
 *
 * Using position:absolute for BOTH children of the fixed wrapper
 * so height:100% / flex:1 resolution is unambiguous.
 */
import { useState, useEffect, useMemo, lazy, Suspense, Component } from "react";
import { useStore } from "../store/useStore.js";
import { useTerminalChart, useQuote, useFundamentals, usePeers } from "../api/market.js";
import { useTickerNews } from "../api/news.js";
import {
  formatINR,
  formatPct,
  formatSigned,
  formatIndianNumber,
  colorClass,
  relativeTime,
} from "../utils/formatters.js";
import { runAllIndicators } from "./analysis/IndicatorEngine.js";
import { detectPatterns } from "./analysis/PatternEngine.js";

const TradingChart = lazy(() => import("./analysis/TradingChart.jsx"));
const TechnicalPanel = lazy(() => import("./analysis/TechnicalPanel.jsx"));
const PatternPanel = lazy(() => import("./analysis/PatternPanel.jsx"));
const MomentumGauge = lazy(() => import("./analysis/MomentumGauge.jsx"));
const SupportResistance = lazy(
  () => import("./analysis/SupportResistance.jsx"),
);
const AIInsightPanel = lazy(() => import("./analysis/AIInsightPanel.jsx"));
const AdvancedPanel = lazy(() => import("./analysis/AdvancedPanel.jsx"));
const PredictPanel = lazy(() => import("./analysis/PredictPanel.jsx"));

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "2Y", "5Y"];
const CHART_TYPES = [
  { id: "Candlestick", icon: "🕯️", label: "Candle" },
  { id: "Line", icon: "📈", label: "Line" },
  { id: "Area", icon: "🏔️", label: "Area" },
  { id: "OHLC", icon: "📊", label: "OHLC" },
];
const INDICATORS = [
  { id: "ema9", label: "EMA 9" },
  { id: "ema20", label: "EMA 20" },
  { id: "ema50", label: "EMA 50" },
  { id: "vwap", label: "VWAP" },
  { id: "bb", label: "BB" },
  { id: "sr", label: "S/R" },
  { id: "ichimoku", label: "Ichimoku" },
  { id: "trendline", label: "Trend Line" },
  { id: "projection", label: "AI Envelope" },
  { id: "pattern_overlay", label: "Pattern Matcher" },
];
const RIGHT_TABS = [
  { id: "ai", label: "AI", icon: "✨" },
  { id: "predict", label: "Predict", icon: "🔮" },
  { id: "advanced", label: "Advanced", icon: "🧠" },
  { id: "technicals", label: "Technical", icon: "📊" },
  { id: "patterns", label: "Patterns", icon: "🕯️" },
  { id: "levels", label: "Levels", icon: "📐" },
  { id: "momentum", label: "Momentum", icon: "⚡" },
  { id: "fundamentals", label: "Fundamentals", icon: "📋" },
  { id: "peers", label: "Peers", icon: "🏢" },
];

/* ─── colour tokens ─────────────────────────────────────────────── */
const C = {
  bg: "#080e1a",
  surface: "#0f1729",
  border: "rgba(99,102,241,0.13)",
  faint: "rgba(99,102,241,0.07)",
  accent: "#6366f1",
  alight: "#a5b4fc",
  muted: "#64748b",
  text: "#e2e8f0",
  sub: "#94a3b8",
  bull: "#10b981",
  bear: "#f43f5e",
};

/* ─── tiny helpers ──────────────────────────────────────────────── */
function Pill({
  children,
  color = C.alight,
  bg = "rgba(99,102,241,0.13)",
  border = C.border,
}) {
  return (
    <span
      style={{
        fontSize: 10,
        color,
        padding: "2px 8px",
        borderRadius: 6,
        background: bg,
        border: `1px solid ${border}`,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Row({ label, value, color = C.sub }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}
    >
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color = C.text }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.8)",
        border: `1px solid ${C.faint}`,
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color }}>
        {value}
      </div>
    </div>
  );
}

function Range52W({ price, high, low }) {
  const rng = (high ?? 0) - (low ?? 0);
  const pct = rng > 0 ? (((price ?? 0) - (low ?? 0)) / rng) * 100 : 50;
  const cl = Math.max(2, Math.min(98, pct));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: C.muted,
          marginBottom: 4,
        }}
      >
        <span>52W Low {formatINR(low)}</span>
        <span>52W High {formatINR(high)}</span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(30,41,59,1)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${cl}%`,
            borderRadius: 99,
            background: "linear-gradient(90deg,#f43f5e,#f59e0b 50%,#10b981)",
          }}
        />
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 9,
          color: C.muted,
          marginTop: 4,
        }}
      >
        At {pct.toFixed(0)}% of 52-week range
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      style={{
        height: 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.5)",
        borderRadius: 12,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            margin: "0 auto 8px",
            border: "2px solid rgba(99,102,241,0.3)",
            borderTopColor: "#6366f1",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontSize: 12, color: C.muted }}>Loading chart…</span>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 40,
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Styled button helpers ─────────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 4px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 600,
        border: "1px solid transparent",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: active ? "rgba(99,102,241,0.2)" : "transparent",
        color: active ? C.alight : C.muted,
        borderColor: active ? "rgba(99,102,241,0.3)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function SegBtn({
  active,
  onClick,
  children,
  activeColor = "rgba(99,102,241,0.2)",
  activeTextColor = "#a5b4fc",
  activeBorder = "rgba(99,102,241,0.3)",
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 600,
        border: "1px solid transparent",
        transition: "all 0.15s",
        background: active ? activeColor : "transparent",
        color: active ? activeTextColor : C.muted,
        borderColor: active ? activeBorder : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function OverlayBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 600,
        transition: "all 0.15s",
        background: active ? "rgba(99,102,241,0.15)" : "transparent",
        color: active ? C.alight : C.muted,
        border: active
          ? "1px solid rgba(99,102,241,0.3)"
          : "1px solid rgba(30,41,59,0.9)",
      }}
    >
      {label}
    </button>
  );
}

class TerminalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Avoid blank screen when a visualization throws.
    // eslint-disable-next-line no-console
    console.error("Analysis terminal failed to render:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: "#080e1a",
          color: C.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, color: C.sub, marginBottom: 16 }}>
            The analysis view failed to load. Try closing and opening it again.
          </div>
          <button
            onClick={this.props.onClose}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "rgba(99,102,241,0.12)",
              color: C.alight,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════════════════════
   FundamentalsPanel
══════════════════════════════════════════════════════════════════ */
function FundRow({ label, value, sub, color = "#e2e8f0", fullWidth = false }) {
  if (value == null || value === "—") return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "7px 0", borderBottom: "1px solid rgba(99,102,241,0.06)",
      gridColumn: fullWidth ? "1/-1" : undefined,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        {sub && <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color, textAlign: "right", maxWidth: "55%" }}>{value}</div>
    </div>
  );
}

function FundamentalsPanel({ fundamentals: f, loading, symbol, formatINR, formatIndianNumber }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 0" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 32, background: "rgba(99,102,241,0.05)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }
  if (!f) return (
    <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, padding: "40px 0" }}>
      No fundamental data available for {symbol}
    </div>
  );

  const fmtCr = (v) => {
    if (!v) return "—";
    const cr = v / 1e7;
    if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
    if (cr >= 100) return `₹${(cr / 100).toFixed(2)}K Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  };
  const fmtNum = (v, dec = 2) => v != null ? Number(v).toFixed(dec) : null;
  const recColors = { buy: "#10b981", strong_buy: "#059669", hold: "#f59e0b", sell: "#f43f5e", strong_sell: "#dc2626", underperform: "#f43f5e" };
  const recColor = recColors[f.analyst_recommendation] || "#94a3b8";

  const pos = f["52w_position_pct"];
  const bullish52w = pos != null && pos >= 60;

  return (
    <div style={{ fontSize: 12 }}>
      {/* Header card */}
      <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: "1px solid rgba(99,102,241,0.12)" }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{f.sector} · {f.industry}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{f.name}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {f.market_cap && <div style={{ fontSize: 10, color: "#94a3b8" }}>Market Cap: <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{fmtCr(f.market_cap)}</span></div>}
          {f.analyst_recommendation && (
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Analyst: <span style={{ color: recColor, fontWeight: 700, textTransform: "capitalize" }}>{f.analyst_recommendation?.replace("_", " ")}</span></div>
          )}
        </div>
      </div>

      {/* 52W position bar */}
      {pos != null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 4 }}>
            <span>52W Low: {formatINR(f["52w_low"])}</span>
            <span style={{ color: bullish52w ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{pos.toFixed(0)}% of range</span>
            <span>52W High: {formatINR(f["52w_high"])}</span>
          </div>
          <div style={{ height: 8, background: "rgba(15,23,42,0.8)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(99,102,241,0.1)" }}>
            <div style={{ width: `${Math.max(2, Math.min(100, pos))}%`, height: "100%", background: `linear-gradient(90deg, #6366f1, ${bullish52w ? "#10b981" : "#f59e0b"})`, borderRadius: 4, transition: "width 0.8s ease" }} />
          </div>
        </div>
      )}

      {/* Valuation metrics */}
      <div style={{ marginBottom: 4, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Valuation</div>
      <FundRow label="P/E Ratio (TTM)" value={fmtNum(f.pe_ratio, 1)} sub="Price / Earnings" color={f.pe_ratio > 40 ? "#f59e0b" : "#e2e8f0"} />
      <FundRow label="Forward P/E" value={fmtNum(f.forward_pe, 1)} color="#94a3b8" />
      <FundRow label="P/B Ratio" value={fmtNum(f.pb_ratio, 2)} sub="Price / Book Value" color={f.pb_ratio > 5 ? "#f59e0b" : "#e2e8f0"} />
      <FundRow label="EPS (TTM)" value={f.eps != null ? formatINR(f.eps) : null} sub="Earnings Per Share" color="#10b981" />
      <FundRow label="Book Value / Share" value={f.book_value != null ? formatINR(f.book_value) : null} />

      {/* Profitability */}
      <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Profitability</div>
      <FundRow label="Profit Margin" value={f.profit_margin != null ? `${f.profit_margin}%` : null} color={f.profit_margin > 15 ? "#10b981" : f.profit_margin > 5 ? "#f59e0b" : "#f43f5e"} />
      <FundRow label="Return on Equity" value={f.roe != null ? `${f.roe}%` : null} color={f.roe > 15 ? "#10b981" : "#f59e0b"} />
      <FundRow label="Revenue" value={fmtCr(f.revenue)} />
      <FundRow label="Debt / Equity" value={fmtNum(f.debt_to_equity, 2)} color={f.debt_to_equity > 2 ? "#f43f5e" : f.debt_to_equity > 1 ? "#f59e0b" : "#10b981"} sub="Lower is safer" />
      <FundRow label="Current Ratio" value={fmtNum(f.current_ratio, 2)} color={f.current_ratio < 1 ? "#f43f5e" : "#10b981"} sub="&gt;1 = healthy liquidity" />

      {/* Dividends */}
      {(f.dividend_yield || f.dividend_rate) && (
        <>
          <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Dividends</div>
          <FundRow label="Dividend Yield" value={f.dividend_yield != null ? `${f.dividend_yield}%` : null} color="#a5b4fc" />
          <FundRow label="Dividend Rate (Annual)" value={f.dividend_rate != null ? formatINR(f.dividend_rate) : null} />
        </>
      )}

      {/* Risk */}
      <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Risk & Ownership</div>
      <FundRow label="Beta vs Market" value={fmtNum(f.beta, 2)} sub="1.0 = market risk" color={f.beta > 1.5 ? "#f43f5e" : f.beta < 0.8 ? "#10b981" : "#e2e8f0"} />
      <FundRow label="Institutional Holdings" value={f.held_by_institutions != null ? `${f.held_by_institutions}%` : null} color="#a5b4fc" />

      {/* Analyst targets */}
      {f.target_price && (
        <>
          <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Analyst Targets ({f.num_analysts} analysts)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 4 }}>
            {[
              { label: "Low", val: f.target_low, col: "#f43f5e" },
              { label: "Mean", val: f.target_price, col: "#a5b4fc" },
              { label: "High", val: f.target_high, col: "#10b981" },
            ].map(({ label, val, col }) => val && (
              <div key={label} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: "monospace", marginTop: 2 }}>{formatINR(val)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PeersPanel
══════════════════════════════════════════════════════════════════ */
function PeersPanel({ peers, loading, currentSymbol, formatINR, colorClass, formatPct }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 0" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ height: 40, background: "rgba(99,102,241,0.05)", borderRadius: 6 }} />
        ))}
      </div>
    );
  }
  if (!peers?.length) return (
    <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, padding: "40px 0" }}>
      No sector peers found for {currentSymbol}
    </div>
  );

  const fmtCap = (v) => {
    if (!v) return "—";
    const cr = v / 1e7;
    if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(1)}L Cr`;
    return `₹${(cr / 100).toFixed(0)}K Cr`;
  };

  return (
    <div>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>
        {peers[0]?.sector} — {peers.length} peers by market cap
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {peers.map((p) => {
          const chg = p.change_pct ?? 0;
          const isPos = chg >= 0;
          return (
            <div key={p.symbol} style={{
              background: "rgba(15,23,42,0.6)", border: "1px solid rgba(99,102,241,0.08)",
              borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(15,23,42,0.6)"}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>
                  {p.symbol.replace(".NS", "").replace(".BO", "")}
                </div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#e2e8f0" }}>
                  {p.price ? formatINR(p.price) : "—"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isPos ? "#10b981" : "#f43f5e" }}>
                  {isPos ? "+" : ""}{chg.toFixed(2)}%
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16, minWidth: 60 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>Mkt Cap</div>
                <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 600 }}>{fmtCap(p.market_cap)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AnalysisTerminal
══════════════════════════════════════════════════════════════════ */
export default function AnalysisTerminal({
  symbolOverride = null,
  standalone = false,
}) {
  const analysisSymbol = useStore((s) => s.analysisSymbol);
  const fallbackSymbol = useStore((s) => s.selectedSymbol);
  
  // Priority: symbolOverride (URL param in new tab) > analysisSymbol (store) > fallbackSymbol (selected)
  const symbol = symbolOverride || analysisSymbol || fallbackSymbol;
  
  const setAnalysisOpen = useStore((s) => s.setAnalysisOpen);
  const setAnalysisSymbol = useStore((s) => s.setAnalysisSymbol);
  const analysisStandalone = standalone || useStore((s) => s.analysisStandalone);

  const [range, setRange] = useState("1M");
  const [chartType, setChartType] = useState("Candlestick");
  const [activeIndicators, setActiveIndicators] = useState([
    "ema20",
    "ema50",
    "sr",
    "pattern_overlay",
  ]);
  const [rightTab, setRightTab] = useState("ai");
  const [debugInfo, setDebugInfo] = useState(null);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartHeight = useMemo(() => {
    // Header (approx 64px) + StatsBar (approx 38px) + OverlaysBar (approx 34px) + padding/margins = approx 176px
    return Math.max(380, viewportHeight - 176);
  }, [viewportHeight]);

  const {
    data: q,
    isError: quoteError,
    error: quoteErr,
  } = useQuote(symbol);
  const {
    data: rawChart,
    isError: chartError,
    error: chartErr,
  } = useTerminalChart(symbol, range);
  const {
    data: news,
    isError: newsError,
    error: newsErr,
  } = useTickerNews(symbol, 5);
  // Fundamentals and peers are fetched lazily only when their tabs are active
  const { data: fundamentals, isLoading: fundsLoading } = useFundamentals(
    (rightTab === "fundamentals" || rightTab === "advanced") ? symbol : null
  );
  const { data: peers, isLoading: peersLoading } = usePeers(
    rightTab === "peers" ? symbol : null
  );

  const newsSentiment = useMemo(() => {
    if (!news || !news.length) return null;
    let pos = 0, neg = 0, neu = 0;
    news.forEach((item) => {
      if (item.sentiment_label === "positive") pos++;
      else if (item.sentiment_label === "negative") neg++;
      else neu++;
    });
    if (pos > neg) return { label: "Bullish Outlook", color: C.bull, bg: "rgba(16,185,129,0.12)" };
    if (neg > pos) return { label: "Bearish Outlook", color: C.bear, bg: "rgba(244,63,94,0.12)" };
    return { label: "Neutral Outlook", color: C.muted, bg: "rgba(100,116,139,0.12)" };
  }, [news]);

  useEffect(() => {
    const info = {
      symbolOverride,
      analysisSymbol,
      fallbackSymbol,
      symbol,
      standalone: analysisStandalone,
      href: window.location.href,
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
    // eslint-disable-next-line no-console
    console.info("[AnalysisTerminal] mount", info);
    return () => {
      // eslint-disable-next-line no-console
      console.info("[AnalysisTerminal] unmount", { symbol });
    };
  }, [symbolOverride, analysisSymbol, fallbackSymbol, symbol, analysisStandalone]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info("[AnalysisTerminal] data", {
      symbol,
      quote: !!q,
      chartPoints: rawChart?.length ?? 0,
      newsItems: news?.length ?? 0,
      chartRange: range,
      chartType,
      rightTab,
    });
  }, [symbol, q, rawChart, news, range, chartType, rightTab]);

  useEffect(() => {
    if (quoteError) {
      // eslint-disable-next-line no-console
      console.warn("[AnalysisTerminal] quote error", quoteErr);
    }
  }, [quoteError, quoteErr]);

  useEffect(() => {
    if (chartError) {
      // eslint-disable-next-line no-console
      console.warn("[AnalysisTerminal] chart error", chartErr);
    }
  }, [chartError, chartErr]);

  useEffect(() => {
    if (newsError) {
      // eslint-disable-next-line no-console
      console.warn("[AnalysisTerminal] news error", newsErr);
    }
  }, [newsError, newsErr]);

  const candles = useMemo(() => {
    if (!rawChart?.length) return [];
    return rawChart.map((c) => ({
      t: c.t,
      o: c.o ?? c.c,
      h: c.h ?? c.c,
      l: c.l ?? c.c,
      c: c.c,
      v: c.v ?? 0,
    }));
  }, [rawChart]);

  const indicators = useMemo(() => runAllIndicators(candles), [candles]);
  const patterns = useMemo(() => detectPatterns(candles), [candles]);
  const rawScore = indicators?.momentum ?? 50;
  const score = isNaN(rawScore) ? 50 : rawScore;

  const toggleIndicator = (id) =>
    setActiveIndicators((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const closeTerminal = () => {
    // eslint-disable-next-line no-console
    console.info("[AnalysisTerminal] closeTerminal called", { analysisStandalone });
    
    if (analysisStandalone) {
      setAnalysisOpen(false);
      setAnalysisSymbol(null);
      // For new tab mode, just close the window without redirect
      try {
        window.close();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[AnalysisTerminal] window.close() failed (expected for non-popup windows)", e.message);
      }
      return;
    }
    
    // For overlay mode (not standalone)
    setAnalysisOpen(false);
    setAnalysisSymbol(null);
  };

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") closeTerminal();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [setAnalysisOpen, setAnalysisSymbol]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const bullish = patterns.filter((p) => p.direction === "bullish").length;
  const bearish = patterns.filter((p) => p.direction === "bearish").length;

  /* ── Inline CSS animations injected once ────────────────────── */
  const ANIM_CSS = `
    @keyframes terminalFadeIn {
      from { opacity: 0; transform: translateY(8px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @keyframes atSpin { to { transform: rotate(360deg); } }
    @keyframes atPulse {
      0%,100% { opacity: 0.4; }
      50%      { opacity: 0.7; }
    }
  `;

  if (!symbol) {
    return (
      <>
        <style>{ANIM_CSS}</style>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.82)",
              zIndex: 0,
            }}
            onClick={closeTerminal}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: "#080e1a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: C.text,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 22 }}>📈</div>
            <div style={{ fontSize: 14, color: C.sub }}>
              No stock selected
            </div>
            {analysisStandalone && (
              <div
                style={{
                  fontSize: 11,
                  color: C.sub,
                  maxWidth: 400,
                  textAlign: "center",
                  fontFamily: "monospace",
                  background: "rgba(99,102,241,0.08)",
                  padding: 12,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  marginTop: 12,
                }}
              >
                {debugInfo && (
                  <>
                    <div>Debug Info:</div>
                    <div style={{ marginTop: 8 }}>
                      symbol: {debugInfo.symbol || "null"}
                    </div>
                    <div>symbolOverride: {debugInfo.symbolOverride || "null"}</div>
                    <div>analysisSymbol: {debugInfo.analysisSymbol || "null"}</div>
                    <div>href: {debugInfo.href}</div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={closeTerminal}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "rgba(99,102,241,0.12)",
                color: C.alight,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{ANIM_CSS}</style>

      <TerminalErrorBoundary onClose={closeTerminal}>
        {/*
          ┌─ OUTER WRAPPER ──────────────────────────────────────────┐
          │  position: fixed; top/left/right/bottom: 0              │
          │  z-index: 9999  (above everything)                      │
          │  overflow: hidden                                        │
          │                                                          │
          │  ├─ BACKDROP (position:absolute, inset:0, z:0)          │
          │  └─ PANEL    (position:absolute, inset:0, z:1)          │
          └──────────────────────────────────────────────────────────┘
        */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* ── Backdrop ─────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.82)",
              zIndex: 0,
            }}
            onClick={closeTerminal}
          />

          {/* ── Panel ────────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: "#080e1a",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "terminalFadeIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
              fontFamily: "'Inter', system-ui, sans-serif",
              color: C.text,
            }}
          >
            {/* ══ HEADER ═══════════════════════════════════════════ */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "12px 20px",
                flexShrink: 0,
                background: "rgba(8,14,26,0.95)",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {/* Left cluster */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Name + tags */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ fontSize: 16, fontWeight: 800, color: C.text }}
                    >
                      {q?.name || symbol}
                    </span>
                    <Pill>{q?.exchange || "NSE"}</Pill>
                    <Pill
                      color="#c4b5fd"
                      bg="rgba(139,92,246,0.12)"
                      border="rgba(139,92,246,0.25)"
                    >
                      ⚡ Terminal
                    </Pill>
                    {q?.stale && (
                      <Pill
                        color="#fbbf24"
                        bg="rgba(251,191,36,0.1)"
                        border="rgba(251,191,36,0.2)"
                      >
                        stale
                      </Pill>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      fontFamily: "monospace",
                      marginTop: 2,
                    }}
                  >
                    {symbol}
                  </div>
                </div>

                {/* Price */}
                {q && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: C.text,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatINR(q.price)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: (q.change_pct ?? 0) >= 0 ? C.bull : C.bear,
                      }}
                    >
                      {formatSigned(q.change)} ({formatPct(q.change_pct)})
                    </span>
                  </div>
                )}

                {/* Pattern pills */}
                {bullish > 0 && (
                  <Pill
                    color={C.bull}
                    bg="rgba(16,185,129,0.1)"
                    border="rgba(16,185,129,0.22)"
                  >
                    ↑ {bullish} bullish
                  </Pill>
                )}
                {bearish > 0 && (
                  <Pill
                    color={C.bear}
                    bg="rgba(244,63,94,0.1)"
                    border="rgba(244,63,94,0.22)"
                  >
                    ↓ {bearish} bearish
                  </Pill>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={closeTerminal}
                title="Close (Esc)"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  border: `1px solid ${C.faint}`,
                  background: "transparent",
                  color: C.muted,
                  fontSize: 17,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.muted;
                }}
              >
                ✕
              </button>
            </div>

            {/* ══ STATS + CONTROLS BAR ═════════════════════════════ */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                padding: "7px 20px",
                flexShrink: 0,
                background: "rgba(8,14,26,0.7)",
                borderBottom: `1px solid ${C.faint}`,
              }}
            >
              {q && (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Row
                    label="Vol"
                    value={q.volume?.toLocaleString("en-IN") ?? "—"}
                  />
                  <Row label="MCap" value={formatIndianNumber(q.market_cap)} />
                  <Row
                    label="52W H"
                    value={formatINR(q.high_52w)}
                    color={C.bull}
                  />
                  <Row
                    label="52W L"
                    value={formatINR(q.low_52w)}
                    color={C.bear}
                  />
                  <Row
                    label="Patterns"
                    value={patterns.length}
                    color={C.alight}
                  />
                </div>
              )}

              {/* Timeframe + chart type (pushed right) */}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    padding: 3,
                    borderRadius: 8,
                    background: "#0b1220",
                    border: "1px solid rgba(30,41,59,1)",
                  }}
                >
                  {TIMEFRAMES.map((tf) => (
                    <SegBtn
                      key={tf}
                      active={range === tf}
                      onClick={() => setRange(tf)}
                    >
                      {tf}
                    </SegBtn>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    padding: 3,
                    borderRadius: 8,
                    background: "#0b1220",
                    border: "1px solid rgba(30,41,59,1)",
                  }}
                >
                  {CHART_TYPES.map((ct) => (
                    <SegBtn
                      key={ct.id}
                      active={chartType === ct.id}
                      onClick={() => setChartType(ct.id)}
                      activeColor="rgba(139,92,246,0.2)"
                      activeTextColor="#c4b5fd"
                      activeBorder="rgba(139,92,246,0.3)"
                    >
                      {ct.icon} {ct.label}
                    </SegBtn>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ INDICATOR TOGGLES ════════════════════════════════ */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                padding: "6px 20px",
                flexShrink: 0,
                background: "rgba(8,14,26,0.5)",
                borderBottom: `1px solid ${C.faint}`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginRight: 4,
                  flexShrink: 0,
                }}
              >
                Overlays
              </span>
              {INDICATORS.map((opt) => (
                <OverlayBtn
                  key={opt.id}
                  active={activeIndicators.includes(opt.id)}
                  onClick={() => toggleIndicator(opt.id)}
                  label={opt.label}
                />
              ))}
            </div>

            {/* ══ BODY (vertical stacked scroll container) ═════════ */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                background: "rgba(8,14,26,0.2)",
              }}
            >
              {/* ── Top: Chart Card (takes full container width, dynamic chartHeight for first viewport fold) ── */}
              <div
                style={{
                  background: "#0c1420",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  width: "100%",
                  height: chartHeight,
                  flexShrink: 0,
                }}
              >
                <Suspense fallback={<ChartSkeleton />}>
                  {candles.length > 0 ? (
                    <TradingChart
                      candles={candles}
                      indicators={indicators}
                      patterns={patterns}
                      activeIndicators={activeIndicators}
                      chartType={chartType}
                      height={chartHeight - 16}
                    />
                  ) : (
                    <ChartSkeleton />
                  )}
                </Suspense>
              </div>

              {/* ── Middle: Stats & News Grid (side-by-side on large screens, stacked on mobile) ── */}
              <div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                style={{ width: "100%", flexShrink: 0 }}
              >
                {/* Left side: Stats Card */}
                {q && (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: C.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 12,
                        }}
                      >
                        52-Week Price Range Valuation
                      </div>
                      <Range52W
                        price={q.price}
                        high={q.high_52w}
                        low={q.low_52w}
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      <StatCard
                        label="Day High"
                        value={formatINR(q.day_high ?? q.high_52w)}
                        color={C.bull}
                      />
                      <StatCard
                        label="Day Low"
                        value={formatINR(q.day_low ?? q.low_52w)}
                        color={C.bear}
                      />
                      <StatCard label="Open" value={formatINR(q.open)} />
                      <StatCard
                        label="Prev Close"
                        value={formatINR(q.prev_close)}
                      />
                    </div>
                  </div>
                )}

                {/* Right side: Related News */}
                {news?.length > 0 && (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 12,
                        width: "100%",
                      }}
                    >
                      <span>Related Market Intelligence News</span>
                      {newsSentiment && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            color: newsSentiment.color,
                            background: newsSentiment.bg,
                            border: `1px solid ${newsSentiment.color}25`,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {newsSentiment.label}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {news.slice(0, 4).map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            textDecoration: "none",
                            padding: "6px 8px",
                            borderRadius: 8,
                            background: "rgba(255, 255, 255, 0.01)",
                            border: "1px solid rgba(255, 255, 255, 0.02)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99,102,241,0.05)";
                            e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.02)";
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              marginTop: 5,
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background:
                                a.sentiment_label === "positive"
                                  ? C.bull
                                  : a.sentiment_label === "negative"
                                    ? C.bear
                                    : C.muted,
                              boxShadow: a.sentiment_label === "positive"
                                ? `0 0 6px ${C.bull}`
                                : a.sentiment_label === "negative"
                                  ? `0 0 6px ${C.bear}`
                                  : "none",
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#cbd5e1",
                                fontWeight: 500,
                                lineHeight: 1.4,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {a.title}
                            </span>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <span style={{ fontSize: 9, color: C.muted }}>Source: {a.source || "Feed"}</span>
                              <span style={{ fontSize: 9, color: C.muted }}>{relativeTime(a.published_at)}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Bottom Section: 6 Analytical Tabs (Full Width) ── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  width: "100%",
                  marginTop: 8,
                  flexShrink: 0,
                }}
              >
                {/* Horizontal Tab Bar with centered tabs, premium border and active shadow */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      padding: 4,
                      borderRadius: 12,
                      background: "#0b1220",
                      border: "1px solid rgba(99,102,241,0.15)",
                      maxWidth: 800,
                      width: "100%",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {RIGHT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setRightTab(tab.id)}
                        style={{
                          flex: 1,
                          padding: "10px 8px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid transparent",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          background: rightTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
                          color: rightTab === tab.id ? C.alight : C.muted,
                          borderColor: rightTab === tab.id ? "rgba(99,102,241,0.3)" : "transparent",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          boxShadow: rightTab === tab.id ? "0 2px 10px rgba(99, 102, 241, 0.15)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (rightTab !== tab.id) {
                            e.currentTarget.style.color = C.text;
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (rightTab !== tab.id) {
                            e.currentTarget.style.color = C.muted;
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content panel container - full width and premium styled */}
                <div
                  style={{
                    background: "rgba(15,23,42,0.55)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: "24px 28px",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
                    width: "100%",
                  }}
                >
                  <Suspense fallback={<PanelSkeleton />}>
                    {rightTab === "ai" && (
                      <AIInsightPanel
                        symbol={symbol}
                        quote={q}
                        candles={candles}
                        indicators={indicators}
                        patterns={patterns}
                        score={score}
                      />
                    )}
                    {rightTab === "predict" && (
                      <PredictPanel
                        indicators={indicators}
                        candles={candles}
                      />
                    )}
                    {rightTab === "advanced" && (
                      <AdvancedPanel
                        indicators={indicators}
                        candles={candles}
                        fundamentals={fundamentals}
                      />
                    )}
                    {rightTab === "technicals" && (
                      <TechnicalPanel
                        indicators={indicators}
                        candles={candles}
                      />
                    )}
                    {rightTab === "patterns" && (
                      <PatternPanel patterns={patterns} />
                    )}
                    {rightTab === "levels" && (
                      <SupportResistance
                        indicators={indicators}
                        candles={candles}
                      />
                    )}
                    {rightTab === "momentum" && (
                      <MomentumGauge
                        score={score}
                        indicators={indicators}
                        candles={candles}
                      />
                    )}
                    {rightTab === "fundamentals" && (
                      <FundamentalsPanel
                        fundamentals={fundamentals}
                        loading={fundsLoading}
                        symbol={symbol}
                        formatINR={formatINR}
                        formatIndianNumber={formatIndianNumber}
                      />
                    )}
                    {rightTab === "peers" && (
                      <PeersPanel
                        peers={peers}
                        loading={peersLoading}
                        currentSymbol={symbol}
                        formatINR={formatINR}
                        colorClass={colorClass}
                        formatPct={formatPct}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
            </div>

            {/* ══ FOOTER ═══════════════════════════════════════════ */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 20px",
                borderTop: `1px solid ${C.faint}`,
                background: "rgba(8,14,26,0.9)",
                fontSize: 10,
                color: C.muted,
              }}
            >
              <span>
                MarketPulse Terminal · {symbol} · Press Esc or click backdrop to
                close
              </span>
              <span style={{ color: "rgba(244,63,94,0.55)", fontWeight: 600 }}>
                Not financial advice
              </span>
            </div>
          </div>
          {/* end panel */}
        </div>
        {/* end outer */}
      </TerminalErrorBoundary>
    </>
  );
}
