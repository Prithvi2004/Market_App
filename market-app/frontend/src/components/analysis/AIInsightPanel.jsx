/**
 * AIInsightPanel.jsx
 * Enhanced AI analysis panel for the full-screen terminal.
 * Uses the existing /api/llm/explain endpoint with SSE streaming.
 */
import { useState, useEffect, useRef } from "react";
import { formatINR, formatPct } from "../../utils/formatters.js";
import { streamExplain } from "../../api/llm.js";

// ─── Reuse text formatting from AIExplainer ────────────────────────────────
function parseInsightText(raw) {
  if (!raw) return null;
  const lines = raw.split("\n").filter(Boolean);
  const elements = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Confidence line
    if (/^confidence:/i.test(trimmed)) {
      const val = trimmed.replace(/^confidence:\s*/i, "").trim();
      const color =
        val === "high" ? "text-emerald-400" :
        val === "medium" ? "text-amber-400" :
        "text-rose-400";
      elements.push(
        <div key={key++} className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(99,102,241,0.1)]">
          <span className="text-[10px] text-muted uppercase tracking-wider">Confidence</span>
          <span className={`text-xs font-bold uppercase ${color}`}>{val}</span>
        </div>
      );
      continue;
    }

    // Bold **text**
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const formatted = parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="text-slate-200 font-semibold">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );

    elements.push(
      <p key={key++} className="text-[12px] text-slate-400 leading-relaxed">
        {formatted}
      </p>
    );
  }

  return elements;
}

