/**
 * MomentumGauge.jsx
 * Institutional-grade 3-column momentum analytics dashboard.
 */
import { useMemo } from "react";
import { formatINR } from "../../utils/formatters.js";

const GAUGE_LABELS = [
  { range: [0, 20],   label: "Strong Sell",  color: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { range: [20, 40],  label: "Sell",         color: "#fb923c", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { range: [40, 60],  label: "Neutral",      color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { range: [60, 80],  label: "Buy",          color: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { range: [80, 100], label: "Strong Buy",   color: "#10b981", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
];

function getGaugeLabel(score) {
  return GAUGE_LABELS.find((g) => score >= g.range[0] && score <= g.range[1]) ?? GAUGE_LABELS[2];
}

function getGaugeColor(score) {
  if (score < 20) return "#f43f5e";
  if (score < 40) return "#fb923c";
  if (score < 60) return "#f59e0b";
  if (score < 80) return "#34d399";
  return "#10b981";
}

function ArcGauge({ score }) {
  const r = 52;
  const cx = 70, cy = 70;
  const startAngle = 210;
  const endAngle   = 330;
  const totalArc   = 360 - startAngle + endAngle;

  const polarToCart = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (from, to) => {
    const s = polarToCart(from);
    const e = polarToCart(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const scoreArc = startAngle + (score / 100) * totalArc;
  const color = getGaugeColor(score);
  const label = getGaugeLabel(score);

  return (
    <svg viewBox="0 0 140 100" className="w-full max-w-[210px] mx-auto">
      {/* Background arc */}
      <path
        d={describeArc(startAngle, startAngle + totalArc)}
        fill="none"
        stroke="rgba(99,102,241,0.08)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Score arc with dynamic transition */}
      <path
        d={describeArc(startAngle, scoreArc)}
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${color}aa)`,
          transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {/* Glow marker at end of filled arc */}
      {score > 0 && (
        <circle
          cx={polarToCart(scoreArc).x}
          cy={polarToCart(scoreArc).y}
          r="6.5"
          fill="#ffffff"
          stroke={color}
          strokeWidth="3.5"
          style={{ transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      )}
      
      {/* Score text */}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="22"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        fill={color}
        fontSize="8"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
        letterSpacing="0.08em"
      >
        {label.label.toUpperCase()}
      </text>

      {/* Zone ticks */}
      {["0", "50", "100"].map((v, i) => {
        const angle = startAngle + (Number(v) / 100) * totalArc;
        const pos = polarToCart(angle);
        return (
          <text
            key={v}
            x={pos.x + (i === 0 ? -7 : i === 2 ? 7 : 0)}
            y={pos.y + 14}
            textAnchor="middle"
            fill="#64748b"
            fontSize="6.5"
            fontWeight="bold"
          >
            {v}
          </text>
        );
      })}
    </svg>
  );
}

function MetricBar({ label, value, description, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct > 60 ? "bg-emerald-400" : pct < 40 ? "bg-rose-400" : "bg-amber-400";
  const textColor = pct > 60 ? "text-emerald-400" : pct < 40 ? "text-rose-400" : "text-amber-400";

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.02)]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] font-bold text-slate-200">{label}</span>
          <div className="text-[9px] text-slate-500 mt-0.5">{description}</div>
        </div>
        <span className={`text-[12px] font-mono font-extrabold ${textColor} tabular-nums`}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MomentumGauge({ score = 50, indicators, candles }) {
  const data = useMemo(() => {
    if (!candles?.length || !indicators) return null;
    
    const n = candles.length - 1;
    const close = candles[n]?.c ?? 0;
    const rsi = indicators.rsi?.[n] ?? 50;
    const hist = indicators.macd?.histogram?.[n] ?? 0;
    const ema20 = indicators.ema20?.[n] ?? close;
    const ema50 = indicators.ema50?.[n] ?? close;
    const atr = indicators.atr?.[n] ?? 0;
    
    // Sub-scores
    const rsiScore = Math.max(0, Math.min(100, rsi));
    const macdScore = Math.max(0, Math.min(100, 50 + hist * 6));
    const stochK = indicators.stoch?.k?.[n] ?? 50;
    
    const emaScore = close > ema20 && ema20 > ema50 ? 85 : close < ema20 && ema20 < ema50 ? 15 : 50;
    
    const trendAlign = close > ema20 && ema20 > ema50 ? "Bullish Alignment" : close < ema20 && ema20 < ema50 ? "Bearish Alignment" : "Neutral / Choppy";
    const trendAlignColor = close > ema20 && ema20 > ema50 ? "text-emerald-400" : close < ema20 && ema20 < ema50 ? "text-rose-400" : "text-amber-400";
    
    const atrPct = close ? (atr / close) * 100 : 0;

    // ── New v2 indicators ─────────────────────────────────────────
    const adx = indicators.adx?.adx?.[n] ?? null;
    const diPlus  = indicators.adx?.diPlus?.[n] ?? null;
    const diMinus = indicators.adx?.diMinus?.[n] ?? null;
    const adxTrend = adx != null
      ? (adx > 25 ? (diPlus > diMinus ? "Strong Bullish" : "Strong Bearish") : "Weak / Ranging")
      : "—";
    const adxColor = adx == null ? "text-slate-500"
      : adx < 20 ? "text-slate-400"
      : diPlus > diMinus ? "text-emerald-400" : "text-rose-400";

    const cmf = indicators.cmf?.[n] ?? null;
    const cmfLabel = cmf == null ? "—" : cmf > 0.1 ? "Buying Pressure" : cmf < -0.1 ? "Selling Pressure" : "Neutral Flow";
    const cmfColor = cmf == null ? "text-slate-500" : cmf > 0.1 ? "text-emerald-400" : cmf < -0.1 ? "text-rose-400" : "text-amber-400";

    const cci = indicators.cci?.[n] ?? null;
    const cciLabel = cci == null ? "—" : cci > 100 ? "Overbought" : cci < -100 ? "Oversold" : "Neutral Zone";
    const cciColor = cci == null ? "text-slate-500" : cci > 100 ? "text-rose-400" : cci < -100 ? "text-emerald-400" : "text-amber-400";

    const willR = indicators.williamsR?.[n] ?? null;
    const willRLabel = willR == null ? "—" : willR > -20 ? "Overbought" : willR < -80 ? "Oversold" : "Mid Range";
    const willRColor = willR == null ? "text-slate-500" : willR > -20 ? "text-rose-400" : willR < -80 ? "text-emerald-400" : "text-amber-400";

    // Ichimoku TK cross signal
    const tenkan = indicators.ichimoku?.tenkan?.[n] ?? null;
    const kijun  = indicators.ichimoku?.kijun?.[n] ?? null;
    const ichLabel = tenkan == null || kijun == null ? "—" : tenkan > kijun ? "TK Bullish Cross" : tenkan < kijun ? "TK Bearish Cross" : "TK Neutral";
    const ichColor = tenkan == null ? "text-slate-500" : tenkan > kijun ? "text-emerald-400" : tenkan < kijun ? "text-rose-400" : "text-amber-400";
    
    return {
      rsiScore, macdScore, stochK, emaScore,
      trendAlign, trendAlignColor,
      atrPct, atr, close,
      adx, adxTrend, adxColor,
      cmf, cmfLabel, cmfColor,
      cci, cciLabel, cciColor,
      willR, willRLabel, willRColor,
      ichLabel, ichColor,
      rsi, hist,
    };
  }, [indicators, candles]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-28 text-muted text-xs">
        Calculating momentum indices...
      </div>
    );
  }

  const { rsiScore, macdScore, stochK, emaScore, trendAlign, trendAlignColor, atrPct, atr, close } = data;
  const label = getGaugeLabel(score);

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-[rgba(99,102,241,0.1)]">
        Composite Momentum &amp; Trend Intensity
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Composite Arc Gauge */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Composite Momentum Index
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between items-center text-center">
            <div className="py-2 w-full">
              <ArcGauge score={score} />
            </div>
            
            <div className={`mt-2 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase ${label.bg} ${label.border}`} style={{ color: label.color }}>
              Composite Recommendation: {label.label}
            </div>
            
            <p className="text-[9.5px] text-slate-500 leading-relaxed mt-3">
              Composite rating combines relative strength, MACD price velocity, trendline positioning, and exponential moving average alignment indicators.
            </p>
          </div>
        </div>

        {/* Column 2: Oscillator Sub-Metrics */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Core Momentum Oscillators
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between gap-3">
            <div className="space-y-2.5">
              <MetricBar
                label="RSI (Relative Strength)"
                value={rsiScore}
                description="Measures current speed and rate of price changes"
              />
              <MetricBar
                label="MACD Histogram Momentum"
                value={macdScore}
                description="Displays speed difference between EMAs"
              />
              <MetricBar
                label="Stochastic Fast Oscillator"
                value={stochK}
                description="Compares closing price to recent range high/low"
              />
            </div>
            <div className="text-[8.5px] text-slate-500 leading-normal text-center">
              Oscillators are calculated in real time. Values above 70 indicate overbought conditions, below 30 indicate oversold.
            </div>
          </div>
        </div>

        {/* Column 3: Trend Intensity & Volatility */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Trend Intensity &amp; Volatility
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between gap-4">
            
            {/* Metric 1: EMA alignment */}
            <div className="p-3 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.02)] space-y-1">
              <div className="text-[9px] text-muted uppercase tracking-wider font-bold">Trend Alignment State</div>
              <div className={`text-xs font-black ${trendAlignColor} mt-0.5`}>
                {trendAlign}
              </div>
              <p className="text-[10px] text-slate-400 leading-snug mt-1">
                {emaScore > 70 ? (
                  "Closing price is trading systematically above the 20 and 50 period Exponential Moving Averages, supporting aggressive upward swings."
                ) : emaScore < 30 ? (
                  "Price is falling heavily below both the 20 and 50 period moving averages, confirming sustained downward distribution pressure."
                ) : (
                  "Moving averages are tangled and horizontal. Market is trading sideways without any sustainable momentum direction."
                )}
              </p>
            </div>

            {/* Metric 2: ATR volatility */}
            <div className="p-3 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.02)] space-y-1">
              <div className="text-[9px] text-muted uppercase tracking-wider font-bold">Average True Range (ATR) volatility</div>
              <div className="flex justify-between items-baseline mt-0.5">
                <span className="text-xs font-bold text-slate-100 font-mono">{formatINR(atr)}</span>
                <span className="text-[10px] text-indigo-400 font-extrabold font-mono">{atrPct.toFixed(2)}% of Price</span>
              </div>
              <div className="h-1 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, atrPct * 20)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-snug mt-1">
                ATR tracks raw asset volatility. A higher percentage suggests high intraday fluctuations, favoring swing trading and wider stop levels.
              </p>
            </div>

            {/* Metric 3: Advanced Indicator Signals (v2) */}
            <div className="p-3 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.02)] space-y-2">
              <div className="text-[9px] text-muted uppercase tracking-wider font-bold">Advanced Signal Confluence</div>
              <div className="grid grid-cols-1 gap-1.5 mt-1">
                {[
                  { label: "ADX Trend", value: data.adxTrend, color: data.adxColor, raw: data.adx != null ? data.adx.toFixed(0) : null, unit: "ADX" },
                  { label: "CMF Flow",  value: data.cmfLabel,  color: data.cmfColor,  raw: data.cmf != null ? data.cmf.toFixed(3) : null, unit: "CMF" },
                  { label: "CCI Zone",  value: data.cciLabel,  color: data.cciColor,  raw: data.cci != null ? data.cci.toFixed(0) : null, unit: "CCI" },
                  { label: "Williams %R", value: data.willRLabel, color: data.willRColor, raw: data.willR != null ? data.willR.toFixed(0) : null, unit: "%R" },
                  { label: "Ichimoku",  value: data.ichLabel,  color: data.ichColor,  raw: null, unit: null },
                ].map(({ label, value, color, raw, unit }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {raw && <span className="text-[9px] font-mono text-slate-500">{unit}:{raw}</span>}
                      <span className={`text-[9px] font-bold ${color}`}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
