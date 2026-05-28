/**
 * PatternPanel.jsx
 * Detected candlestick patterns list with direction badge, confidence, and explanation.
 */
import { useState } from "react";
import { PATTERN_COLORS } from "./PatternEngine.js";

const DIR_LABEL = {
  bullish: { text: "Bullish", bg: "bg-emerald-500/15", border: "border-emerald-500/25", text_color: "text-emerald-400" },
  bearish: { text: "Bearish", bg: "bg-rose-500/15",    border: "border-rose-500/25",    text_color: "text-rose-400" },
  neutral: { text: "Neutral", bg: "bg-amber-500/15",   border: "border-amber-500/25",   text_color: "text-amber-400" },
};

function ConfidenceBar({ value, direction }) {
  const color =
    direction === "bullish" ? "#10b981"
    : direction === "bearish" ? "#f43f5e"
    : "#f59e0b";

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>
      <span className="text-[10px] text-muted tabular-nums shrink-0">{value}%</span>
    </div>
  );
}

function PatternCard({ pattern }) {
  const dir = DIR_LABEL[pattern.direction] ?? DIR_LABEL.neutral;

  return (
    <div
      className="group rounded-xl border border-[rgba(99,102,241,0.12)] bg-surface/40 hover:bg-surface/70 hover:border-[rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-slate-900/60 border border-[rgba(99,102,241,0.08)] leading-none">{pattern.emoji}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-100 leading-snug">
                  {pattern.type}
                </div>
                <div className="text-[10px] text-muted mt-0.5">
                  Bar #{pattern.barIndex + 1} of timeframe
                </div>
              </div>
            </div>
            <div className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${dir.bg} ${dir.border} ${dir.text_color}`}>
              {dir.text}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted font-medium">Detection Confidence</span>
              <span
                className="text-[10px] font-extrabold"
                style={{ color: PATTERN_COLORS[pattern.direction] }}
              >
                {pattern.confidence}%
              </span>
            </div>
            <ConfidenceBar value={pattern.confidence} direction={pattern.direction} />
          </div>

          <p className="text-[11.5px] text-slate-400 leading-relaxed mt-4 border-t border-[rgba(99,102,241,0.06)] pt-3">
            {pattern.description}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg bg-black/40 border border-[rgba(255,255,255,0.02)] p-2">
            <div className="text-[8px] text-muted font-semibold tracking-wider uppercase">Structural Bias</div>
            <div className={`text-[11px] font-bold mt-0.5 ${dir.text_color}`}>
              {pattern.direction === "bullish" ? "📈 Bullish Markup" : pattern.direction === "bearish" ? "📉 Bearish Markdown" : "⟷ Sideways"}
            </div>
          </div>
          <div className="rounded-lg bg-black/40 border border-[rgba(255,255,255,0.02)] p-2">
            <div className="text-[8px] text-muted font-semibold tracking-wider uppercase">Accuracy Rate</div>
            <div className="text-[11px] font-bold text-slate-300 mt-0.5 font-mono">
              {pattern.successRate}% Win
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatternPanel({ patterns = [] }) {
  const bullish = patterns.filter((p) => p.direction === "bullish");
  const bearish = patterns.filter((p) => p.direction === "bearish");
  const neutral = patterns.filter((p) => p.direction === "neutral");

  if (!patterns.length) {
    return (
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
        <span className="text-2xl">🔍</span>
        <p className="text-xs text-muted">No significant patterns detected in this timeframe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-[rgba(99,102,241,0.1)]">
        Candlestick Pattern Matrix
        <span className="ml-2 text-accent-light font-normal">({patterns.length} patterns identified)</span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2">
        {bullish.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
            ↑ {bullish.length} Bullish Patterns
          </div>
        )}
        {bearish.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 font-medium">
            ↓ {bearish.length} Bearish Patterns
          </div>
        )}
        {neutral.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-medium">
            ⟷ {neutral.length} Neutral Patterns
          </div>
        )}
      </div>

      {/* Pattern cards (most recent first) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...patterns].reverse().map((p, idx) => (
          <PatternCard key={`${p.type}-${p.barIndex}-${idx}`} pattern={p} />
        ))}
      </div>

      <p className="text-[10px] text-muted text-center pt-2">
        Patterns detected automatically based on candle shapes & body ratios. Not financial advice.
      </p>
    </div>
  );
}
