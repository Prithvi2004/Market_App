/**
 * IndicatorEngine.js — v2.0
 * Pure-JS technical indicator calculations. Zero external dependencies.
 * All functions accept an array of OHLCV: { t, o, h, l, c, v }
 *
 * FIXES in v2.0:
 *  - VWAP resets per calendar day (previously cumulative across all bars = wrong)
 *  - Stochastic %D no longer contaminates nulls as 0 before period start
 *  - calcMomentumScore: RSI > 50 = bullish momentum (was incorrectly RSI > 30)
 *
 * NEW in v2.0:
 *  - Ichimoku Cloud (Tenkan, Kijun, Senkou A, Senkou B, Chikou)
 *  - ADX + DI+ / DI- (Average Directional Index)
 *  - CMF (Chaikin Money Flow, period=20)
 *  - CCI (Commodity Channel Index, period=20)
 *  - Williams %R (period=14)
 */

// ─── EMA ─────────────────────────────────────────────────────────────────────
export function calcEMA(closes, period) {
  if (!closes || closes.length < period) return new Array(closes?.length ?? 0).fill(null);
  const k = 2 / (period + 1);
  const result = new Array(closes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

// ─── SMA ─────────────────────────────────────────────────────────────────────
export function calcSMA(closes, period) {
  if (!closes || closes.length < period) return new Array(closes?.length ?? 0).fill(null);
  const result = new Array(closes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period];
    result[i] = sum / period;
  }
  return result;
}

// ─── RSI ─────────────────────────────────────────────────────────────────────
export function calcRSI(closes, period = 14) {
  if (!closes || closes.length <= period) return new Array(closes?.length ?? 0).fill(null);
  const result = new Array(closes.length).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs2);
  }
  return result;
}

// ─── MACD ────────────────────────────────────────────────────────────────────
export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (!closes || closes.length <= slow) {
    const empty = new Array(closes?.length ?? 0).fill(null);
    return { macdLine: empty, signalLine: empty, histogram: empty };
  }
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null,
  );
  const validStart = macdLine.findIndex((v) => v != null);
  if (validStart < 0) {
    const empty = new Array(closes.length).fill(null);
    return { macdLine: empty, signalLine: empty, histogram: empty };
  }
  const macdValues = macdLine.slice(validStart);
  const signalRaw = calcEMA(macdValues, signal);
  const signalLine = new Array(Math.max(0, validStart)).fill(null).concat(signalRaw);
  const histogram = macdLine.map((m, i) =>
    m != null && signalLine[i] != null ? m - signalLine[i] : null,
  );
  return { macdLine, signalLine, histogram };
}

// ─── Bollinger Bands ─────────────────────────────────────────────────────────
export function calcBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = calcSMA(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }
  return { upper, middle: sma, lower };
}

// ─── VWAP — FIXED: resets per calendar day ───────────────────────────────────
export function calcVWAP(candles) {
  const result = new Array(candles.length).fill(null);
  let cumTPV = 0, cumVol = 0;
  let lastDate = null;

  for (let i = 0; i < candles.length; i++) {
    const { t, h, l, c, v } = candles[i];
    // Derive date string — t may be ISO string or timestamp
    const dateStr = t ? String(t).slice(0, 10) : null;
    // Reset VWAP at the start of each new calendar day
    if (dateStr && dateStr !== lastDate) {
      cumTPV = 0;
      cumVol = 0;
      lastDate = dateStr;
    }
    const tp = (h + l + c) / 3;
    const vol = v ?? 0;
    cumTPV += tp * vol;
    cumVol += vol;
    result[i] = cumVol > 0 ? cumTPV / cumVol : c;
  }
  return result;
}

// ─── ATR ─────────────────────────────────────────────────────────────────────
export function calcATR(candles, period = 14) {
  if (!candles || candles.length <= period) return new Array(candles?.length ?? 0).fill(null);
  const result = new Array(candles.length).fill(null);
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const prev = candles[i - 1].c;
    return Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev));
  });
  let atr = trueRanges.slice(1, period + 1).reduce((s, v) => s + v, 0) / period;
  result[period] = atr;
  for (let i = period + 1; i < candles.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result[i] = atr;
  }
  return result;
}

