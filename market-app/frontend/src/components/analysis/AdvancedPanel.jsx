import { useMemo } from "react";
import { formatINR } from "../../utils/formatters.js";

// ─── Trend Classification & Signals ───────────────────────────────────────────
function classifyTrend(slope, closes) {
  if (slope == null || !closes || closes.length < 2) return { label: "—", color: "text-slate-400", desc: "", emoji: "📊" };
  
  // Normalize slope relative to price level to make it scale-independent
  const avgPrice = closes.reduce((s, v) => s + v, 0) / closes.length;
  const normSlope = (slope / avgPrice) * 100 * 30; // % change projected over 30 candles
  
  if (normSlope >= 5.0) {
    return {
      label: "Aggressive Bullish Markup",
      color: "text-emerald-400",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      desc: "Strong upwards structural breakout. Momentum is backed by institutional buying. Favors breakout trades and trailing stops.",
      emoji: "🚀",
      bias: "Highly Bullish"
    };
  }
  if (normSlope >= 1.0) {
    return {
      label: "Steady Bullish Progression",
      color: "text-emerald-300",
      bg: "rgba(52,211,153,0.05)",
      border: "rgba(52,211,153,0.15)",
      desc: "Healthy climbing channel with sustainable higher highs and higher lows. Ideal for buying structural dips near support trendlines.",
      emoji: "📈",
      bias: "Bullish"
    };
  }
  if (normSlope <= -5.0) {
    return {
      label: "Aggressive Bearish Markdown",
      color: "text-rose-500",
      bg: "rgba(244,63,94,0.08)",
      border: "rgba(244,63,94,0.2)",
      desc: "Severe cascading markdown. Panic-driven liquidations are dominating. High risk for bargain hunters. Capital preservation recommended.",
      emoji: "💥",
      bias: "Highly Bearish"
    };
  }
  if (normSlope <= -1.0) {
    return {
      label: "Steady Bearish Correction",
      color: "text-rose-400",
      bg: "rgba(251,113,133,0.05)",
      border: "rgba(251,113,133,0.15)",
      desc: "Descend channel. Supply overhang is actively pressing prices down. Focus on short entries on relief rallies near resistance trendlines.",
      emoji: "📉",
      bias: "Bearish"
    };
  }
  return {
    label: "Neutral Sideways Consolidation",
    color: "text-amber-400",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.15)",
    desc: "Tightly bound consolidation range. Accumulation/distribution cycle in play. Wait for a clean directional range breakout.",
    emoji: "↕️",
    bias: "Neutral"
  };
}

