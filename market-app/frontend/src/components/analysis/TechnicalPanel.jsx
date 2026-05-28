/**
 * TechnicalPanel.jsx
 * Displays technical indicator readings with color-coded signal interpretation.
 * Includes standard metrics and advanced checks like ADX and Williams %R.
 */
import { useMemo } from "react";
import { formatINR } from "../../utils/formatters.js";

// ─── RSI Interpretation ───────────────────────────────────────────────────────
function rsiSignal(v) {
  if (v == null) return { label: "—", color: "text-muted" };
  if (v >= 80) return { label: "Strongly Overbought", color: "text-rose-400" };
  if (v >= 70) return { label: "Overbought", color: "text-orange-400" };
  if (v >= 60) return { label: "Bullish", color: "text-emerald-400" };
  if (v >= 40) return { label: "Neutral", color: "text-slate-400" };
  if (v >= 30) return { label: "Bearish", color: "text-amber-400" };
  return { label: "Oversold", color: "text-emerald-400" }; // oversold = buy opp
}

// ─── MACD Interpretation ──────────────────────────────────────────────────────
function macdSignal(hist) {
  if (hist == null) return { label: "—", color: "text-muted" };
  if (hist > 0.5) return { label: "Strong Bullish", color: "text-emerald-400" };
  if (hist > 0)   return { label: "Bullish", color: "text-emerald-300" };
  if (hist > -0.5)return { label: "Bearish", color: "text-rose-300" };
  return { label: "Strong Bearish", color: "text-rose-400" };
}

// ─── Bollinger Band position ───────────────────────────────────────────────────
function bbSignal(price, upper, lower, middle) {
  if (!price || !upper || !lower) return { label: "—", color: "text-muted" };
  if (price > upper)  return { label: "Above Upper Band", color: "text-rose-400" };
  if (price > middle) return { label: "Upper Half", color: "text-emerald-300" };
  if (price < lower)  return { label: "Below Lower Band", color: "text-emerald-400" };
  return { label: "Lower Half", color: "text-amber-300" };
}

// ─── ATR formatting ───────────────────────────────────────────────────────────
function atrText(atr, price) {
  if (!atr || !price) return "—";
  const pct = ((atr / price) * 100).toFixed(2);
  return `${formatINR(atr)} (${pct}% vol)`;
}

// ─── EMA alignment check ──────────────────────────────────────────────────────
function emaAlignment(price, ema20, ema50, ema200) {
  if (!price || !ema20 || !ema50) return { label: "—", color: "text-muted" };
  if (price > ema20 && ema20 > ema50) {
    if (ema200 && ema50 > ema200) return { label: "Strong Uptrend", color: "text-emerald-400" };
    return { label: "Uptrend", color: "text-emerald-300" };
  }
  if (price < ema20 && ema20 < ema50) {
    if (ema200 && ema50 < ema200) return { label: "Strong Downtrend", color: "text-rose-400" };
    return { label: "Downtrend", color: "text-rose-300" };
  }
  return { label: "Mixed / Consolidating", color: "text-amber-300" };
}

// ─── Stochastic signal ────────────────────────────────────────────────────────
function stochSignal(k, d) {
  if (k == null) return { label: "—", color: "text-muted" };
  if (k > 80 && d > 80)  return { label: "Overbought", color: "text-rose-400" };
  if (k < 20 && d < 20)  return { label: "Oversold", color: "text-emerald-400" };
  if (k > d && k < 80)   return { label: "Rising", color: "text-emerald-300" };
  if (k < d && k > 20)   return { label: "Falling", color: "text-rose-300" };
  return { label: "Neutral", color: "text-slate-400" };
}

// ─── ADX Signal ───────────────────────────────────────────────────────────────
function adxSignal(adx, diPlus, diMinus) {
  if (adx == null) return { label: "—", color: "text-muted" };
  let trendStrength = "Weak Trend";
  let color = "text-slate-400";
  if (adx > 40) {
    trendStrength = "Extremely Strong Trend";
    color = "text-fuchsia-400";
  } else if (adx > 25) {
    trendStrength = "Strong Trend";
    color = "text-indigo-400";
  }

  const direction = diPlus > diMinus ? "Bullish (DI+ > DI-)" : "Bearish (DI- > DI+)";
  return { label: `${trendStrength} · ${direction}`, color };
}

// ─── Williams %R Signal ───────────────────────────────────────────────────────
function williamsRSignal(v) {
  if (v == null) return { label: "—", color: "text-muted" };
  if (v >= -20) return { label: "Overbought", color: "text-rose-400" };
  if (v <= -80) return { label: "Oversold", color: "text-emerald-400" };
  return { label: "Neutral Zone", color: "text-slate-400" };
}