// ─── Stochastic Oscillator — FIXED: null filtering before SMA ─────────────────
export function calcStochastic(candles, kPeriod = 14, dPeriod = 3) {
  if (!candles || candles.length < kPeriod) {
    const empty = new Array(candles?.length ?? 0).fill(null);
    return { k: empty, d: empty };
  }
  const k = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.h));
    const ll = Math.min(...slice.map((c) => c.l));
    k[i] = hh === ll ? 50 : ((candles[i].c - ll) / (hh - ll)) * 100;
  }

  // FIXED: compute %D only over valid (non-null) k values, then re-align
  const d = new Array(candles.length).fill(null);
  const firstValid = k.findIndex((v) => v !== null);
  if (firstValid >= 0) {
    const validK = k.slice(firstValid); // only non-null region
    const dRaw = calcSMA(validK, dPeriod);
    for (let i = 0; i < dRaw.length; i++) {
      d[firstValid + i] = dRaw[i];
    }
  }
  return { k, d };
}

// ─── Support & Resistance via Pivot Points (improved clustering) ──────────────
export function calcSupportResistance(candles, lookback = 5) {
  const pivotHighs = [];
  const pivotLows = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const slice = candles.slice(i - lookback, i + lookback + 1);
    const high = candles[i].h;
    const low = candles[i].l;
    if (slice.every((c) => c.h <= high)) pivotHighs.push(high);
    if (slice.every((c) => c.l >= low)) pivotLows.push(low);
  }

  // Cluster using 1% threshold (improved from 0.5%), weighted average
  const clusterLevels = (levels) => {
    if (!levels?.length) return [];
    const sorted = [...new Set(levels)].filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return [];
    const clusters = [];
    let group = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - group[0]) / group[0] < 0.01) {
        group.push(sorted[i]);
      } else {
        clusters.push({ price: group.reduce((s, v) => s + v, 0) / group.length, strength: group.length });
        group = [sorted[i]];
      }
    }
    if (group.length) clusters.push({ price: group.reduce((s, v) => s + v, 0) / group.length, strength: group.length });
    return clusters
      .filter((c) => Number.isFinite(c.price))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 6)
      .map((c) => c.price);
  };

  return {
    resistance: clusterLevels(pivotHighs),
    support: clusterLevels(pivotLows),
  };
}

// ─── Volume Oscillator ────────────────────────────────────────────────────────
export function calcVolumeOscillator(candles, fast = 5, slow = 10) {
  const volumes = candles.map((c) => c.v ?? 0);
  const emaFast = calcEMA(volumes, fast);
  const emaSlow = calcEMA(volumes, slow);
  return volumes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null && emaSlow[i] !== 0
      ? ((emaFast[i] - emaSlow[i]) / emaSlow[i]) * 100
      : null,
  );
}

// ─── Fibonacci Retracement Levels ────────────────────────────────────────────
export function calcFibonacci(candles) {
  const highs = candles.map((c) => c.h).filter(Number.isFinite);
  const lows = candles.map((c) => c.l).filter(Number.isFinite);
  if (!highs.length || !lows.length) return null;
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const diff = swingHigh - swingLow;
  return {
    swingHigh,
    swingLow,
    levels: [
      { ratio: 0, price: swingHigh },
      { ratio: 0.236, price: swingHigh - diff * 0.236 },
      { ratio: 0.382, price: swingHigh - diff * 0.382 },
      { ratio: 0.5, price: swingHigh - diff * 0.5 },
      { ratio: 0.618, price: swingHigh - diff * 0.618 },
      { ratio: 0.786, price: swingHigh - diff * 0.786 },
      { ratio: 1, price: swingLow },
    ],
  };
}