// ─── Row Component ────────────────────────────────────────────────────────────
function ValueRow({ label, value, subtext, color = "text-slate-300" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(99,102,241,0.06)] last:border-0">
      <div>
        <div className="text-[11px] text-muted font-medium">{label}</div>
        {subtext && <div className="text-[9px] text-slate-500 mt-0.5">{subtext}</div>}
      </div>
      <div className={`text-xs font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ─── AdvancedPanel ────────────────────────────────────────────────────────────
export default function AdvancedPanel({ indicators, candles, fundamentals }) {
  const data = useMemo(() => {
    if (!indicators || !candles?.length) return null;
    const closes = candles.map((c) => c.c);
    const price = closes.at(-1);
    const n = closes.length;

    // Linear regression params
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += closes[i];
      sumXY += i * closes[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate Standard Error (Standard Deviation of residuals)
    let sumResidualSq = 0;
    for (let i = 0; i < n; i++) {
      const pred = slope * i + intercept;
      sumResidualSq += (closes[i] - pred) ** 2;
    }
    const stdErr = Math.sqrt(sumResidualSq / n);

    // AI estimations projected 15 bars into the future
    const targetBase = slope * (n + 15) + intercept;
    const targetUpper = targetBase + 1.96 * stdErr; // 95% Confidence boundary
    const targetLower = targetBase - 1.96 * stdErr; // 95% Confidence boundary

    // Current price channel positioning
    const currentTrendVal = slope * (n - 1) + intercept;
    const currentUpper = currentTrendVal + 1.618 * stdErr;
    const currentLower = currentTrendVal - 1.618 * stdErr;
    const channelPositionPct = ((price - currentLower) / (currentUpper - currentLower)) * 100;

    // Stop Loss & Take Profit projections based on estimation bounds
    const recommendedTP = price + Math.abs(slope * 10) + 1.2 * stdErr;
    const recommendedSL = price - Math.abs(slope * 10) - 1.2 * stdErr;

    // CMF History (last 10 elements)
    const cmfHist = indicators.cmf ? indicators.cmf.slice(-10) : [];
    const currentCmf = indicators.cmf?.at(-1);

    // CCI
    const currentCci = indicators.cci?.at(-1);

    // Compute 52-week boundaries from candles as fallback
    let high52w = candles[0]?.h ?? price;
    let low52w = candles[0]?.l ?? price;
    for (let i = 0; i < candles.length; i++) {
      if (candles[i].h > high52w) high52w = candles[i].h;
      if (candles[i].l < low52w) low52w = candles[i].l;
    }

    return {
      price,
      slope,
      intercept,
      stdErr,
      targetBase,
      targetUpper,
      targetLower,
      channelPositionPct,
      recommendedTP,
      recommendedSL,
      closes,
      cmfHist,
      currentCmf,
      currentCci,
      high52w,
      low52w
    };
  }, [indicators, candles]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-32 text-muted text-xs">
        Compiling advanced models…
      </div>
    );
  }

  const {
    price,
    slope,
    intercept,
    stdErr,
    targetBase,
    targetUpper,
    targetLower,
    channelPositionPct,
    recommendedTP,
    recommendedSL,
    closes,
    cmfHist,
    currentCmf,
    currentCci,
    high52w,
    low52w
  } = data;

  const trend = classifyTrend(slope, closes);
  const equation = `y = ${slope >= 0 ? "+" : ""}${slope.toFixed(3)}x + ${intercept.toFixed(1)}`;
  
  const clampedChanPos = Math.max(0, Math.min(100, channelPositionPct));

  // Determine 52-week metrics (prefer fundamentals, fall back to candles scan)
  const displayHigh52w = fundamentals?.["52w_high"] ?? high52w;
  const displayLow52w = fundamentals?.["52w_low"] ?? low52w;
  const displayPosPct = fundamentals?.["52w_position_pct"] != null
    ? fundamentals["52w_position_pct"]
    : (displayHigh52w !== displayLow52w 
        ? ((price - displayLow52w) / (displayHigh52w - displayLow52w)) * 100 
        : 50);
  const clamped52wPos = Math.max(0, Math.min(100, displayPosPct));

  // CCI zone parsing
  let cciZone = "Neutral";
  let cciColor = "text-slate-400";
  if (currentCci > 100) {
    cciZone = "Overbought (+100)";
    cciColor = "text-rose-400";
  } else if (currentCci < -100) {
    cciZone = "Oversold (-100)";
    cciColor = "text-emerald-400";
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-[rgba(99,102,241,0.1)]">
        Advanced Model Analysis
      </div>

      {/* Trend Map Card */}
      <div
        className="p-3.5 rounded-xl border space-y-2 transition-all duration-300"
        style={{
          background: trend.bg || "rgba(15,23,42,0.8)",
          borderColor: trend.border || "rgba(99,102,241,0.1)"
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted uppercase tracking-wider">Trend Mapping</span>
          <span className={`text-[12px] font-bold ${trend.color} flex items-center gap-1`}>
            {trend.emoji} {trend.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
          {trend.desc}
        </p>
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-2 pt-2 border-t border-[rgba(255,255,255,0.03)]">
          <span>REGRESSION CONSTANT</span>
          <span className="text-slate-400">{equation}</span>
        </div>
      </div>

      {/* 52-Week Range Position Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span className="uppercase tracking-wider font-semibold">52-Week Range Position</span>
          <span className="font-mono text-slate-300 font-bold">{displayPosPct.toFixed(1)}%</span>
        </div>
        <div className="relative h-6 bg-slate-900/80 rounded-lg border border-[rgba(255,255,255,0.05)] overflow-hidden flex items-center px-2.5">
          <div className="absolute inset-0 flex justify-between px-2 items-center text-[7.5px] text-slate-500 select-none z-0">
            <span>52W LOW ({formatINR(displayLow52w)})</span>
            <span>52W HIGH ({formatINR(displayHigh52w)})</span>
          </div>
          {/* Progress bar */}
          <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-1000 bg-indigo-500/15"
            style={{ width: `${clamped52wPos}%`, zIndex: 1 }}
          />
          {/* Pin */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 shadow-lg transition-all duration-1000"
            style={{ left: `${clamped52wPos}%`, zIndex: 2 }}
          />
        </div>
      </div>

      {/* CMF Accumulation Mini Chart */}
      <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chaikin Money Flow (CMF)</span>
          <span className={`text-xs font-mono font-bold ${currentCmf >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {currentCmf != null ? (currentCmf >= 0 ? "+" : "") + currentCmf.toFixed(2) : "—"}
          </span>
        </div>
        
        {cmfHist.length > 0 ? (
          <div className="flex gap-1.5 items-end justify-between h-10 pt-2 border-b border-[rgba(255,255,255,0.03)] pb-1">
            {cmfHist.map((val, idx) => {
              if (val == null) return <div key={idx} className="flex-1 h-0.5 bg-slate-800" />;
              const scale = Math.min(100, Math.abs(val) * 100 * 2.5); // scale for chart height
              const isPos = val >= 0;
              return (
                <div 
                  key={idx} 
                  title={`CMF: ${val.toFixed(2)}`}
                  className="flex-1 flex flex-col items-center justify-end h-full bg-slate-950/30 rounded-sm relative group cursor-pointer"
                >
                  <div 
                    style={{ height: `${Math.max(10, scale)}%` }}
                    className={`w-full rounded-sm transition-all ${isPos ? "bg-emerald-500/80 group-hover:bg-emerald-400" : "bg-rose-500/80 group-hover:bg-rose-400"}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 text-center py-2">No CMF history available</div>
        )}
        <div className="text-[8px] text-slate-500 text-right italic font-mono uppercase tracking-wider">
          Last 10 bars money flow density (Accumulation vs Distribution)
        </div>
      </div>

      {/* CCI Panel */}
      <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Commodity Channel Index (CCI)</span>
          <span className={`text-xs font-mono font-bold ${cciColor}`}>
            {currentCci != null ? currentCci.toFixed(1) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-slate-500">Signal Context:</span>
          <span className={`font-semibold ${cciColor}`}>{cciZone}</span>
        </div>
      </div>

      {/* Target Estimations */}
      <div className="space-y-2">
        <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
          AI 15-Bar Forecast Range
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] space-y-1.5">
          <ValueRow
            label="Upper Estimation Bound"
            value={formatINR(targetUpper)}
            subtext="95% upper projection boundary"
            color="text-emerald-400"
          />
          <ValueRow
            label="Forecast Center Price"
            value={formatINR(targetBase)}
            subtext="Projected regression coordinate"
            color="text-indigo-300"
          />
          <ValueRow
            label="Lower Estimation Bound"
            value={formatINR(targetLower)}
            subtext="95% lower projection boundary"
            color="text-rose-400"
          />
        </div>
      </div>

      {/* Regression Channel Meter */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span className="uppercase tracking-wider font-semibold">Trend Channel Location</span>
          <span className="font-mono text-slate-300">{channelPositionPct.toFixed(0)}%</span>
        </div>
        <div className="relative h-6 bg-slate-900/80 rounded-lg border border-[rgba(99,102,241,0.06)] overflow-hidden">
          <div className="absolute inset-0 flex justify-between px-2 items-center text-[8px] text-slate-500 select-none z-0">
            <span>OVERSOLD (-1.6σ)</span>
            <span>OVERBOUGHT (+1.6σ)</span>
          </div>
          <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-1000 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-rose-500/20"
            style={{ width: `${clampedChanPos}%`, zIndex: 1 }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 shadow-glow-accent transition-all duration-1000"
            style={{ left: `${clampedChanPos}%`, zIndex: 2 }}
          />
        </div>
        <div className="text-[9px] text-slate-500 text-center">
          Current price placement relative to the standard deviation regression envelope
        </div>
      </div>

      {/* AI Recommendations & Levels */}
      <div className="space-y-2">
        <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
          AI Risk-Reward Zones
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
            <div className="text-[9px] text-emerald-500/60 uppercase tracking-wider">Estimated Target</div>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{formatINR(recommendedTP)}</div>
            <div className="text-[8px] text-slate-500 mt-1">Recommended Take-Profit Zone</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-center">
            <div className="text-[9px] text-rose-500/60 uppercase tracking-wider">Stop Loss Anchor</div>
            <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">{formatINR(recommendedSL)}</div>
            <div className="text-[8px] text-slate-500 mt-1">Recommended Structural Guard</div>
          </div>
        </div>
      </div>
    </div>
  );
}