// ─── Row component ────────────────────────────────────────────────────────────
function IndicatorRow({ label, value, signal, meter, meterColor }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[rgba(99,102,241,0.07)] last:border-0">
      <div className="min-w-0">
        <div className="text-[11px] text-muted font-medium">{label}</div>
        {signal && (
          <div className={`text-[10px] font-semibold mt-0.5 ${signal.color}`}>
            {signal.label}
          </div>
        )}
      </div>
      <div className="ml-4 text-right shrink-0">
        <div className="text-xs text-slate-300 font-mono tabular-nums">{value}</div>
        {meter != null && (
          <div className="mt-1 w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, Math.min(100, meter))}%`,
                background: meterColor || (meter > 70 ? "#f43f5e" : meter < 30 ? "#10b981" : "#6366f1"),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TechnicalPanel ───────────────────────────────────────────────────────────
export default function TechnicalPanel({ indicators, candles }) {
  const data = useMemo(() => {
    if (!indicators || !candles?.length) return null;
    const price = candles.at(-1)?.c;
    const n = candles.length - 1;

    const rsiVal  = indicators.rsi?.[n];
    const histVal = indicators.macd?.histogram?.[n];
    const macdVal = indicators.macd?.macdLine?.[n];
    const sigVal  = indicators.macd?.signalLine?.[n];
    const bbU     = indicators.bb?.upper?.[n];
    const bbL     = indicators.bb?.lower?.[n];
    const bbM     = indicators.bb?.middle?.[n];
    const ema9    = indicators.ema9?.[n];
    const ema20   = indicators.ema20?.[n];
    const ema50   = indicators.ema50?.[n];
    const ema200  = indicators.ema200?.[n];
    const atr     = indicators.atr?.[n];
    const stochK  = indicators.stoch?.k?.[n];
    const stochD  = indicators.stoch?.d?.[n];
    const vwap    = indicators.vwap?.[n];

    // Advanced additions
    const adxVal  = indicators.adx?.adx?.[n];
    const diPlus  = indicators.adx?.diPlus?.[n];
    const diMinus = indicators.adx?.diMinus?.[n];
    const willR   = indicators.williamsR?.[n];

    return {
      price, rsiVal, histVal, macdVal, sigVal,
      bbU, bbL, bbM, ema9, ema20, ema50, ema200,
      atr, stochK, stochD, vwap, adxVal, diPlus, diMinus, willR
    };
  }, [indicators, candles]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-32 text-muted text-xs">
        Computing indicators…
      </div>
    );
  }

  const { price, rsiVal, histVal, macdVal, sigVal, bbU, bbL, bbM,
          ema9, ema20, ema50, ema200, atr, stochK, stochD, vwap,
          adxVal, diPlus, diMinus, willR } = data;

  const rsiSig  = rsiSignal(rsiVal);
  const macdSig = macdSignal(histVal);
  const bbSig   = bbSignal(price, bbU, bbL, bbM);
  const emaSig  = emaAlignment(price, ema20, ema50, ema200);
  const stSig   = stochSignal(stochK, stochD);
  const adxSig  = adxSignal(adxVal, diPlus, diMinus);
  const willSig = williamsRSignal(willR);

  return (
    <div className="space-y-0">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-2 mb-1">
        Technical Indicators
      </div>

      <IndicatorRow
        label="RSI (14)"
        value={rsiVal != null ? rsiVal.toFixed(1) : "—"}
        signal={rsiSig}
        meter={rsiVal}
      />
      <IndicatorRow
        label="MACD"
        value={
          macdVal != null
            ? `${macdVal.toFixed(2)} / ${sigVal?.toFixed(2) ?? "—"}`
            : "—"
        }
        signal={macdSig}
        meter={histVal != null ? Math.min(100, Math.max(0, 50 + histVal * 10)) : null}
      />
      <IndicatorRow
        label="Bollinger Bands"
        value={bbU != null ? `${formatINR(bbL)} – ${formatINR(bbU)}` : "—"}
        signal={bbSig}
      />
      <IndicatorRow
        label="EMA Trend"
        value={
          ema20 != null
            ? `9: ${formatINR(ema9)} · 20: ${formatINR(ema20)}`
            : "—"
        }
        signal={emaSig}
      />
      <IndicatorRow
        label="EMA 50 / 200"
        value={
          ema50 != null
            ? `${formatINR(ema50)} / ${ema200 != null ? formatINR(ema200) : "N/A"}`
            : "—"
        }
      />
      <IndicatorRow
        label="VWAP"
        value={vwap != null ? formatINR(vwap) : "—"}
        signal={
          vwap && price
            ? {
                label: price > vwap ? "Above VWAP" : "Below VWAP",
                color: price > vwap ? "text-emerald-400" : "text-rose-400",
              }
            : null
        }
      />
      <IndicatorRow
        label="ADX (14) &amp; Direction"
        value={adxVal != null ? `ADX: ${adxVal.toFixed(1)} (DI+: ${diPlus?.toFixed(1) ?? "—"} / DI-: ${diMinus?.toFixed(1) ?? "—"})` : "—"}
        signal={adxSig}
        meter={adxVal}
        meterColor={adxVal > 25 ? "#818cf8" : "#94a3b8"}
      />
      <IndicatorRow
        label="Williams %R (14)"
        value={willR != null ? willR.toFixed(1) : "—"}
        signal={willSig}
        meter={willR != null ? Math.max(0, 100 + willR) : null}
        meterColor={willR > -20 ? "#f43f5e" : willR < -80 ? "#10b981" : "#6366f1"}
      />
      <IndicatorRow
        label="ATR (14)"
        value={atrText(atr, price)}
      />
      <IndicatorRow
        label="Stochastic (14,3)"
        value={stochK != null ? `%K: ${stochK.toFixed(1)} · %D: ${stochD?.toFixed(1) ?? "—"}` : "—"}
        signal={stSig}
        meter={stochK}
      />
    </div>
  );
}