// ─── Linear Regression Trendline ──────────────────────────────────────────────
export function calcLinearRegression(closes) {
  if (!closes || closes.length < 2) return [];
  const n = closes.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += closes[i];
    sumXY += i * closes[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return closes.map((_, i) => slope * i + intercept);
}

// ─── Projection Channel ────────────────────────────────────────────────────────
export function calcProjectionChannel(closes, trendline) {
  if (!closes || !trendline || trendline.length === 0) return { upper: [], lower: [] };
  const n = closes.length;
  const upper = new Array(n).fill(null);
  const lower = new Array(n).fill(null);
  let sumDiffSq = 0, count = 0;
  for (let i = 0; i < n; i++) {
    if (trendline[i] != null) {
      sumDiffSq += (closes[i] - trendline[i]) ** 2;
      count++;
    }
  }
  const stdDev = count > 0 ? Math.sqrt(sumDiffSq / count) : 0;
  const margin = stdDev * 1.618;
  for (let i = 0; i < n; i++) {
    if (trendline[i] != null) {
      upper[i] = trendline[i] + margin;
      lower[i] = trendline[i] - margin;
    }
  }
  return { upper, lower };
}

// ─── NEW: Ichimoku Cloud ──────────────────────────────────────────────────────
// Standard settings: Tenkan=9, Kijun=26, Senkou B=52, displacement=26
export function calcIchimoku(candles, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) {
  const n = candles.length;
  const displacement = kijunPeriod; // 26

  const periodHighLow = (start, end) => {
    let high = -Infinity, low = Infinity;
    for (let i = start; i < end; i++) {
      if (candles[i].h > high) high = candles[i].h;
      if (candles[i].l < low) low = candles[i].l;
    }
    return (high + low) / 2;
  };

  const tenkan = new Array(n).fill(null);
  const kijun = new Array(n).fill(null);
  // Senkou A & B are displaced forward by 26 bars — stored at future index
  const senkouA = new Array(n + displacement).fill(null);
  const senkouB = new Array(n + displacement).fill(null);
  const chikou = new Array(n).fill(null); // close displaced back 26 bars

  for (let i = 0; i < n; i++) {
    // Tenkan-sen (Conversion Line)
    if (i >= tenkanPeriod - 1) {
      tenkan[i] = periodHighLow(i - tenkanPeriod + 1, i + 1);
    }
    // Kijun-sen (Base Line)
    if (i >= kijunPeriod - 1) {
      kijun[i] = periodHighLow(i - kijunPeriod + 1, i + 1);
    }
    // Senkou A (Leading Span A) — displaced forward
    if (tenkan[i] != null && kijun[i] != null) {
      senkouA[i + displacement] = (tenkan[i] + kijun[i]) / 2;
    }
    // Senkou B (Leading Span B) — displaced forward
    if (i >= senkouBPeriod - 1) {
      senkouB[i + displacement] = periodHighLow(i - senkouBPeriod + 1, i + 1);
    }
    // Chikou Span (Lagging Span) — close displaced back 26
    if (i >= displacement) {
      chikou[i - displacement] = candles[i].c;
    }
  }

  // Trim to candles length
  return {
    tenkan,
    kijun,
    senkouA: senkouA.slice(0, n),
    senkouB: senkouB.slice(0, n),
    chikou,
  };
}

// ─── NEW: ADX + DI+ / DI- ─────────────────────────────────────────────────────
export function calcADX(candles, period = 14) {
  const n = candles.length;
  if (n < period + 1) {
    const empty = new Array(n).fill(null);
    return { adx: empty, diPlus: empty, diMinus: empty };
  }

  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const prev = candles[i - 1];
    return Math.max(c.h - c.l, Math.abs(c.h - prev.c), Math.abs(c.l - prev.c));
  });

  const dmPlus = candles.map((c, i) => {
    if (i === 0) return 0;
    const upMove = c.h - candles[i - 1].h;
    const downMove = candles[i - 1].l - c.l;
    return upMove > downMove && upMove > 0 ? upMove : 0;
  });

  const dmMinus = candles.map((c, i) => {
    if (i === 0) return 0;
    const upMove = c.h - candles[i - 1].h;
    const downMove = candles[i - 1].l - c.l;
    return downMove > upMove && downMove > 0 ? downMove : 0;
  });

  // Wilder's smoothing (same as ATR)
  const smoothed = (arr) => {
    const out = new Array(n).fill(null);
    let sum = arr.slice(1, period + 1).reduce((s, v) => s + v, 0);
    out[period] = sum;
    for (let i = period + 1; i < n; i++) {
      sum = sum - sum / period + arr[i];
      out[i] = sum;
    }
    return out;
  };

  const sTR = smoothed(trueRanges);
  const sDMPlus = smoothed(dmPlus);
  const sDMMinus = smoothed(dmMinus);

  const diPlus = new Array(n).fill(null);
  const diMinus = new Array(n).fill(null);
  const dx = new Array(n).fill(null);

  for (let i = period; i < n; i++) {
    if (sTR[i] && sTR[i] !== 0) {
      diPlus[i] = (sDMPlus[i] / sTR[i]) * 100;
      diMinus[i] = (sDMMinus[i] / sTR[i]) * 100;
      const diSum = diPlus[i] + diMinus[i];
      dx[i] = diSum !== 0 ? (Math.abs(diPlus[i] - diMinus[i]) / diSum) * 100 : 0;
    }
  }

  // ADX = Wilder's smoothing of DX
  const adx = new Array(n).fill(null);
  const firstDX = dx.findIndex((v) => v !== null);
  if (firstDX >= 0 && firstDX + period < n) {
    let adxSum = dx.slice(firstDX, firstDX + period).reduce((s, v) => s + (v ?? 0), 0) / period;
    adx[firstDX + period - 1] = adxSum;
    for (let i = firstDX + period; i < n; i++) {
      adxSum = (adxSum * (period - 1) + (dx[i] ?? 0)) / period;
      adx[i] = adxSum;
    }
  }

  return { adx, diPlus, diMinus };
}