// ─── Signal pill ──────────────────────────────────────────────────────────────
function SignalPill({ label, value, color }) {
  const colors = {
    green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400" },
    red:    { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400" },
    amber:  { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400" },
    violet: { bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-400" },
    slate:  { bg: "bg-slate-800",      border: "border-slate-700",      text: "text-slate-400" },
  };
  const c = colors[color] ?? colors.slate;
  return (
    <div className={`px-3 py-1.5 rounded-lg border text-center ${c.bg} ${c.border}`}>
      <div className="text-[9px] text-muted uppercase tracking-wider">{label}</div>
      <div className={`text-[12px] font-bold mt-0.5 ${c.text}`}>{value}</div>
    </div>
  );
}

// ─── Quick analysis from indicators (no LLM needed) ──────────────────────────
function QuickAnalysis({ candles, indicators, patterns, score }) {
  if (!candles?.length || !indicators) return null;

  const n      = candles.length - 1;
  const price  = candles[n]?.c;
  const rsi    = indicators.rsi?.[n];
  const hist   = indicators.macd?.histogram?.[n];
  const ema20  = indicators.ema20?.[n];
  const ema50  = indicators.ema50?.[n];
  const atr    = indicators.atr?.[n];
  const bbU    = indicators.bb?.upper?.[n];
  const bbL    = indicators.bb?.lower?.[n];

  const trend =
    price > ema20 && ema20 > ema50 ? "Uptrend" :
    price < ema20 && ema20 < ema50 ? "Downtrend" : "Sideways";

  const trendColor =
    trend === "Uptrend" ? "green" : trend === "Downtrend" ? "red" : "amber";

  const momentum =
    score >= 70 ? "Bullish" : score <= 30 ? "Bearish" : "Neutral";

  const volatility =
    atr && price ? ((atr / price) * 100).toFixed(1) + "%" : "—";

  const bbPosition =
    bbU && bbL && price
      ? `${(((price - bbL) / (bbU - bbL)) * 100).toFixed(0)}% of BB`
      : "—";

  const bullishPats  = patterns.filter((p) => p.direction === "bullish").length;
  const bearishPats  = patterns.filter((p) => p.direction === "bearish").length;
  const patternBias  =
    bullishPats > bearishPats ? "Bullish" :
    bearishPats > bullishPats ? "Bearish" : "Mixed";
  const patternColor =
    patternBias === "Bullish" ? "green" : patternBias === "Bearish" ? "red" : "amber";

  // Recommendation
  const recScore =
    (trend === "Uptrend" ? 2 : trend === "Downtrend" ? -2 : 0) +
    (rsi < 40 ? 1 : rsi > 65 ? -1 : 0) +
    (hist > 0 ? 1 : -1) +
    (bullishPats - bearishPats);

  const rec =
    recScore >= 3 ? { label: "Strong Buy",  color: "green"  } :
    recScore >= 1 ? { label: "Watch / Buy", color: "green"  } :
    recScore <= -3 ? { label: "Strong Sell", color: "red"   } :
    recScore <= -1 ? { label: "Caution",     color: "red"   } :
    { label: "Hold / Neutral", color: "amber" };

  return (
    <div className="space-y-3">
      {/* Signal grid */}
      <div className="grid grid-cols-2 gap-2">
        <SignalPill label="Trend"       value={trend}       color={trendColor}   />
        <SignalPill label="Momentum"    value={momentum}    color={score >= 60 ? "green" : score <= 40 ? "red" : "amber"} />
        <SignalPill label="Volatility"  value={volatility}  color="violet"       />
        <SignalPill label="Pattern Bias" value={patternBias} color={patternColor} />
      </div>

      {/* Recommendation */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
          rec.color === "green"
            ? "bg-emerald-500/10 border-emerald-500/25"
            : rec.color === "red"
            ? "bg-rose-500/10 border-rose-500/25"
            : "bg-amber-500/10 border-amber-500/25"
        }`}
      >
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wider">AI Recommendation</div>
          <div
            className={`text-base font-bold mt-0.5 ${
              rec.color === "green" ? "text-emerald-400" :
              rec.color === "red"   ? "text-rose-400"   : "text-amber-400"
            }`}
          >
            {rec.label}
          </div>
        </div>
        <div className="text-3xl">
          {rec.color === "green" ? "📈" : rec.color === "red" ? "📉" : "📊"}
        </div>
      </div>

      {/* BB position */}
      <div className="text-[11px] text-muted flex justify-between">
        <span>Bollinger Band position</span>
        <span className="text-slate-300 font-mono">{bbPosition}</span>
      </div>
    </div>
  );
}

// ─── AIInsightPanel ───────────────────────────────────────────────────────────
export default function AIInsightPanel({ symbol, quote, candles, indicators, patterns, score }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    setText("");
    setTriggered(false);
    setLoading(false);
    if (abortRef.current) abortRef.current.abort();
  }, [symbol]);

  async function runExplain() {
    if (loading) return;
    setLoading(true);
    setText("");
    setTriggered(true);

    try {
      await streamExplain(
        { symbol, timeframe: "1D", include_news: true },
        {
          token: (d) => setText((t) => t + (d.text || "")),
          done: (d) => {
            if (d.confidence && !d.narrative?.toLowerCase().includes("confidence:")) {
              setText((t) => t + `\n\nConfidence: ${d.confidence}`);
            }
          },
        }
      );
    } catch (err) {
      setText("⚠️ AI analysis unavailable. Check Ollama is running.");
    } finally {
      setLoading(false);
    }
  }

  const parsed = parseInsightText(text);

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        AI Market Intelligence
      </div>

      {/* Quick analysis (always shown) */}
      <QuickAnalysis
        candles={candles}
        indicators={indicators}
        patterns={patterns}
        score={score}
      />

      {/* Divider */}
      <div className="border-t border-[rgba(99,102,241,0.1)] pt-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-slate-400">LLM Price Interpretation</span>
          <button
            onClick={runExplain}
            disabled={loading}
            className="btn-primary text-[11px] px-3 py-1.5 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                ✨ {triggered ? "Re-analyze" : "AI Explain"}
              </>
            )}
          </button>
        </div>

        {triggered && (
          <div
            className={`rounded-xl p-4 bg-black/30 border border-[rgba(99,102,241,0.1)] text-sm space-y-2 min-h-[60px] ${loading && !text ? "flex items-center justify-center" : ""}`}
          >
            {loading && !text ? (
              <div className="flex items-center gap-2 text-muted text-xs">
                <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                Querying LLM…
              </div>
            ) : (
              <div className={`space-y-2 ${loading ? "typewriter-cursor" : ""}`}>
                {parsed ?? <p className="text-xs text-muted">Processing response…</p>}
              </div>
            )}
          </div>
        )}

        {!triggered && (
          <p className="text-xs text-muted text-center py-2">
            Click "AI Explain" for LLM-powered price analysis
          </p>
        )}
      </div>
    </div>
  );
}
