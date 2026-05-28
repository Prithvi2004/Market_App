/**
 * SupportResistance.jsx
 * Premium multi-column dashboard displaying Pivot Points, Structural S/R Zones, and Fibonacci levels.
 */
import { useMemo } from "react";
import { formatINR } from "../../utils/formatters.js";

function PivotRow({ label, price, currentPrice, type }) {
  const isR = type === "resistance";
  const isPP = type === "pivot";
  
  let color = "text-slate-300";
  let bg = "bg-slate-800/20";
  let border = "border-slate-700/20";
  
  if (isR) {
    color = "text-rose-400";
    bg = "bg-rose-500/5";
    border = "border-rose-500/15";
  } else if (!isPP) {
    color = "text-emerald-400";
    bg = "bg-emerald-500/5";
    border = "border-emerald-500/15";
  } else {
    color = "text-indigo-400";
    bg = "bg-indigo-500/10";
    border = "border-indigo-500/25";
  }

  const dist = currentPrice ? ((price - currentPrice) / currentPrice) * 100 : 0;
  const isCurrent = Math.abs(dist) < 0.75;

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-lg border ${bg} ${border} ${
        isCurrent ? "ring-1 ring-accent-light/40 shadow-lg bg-indigo-500/10" : ""
      } transition-all duration-300`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/40 ${color}`}>
          {label}
        </span>
        <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
          {formatINR(price)}
        </span>
        {isCurrent && (
          <span className="text-[8px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded border border-accent/30 font-bold uppercase tracking-wider animate-pulse">
            Active
          </span>
        )}
      </div>
      <span className={`text-[10px] font-bold font-mono tabular-nums ${dist > 0 ? "text-rose-400" : dist < 0 ? "text-emerald-400" : "text-slate-400"}`}>
        {dist > 0 ? "↑ +" : dist < 0 ? "↓ " : ""}
        {dist.toFixed(2)}%
      </span>
    </div>
  );
}

function LevelRow({ level, type, price }) {
  const isR = type === "resistance";
  const color = isR ? "text-rose-400" : "text-emerald-400";
  const bg = isR ? "bg-rose-500/10" : "bg-emerald-500/10";
  const border = isR ? "border-rose-500/20" : "border-emerald-500/20";
  const dist = price ? ((level - price) / price) * 100 : 0;
  const isCurrent = Math.abs(dist) < 1;

  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${bg} ${border} ${
        isCurrent ? "ring-1 ring-accent/30 shadow-md" : ""
      } hover:bg-slate-900/40 transition duration-150`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/30 ${color}`}>
          {isR ? "RESIST" : "SUPPORT"}
        </span>
        <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
          {formatINR(level)}
        </span>
        {isCurrent && (
          <span className="text-[8px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded border border-accent/30 font-bold uppercase">
            Near Price
          </span>
        )}
      </div>
      <span className={`text-[10px] font-bold font-mono tabular-nums ${dist > 0 ? "text-rose-400" : "text-emerald-400"}`}>
        {dist > 0 ? "+" : ""}
        {dist.toFixed(2)}%
      </span>
    </div>
  );
}

export default function SupportResistance({ indicators, candles }) {
  const price = candles?.at(-1)?.c ?? 0;

  // 1. Calculate Standard Classic Pivot Points based on previous day/bar candle
  const pivots = useMemo(() => {
    if (!candles || candles.length < 2) return null;
    const lastCandle = candles[candles.length - 2];
    const h = lastCandle.h;
    const l = lastCandle.l;
    const c = lastCandle.c;

    const pp = (h + l + c) / 3;
    const r1 = 2 * pp - l;
    const s1 = 2 * pp - h;
    const r2 = pp + (h - l);
    const s2 = pp - (h - l);
    const r3 = h + 2 * (pp - l);
    const s3 = l - 2 * (h - pp);

    return { pp, r1, s1, r2, s2, r3, s3 };
  }, [candles]);

  // 2. Extract structural support / resistance levels
  const levels = useMemo(() => {
    const sr = indicators?.sr;
    if (!sr) return [];

    return [
      ...sr.resistance
        .filter(Number.isFinite)
        .map((l) => ({ level: l, type: "resistance" })),
      ...sr.support
        .filter(Number.isFinite)
        .map((l) => ({ level: l, type: "support" })),
    ].sort((a, b) => b.level - a.level);
  }, [indicators]);

  const fib = indicators?.fib;

  if (!levels.length && !pivots) {
    return (
      <div className="flex items-center justify-center h-28 text-xs text-muted">
        Not enough historical data for S/R or Pivot calculation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-[rgba(99,102,241,0.1)]">
        Structural Levels & Pivot Matrix
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Daily Pivot Points */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Classic Daily Pivot Points
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between gap-2.5">
            {pivots ? (
              <div className="space-y-2">
                <PivotRow label="R3" price={pivots.r3} currentPrice={price} type="resistance" />
                <PivotRow label="R2" price={pivots.r2} currentPrice={price} type="resistance" />
                <PivotRow label="R1" price={pivots.r1} currentPrice={price} type="resistance" />
                <PivotRow label="PP" price={pivots.pp} currentPrice={price} type="pivot" />
                <PivotRow label="S1" price={pivots.s1} currentPrice={price} type="support" />
                <PivotRow label="S2" price={pivots.s2} currentPrice={price} type="support" />
                <PivotRow label="S3" price={pivots.s3} currentPrice={price} type="support" />
              </div>
            ) : (
              <div className="text-xs text-muted text-center py-8">Pivot calculations loading...</div>
            )}
            <div className="text-[8.5px] text-slate-500 leading-normal text-center mt-2">
              Calculated using the High, Low, and Close of the previous full trading interval.
            </div>
          </div>
        </div>

        {/* Column 2: Structural Levels List */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Structural High/Low Key Levels
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between gap-4">
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
              {levels.length > 0 ? (
                levels.map((l, i) => (
                  <LevelRow key={i} level={l.level} type={l.type} price={price} />
                ))
              ) : (
                <div className="text-xs text-muted text-center py-8">No structural levels resolved</div>
              )}
            </div>

            {/* Current price badge */}
            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-accent/15 border border-accent/25 mt-auto">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Current Close Price</span>
              </div>
              <span className="text-sm font-mono font-black text-accent-light tabular-nums">
                {formatINR(price)}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Fibonacci Retracements */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            Fibonacci Retracement Grid
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-[rgba(99,102,241,0.08)] flex flex-col justify-between">
            {fib ? (
              <div className="space-y-2">
                {fib.levels.map((l) => {
                  const dist = price ? ((l.price - price) / price) * 100 : 0;
                  const isAbove = l.price > price;
                  return (
                    <div
                      key={l.ratio}
                      className="flex justify-between items-center py-2 border-b border-[rgba(99,102,241,0.06)] last:border-0"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                          {(l.ratio * 100).toFixed(1)}%
                        </span>
                        <div className="text-[8.5px] text-slate-500 mt-0.5">
                          {l.ratio === 0 ? "Recent Min" : l.ratio === 1 ? "Recent Max" : "Channel Ratio"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                          {formatINR(l.price)}
                        </div>
                        <div
                          className={`text-[9px] font-extrabold font-mono mt-0.5 ${
                            isAbove ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {isAbove ? "↑ +" : "↓ "}
                          {dist.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted text-center py-8">Fibonacci models loading...</div>
            )}
            <div className="text-[8.5px] text-slate-500 leading-normal text-center mt-3 pt-2 border-t border-[rgba(255,255,255,0.03)]">
              Ratios computed dynamically relative to the local peak swing High and swing Low values.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