// ─── NEW: CMF (Chaikin Money Flow) ───────────────────────────────────────────
export function calcCMF(candles, period = 20) {
  const n = candles.length;
  const result = new Array(n).fill(null);

  // Money Flow Multiplier = ((Close - Low) - (High - Close)) / (High - Low)
  // Money Flow Volume = MFM * Volume
  const mfv = candles.map((c) => {
    const hl = c.h - c.l;
    if (hl === 0) return 0;
    return ((c.c - c.l - (c.h - c.c)) / hl) * (c.v ?? 0);
  });
  const vols = candles.map((c) => c.v ?? 0);

  for (let i = period - 1; i < n; i++) {
    let sumMFV = 0, sumVol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumMFV += mfv[j];
      sumVol += vols[j];
    }
    result[i] = sumVol !== 0 ? sumMFV / sumVol : 0;
  }
  return result;
}

// ─── NEW: CCI (Commodity Channel Index) ───────────────────────────────────────
export function calcCCI(candles, period = 20) {
  const n = candles.length;
  const result = new Array(n).fill(null);
  const typicalPrices = candles.map((c) => (c.h + c.l + c.c) / 3);

  for (let i = period - 1; i < n; i++) {
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / period;
    const meanDev = slice.reduce((s, v) => s + Math.abs(v - mean), 0) / period;
    result[i] = meanDev !== 0 ? (typicalPrices[i] - mean) / (0.015 * meanDev) : 0;
  }
  return result;
}

// ─── NEW: Williams %R ─────────────────────────────────────────────────────────
export function calcWilliamsR(candles, period = 14) {
  const n = candles.length;
  const result = new Array(n).fill(null);

  for (let i = period - 1; i < n; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.h));
    const ll = Math.min(...slice.map((c) => c.l));
    result[i] = hh === ll ? -50 : ((hh - candles[i].c) / (hh - ll)) * -100;
  }
  return result;
}

// ─── Composite Momentum Score (0-100) — FIXED RSI weighting ──────────────────
export function calcMomentumScore(candles) {
  const closes = candles.map((c) => c.c);
  const rsi = calcRSI(closes, 14);
  const { histogram } = calcMACD(closes);
  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);

  const lastRSI = rsi.filter((v) => v != null).at(-1) ?? 50;
  const lastHist = histogram.filter((v) => v != null).at(-1) ?? 0;
  const lastClose = closes.at(-1) ?? 0;
  const lastEma20 = ema20.filter((v) => v != null).at(-1) ?? lastClose;
  const lastEma50 = ema50.filter((v) => v != null).at(-1) ?? lastClose;

  // FIXED: RSI > 50 is bullish momentum territory (not RSI > 30)
  // Scale: 0 = RSI of 20 (very bearish), 33 = RSI of 50 (neutral), 66 = RSI of 80 (very bullish)
  const rsiScore = Math.max(0, Math.min(33, ((lastRSI - 20) / 60) * 33));

  // MACD histogram direction (0-33 score)
  const histScore = Math.max(
    0,
    Math.min(33, lastHist > 0 ? 20 + (Math.abs(lastHist) > 0.3 ? 13 : 0) : 0),
  );

  // Price vs EMAs (0-34 score)
  const emaScore = (lastClose > lastEma20 ? 17 : 0) + (lastClose > lastEma50 ? 17 : 0);

  return Math.round(rsiScore + histScore + emaScore);
}

// ─── Run all indicators at once ───────────────────────────────────────────────
export function runAllIndicators(candles) {
  if (!candles?.length) return null;
  const closes = candles.map((c) => c.c);

  const trendline = calcLinearRegression(closes);
  const projection = calcProjectionChannel(closes, trendline);
  const ichimoku = calcIchimoku(candles);
  const adx = calcADX(candles, 14);
  const cmf = calcCMF(candles, 20);
  const cci = calcCCI(candles, 20);
  const williamsR = calcWilliamsR(candles, 14);

  return {
    rsi: calcRSI(closes, 14),
    macd: calcMACD(closes),
    bb: calcBollingerBands(closes, 20, 2),
    ema9: calcEMA(closes, 9),
    ema20: calcEMA(closes, 20),
    ema50: calcEMA(closes, 50),
    ema200: calcEMA(closes, 200),
    sma20: calcSMA(closes, 20),
    sma50: calcSMA(closes, 50),
    vwap: calcVWAP(candles),
    atr: calcATR(candles, 14),
    stoch: calcStochastic(candles, 14, 3),
    sr: calcSupportResistance(candles, 5),
    fib: calcFibonacci(candles),
    volOsc: calcVolumeOscillator(candles),
    momentum: calcMomentumScore(candles),
    trendline,
    projection,
    ichimoku,
    adx,
    cmf,
    cci,
    williamsR,
  };
}
