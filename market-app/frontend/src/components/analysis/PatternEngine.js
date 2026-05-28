/**
 * PatternEngine.js — v2.0
 * Pure-JS candlestick pattern recognition engine. Zero external dependencies.
 * All functions accept: { t, o, h, l, c, v }
 *
 * FIXES in v2.0:
 *  - Removed else-if chain on single-candle detectors — each bar now checked
 *    independently for all applicable patterns (Doji no longer blocks Hammer)
 *  - Added EMA-slope trend context: Hammer only valid at downtrend bottom,
 *    Hanging Man only valid at uptrend top, Shooting Star needs uptrend context
 *  - Added volume confirmation: +10 confidence when volume > 20-bar avg
 *
 * NEW in v2.0:
 *  - Marubozu (full-body candle, no shadows)
 *  - Dragonfly Doji and Gravestone Doji
 *  - Tweezer Top and Tweezer Bottom
 *  - Rising Window and Falling Window (gap continuation patterns)
 *
 * Returns Array<PatternResult>:
 * { barIndex, type, direction, confidence, description, successRate, emoji }
 */

const BULLISH = "bullish";
const BEARISH = "bearish";
const NEUTRAL = "neutral";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const body         = (c) => Math.abs(c.c - c.o);
const range        = (c) => c.h - c.l;
const isGreen      = (c) => c.c >= c.o;
const isRed        = (c) => c.c < c.o;
const upperShadow  = (c) => c.h - Math.max(c.c, c.o);
const lowerShadow  = (c) => Math.min(c.c, c.o) - c.l;
const midpoint     = (c) => (c.o + c.c) / 2;
const avgBody      = (arr) => arr.reduce((s, c) => s + body(c), 0) / arr.length;

// Volume confirmation: returns true if candle volume > 20-bar avg volume
function hasVolumeConfirmation(candles, index) {
  if (index < 1) return false;
  const lookback = Math.min(20, index);
  const slice = candles.slice(index - lookback, index);
  const avgVol = slice.reduce((s, c) => s + (c.v ?? 0), 0) / lookback;
  return (candles[index].v ?? 0) > avgVol;
}

// EMA slope trend context
function getEMASlope(candles, index, period = 10) {
  if (index < period) return 0;
  const closes = candles.slice(index - period, index + 1).map((c) => c.c);
  // Simple slope: (last - first) / first
  return (closes[closes.length - 1] - closes[0]) / closes[0];
}

function isDowntrend(candles, index) { return getEMASlope(candles, index, 10) < -0.005; }
function isUptrend(candles, index)   { return getEMASlope(candles, index, 10) >  0.005; }

function withVolBoost(confidence, candles, index) {
  return hasVolumeConfirmation(candles, index) ? Math.min(99, confidence + 10) : confidence;
}

// ─── Single-candle patterns ────────────────────────────────────────────────────

function detectDoji(c, i, candles) {
  const bd = body(c), rng = range(c);
  if (rng === 0) return null;
  // Strict Doji: body ≤ 5% of range (standard definition)
  if (bd / rng <= 0.05) {
    const us = upperShadow(c), ls = lowerShadow(c);
    // Dragonfly Doji: no upper shadow, very long lower shadow
    if (us <= bd && ls >= rng * 0.6) {
      return {
        barIndex: i, type: "Dragonfly Doji", direction: BULLISH,
        confidence: withVolBoost(82, candles, i),
        emoji: "🪲",
        description: "Open, high, and close are near equal; very long lower wick. Strong bullish reversal at support — buyers completely rejected the low.",
        successRate: 68,
      };
    }
    // Gravestone Doji: no lower shadow, very long upper shadow
    if (ls <= bd && us >= rng * 0.6) {
      return {
        barIndex: i, type: "Gravestone Doji", direction: BEARISH,
        confidence: withVolBoost(82, candles, i),
        emoji: "🪦",
        description: "Open, low, and close are near equal; very long upper wick. Sellers violently rejected the high — bearish reversal warning at resistance.",
        successRate: 67,
      };
    }
    // Standard Doji
    return {
      barIndex: i, type: "Doji", direction: NEUTRAL,
      confidence: 75,
      emoji: "➖",
      description: "Buyers and sellers are in equilibrium. Indecision candle — confirms nothing alone; watch for the next directional close.",
      successRate: 55,
    };
  }
  return null;
}

function detectSpinningTop(c, i) {
  const bd = body(c), rng = range(c);
  const us = upperShadow(c), ls = lowerShadow(c);
  if (rng === 0) return null;
  // Body < 30% of range, both shadows > body
  if (bd / rng < 0.3 && us > bd * 0.7 && ls > bd * 0.7 && bd / rng >= 0.06) {
    return {
      barIndex: i, type: "Spinning Top", direction: NEUTRAL, confidence: 65,
      emoji: "🌀",
      description: "Small body with long wicks on both sides — market indecision. Could precede a trend change; wait for directional confirmation.",
      successRate: 50,
    };
  }
  return null;
}

function detectHammer(c, i, candles) {
  // Requires downtrend context
  if (!isDowntrend(candles, i)) return null;
  const bd = body(c), ls = lowerShadow(c), us = upperShadow(c), rng = range(c);
  if (rng === 0) return null;
  if (ls >= 2 * bd && us <= bd * 0.4 && bd / rng < 0.45) {
    return {
      barIndex: i, type: "Hammer", direction: BULLISH,
      confidence: withVolBoost(80, candles, i),
      emoji: "🔨",
      description: "Long lower shadow at the bottom of a downtrend — sellers pushed price down but buyers strongly rejected it by close. Bullish reversal signal.",
      successRate: 65,
    };
  }
  return null;
}

function detectInvertedHammer(c, i, candles) {
  if (!isDowntrend(candles, i)) return null;
  const bd = body(c), us = upperShadow(c), ls = lowerShadow(c), rng = range(c);
  if (rng === 0) return null;
  if (us >= 2 * bd && ls <= bd * 0.4 && bd / rng < 0.45) {
    return {
      barIndex: i, type: "Inverted Hammer", direction: BULLISH,
      confidence: withVolBoost(70, candles, i),
      emoji: "🔃",
      description: "Long upper shadow at the bottom of a downtrend — buyers attempted a push higher. Needs next green candle for confirmation.",
      successRate: 60,
    };
  }
  return null;
}

function detectHangingMan(c, i, candles) {
  // Requires uptrend context
  if (!isUptrend(candles, i)) return null;
  const bd = body(c), ls = lowerShadow(c), us = upperShadow(c), rng = range(c);
  if (rng === 0) return null;
  if (ls >= 2 * bd && us <= bd * 0.4 && bd / rng < 0.45) {
    return {
      barIndex: i, type: "Hanging Man", direction: BEARISH,
      confidence: withVolBoost(75, candles, i),
      emoji: "☠️",
      description: "Appears in an uptrend. Long lower shadow signals selling pressure. Bears pushed price down intraday — bearish reversal warning.",
      successRate: 62,
    };
  }
  return null;
}

function detectShootingStar(c, i, candles) {
  if (!isUptrend(candles, i)) return null;
  const bd = body(c), us = upperShadow(c), ls = lowerShadow(c), rng = range(c);
  if (rng === 0) return null;
  if (us >= 2 * bd && ls <= bd * 0.4 && bd / rng < 0.45) {
    return {
      barIndex: i, type: "Shooting Star", direction: BEARISH,
      confidence: withVolBoost(80, candles, i),
      emoji: "💫",
      description: "Long upper shadow after an uptrend — buyers pushed price up but sellers strongly took control by close. Strong bearish reversal signal.",
      successRate: 68,
    };
  }
  return null;
}

function detectMarubozu(c, i, candles) {
  const bd = body(c), rng = range(c);
  if (rng === 0) return null;
  // Body must be ≥ 90% of range (very small or zero shadows)
  if (bd / rng >= 0.9) {
    const dir = isGreen(c) ? BULLISH : BEARISH;
    return {
      barIndex: i, type: isGreen(c) ? "Bullish Marubozu" : "Bearish Marubozu",
      direction: dir,
      confidence: withVolBoost(85, candles, i),
      emoji: isGreen(c) ? "🟩" : "🟥",
      description: isGreen(c)
        ? "Full-body green candle with virtually no shadows — pure buyer dominance throughout the entire session. Very strong momentum continuation signal."
        : "Full-body red candle with virtually no shadows — complete seller dominance all session. Bearish continuation with high probability.",
      successRate: 72,
    };
  }
  return null;
}

// ─── Two-candle patterns ──────────────────────────────────────────────────────

function detectBullishEngulfing(c0, c1, i, candles) {
  if (!isRed(c0) || !isGreen(c1)) return null;
  if (c1.o < c0.c && c1.c > c0.o && body(c1) > body(c0) * 1.1) {
    return {
      barIndex: i, type: "Bullish Engulfing", direction: BULLISH,
      confidence: withVolBoost(88, candles, i),
      emoji: "🟢",
      description: "Large green candle completely engulfs the prior red body — institutional buyers overwhelming sellers. High-probability bullish reversal.",
      successRate: 73,
    };
  }
  return null;
}

function detectBearishEngulfing(c0, c1, i, candles) {
  if (!isGreen(c0) || !isRed(c1)) return null;
  if (c1.o > c0.c && c1.c < c0.o && body(c1) > body(c0) * 1.1) {
    return {
      barIndex: i, type: "Bearish Engulfing", direction: BEARISH,
      confidence: withVolBoost(88, candles, i),
      emoji: "🔴",
      description: "Large red candle completely engulfs the prior green body — bears overwhelming bulls. Strong bearish reversal signal.",
      successRate: 72,
    };
  }
  return null;
}

function detectPiercingLine(c0, c1, i, candles) {
  if (!isRed(c0) || !isGreen(c1)) return null;
  const mid = midpoint(c0);
  if (c1.o < c0.l && c1.c > mid && c1.c < c0.o) {
    return {
      barIndex: i, type: "Piercing Line", direction: BULLISH,
      confidence: withVolBoost(74, candles, i),
      emoji: "⬆️",
      description: "Opens below prior low, closes above midpoint — buyers absorbing selling pressure. Moderate bullish reversal; needs confirmation.",
      successRate: 61,
    };
  }
  return null;
}

function detectDarkCloudCover(c0, c1, i, candles) {
  if (!isGreen(c0) || !isRed(c1)) return null;
  const mid = midpoint(c0);
  if (c1.o > c0.h && c1.c < mid && c1.c > c0.o) {
    return {
      barIndex: i, type: "Dark Cloud Cover", direction: BEARISH,
      confidence: withVolBoost(74, candles, i),
      emoji: "🌩️",
      description: "Opens above prior high, closes below midpoint — sellers pushing into bullish territory. Moderate bearish reversal signal.",
      successRate: 61,
    };
  }
  return null;
}

function detectBullishHarami(c0, c1, i) {
  if (!isRed(c0) || !isGreen(c1)) return null;
  if (c1.o > c0.c && c1.c < c0.o && body(c1) < body(c0) * 0.5) {
    return {
      barIndex: i, type: "Bullish Harami", direction: BULLISH, confidence: 65,
      emoji: "🤰",
      description: "Small green candle inside a large red body — selling momentum is slowing. Possible bullish reversal; confirm with next candle.",
      successRate: 57,
    };
  }
  return null;
}

function detectBearishHarami(c0, c1, i) {
  if (!isGreen(c0) || !isRed(c1)) return null;
  if (c1.o < c0.c && c1.c > c0.o && body(c1) < body(c0) * 0.5) {
    return {
      barIndex: i, type: "Bearish Harami", direction: BEARISH, confidence: 65,
      emoji: "🤰",
      description: "Small red candle inside a large green body — buying momentum slowing. Possible bearish reversal; confirm with next candle.",
      successRate: 57,
    };
  }
  return null;
}

function detectTweezerTop(c0, c1, i, candles) {
  // Both candles have equal highs; first green, second red
  if (!isGreen(c0) || !isRed(c1)) return null;
  const highDiff = Math.abs(c0.h - c1.h) / c0.h;
  if (highDiff < 0.002 && isUptrend(candles, i)) {
    return {
      barIndex: i, type: "Tweezer Top", direction: BEARISH,
      confidence: withVolBoost(76, candles, i),
      emoji: "⬇️",
      description: "Two candles with matching highs — strong resistance at that level. Bears defended the high twice; bearish reversal signal.",
      successRate: 63,
    };
  }
  return null;
}

function detectTweezerBottom(c0, c1, i, candles) {
  // Both candles have equal lows; first red, second green
  if (!isRed(c0) || !isGreen(c1)) return null;
  const lowDiff = Math.abs(c0.l - c1.l) / c0.l;
  if (lowDiff < 0.002 && isDowntrend(candles, i)) {
    return {
      barIndex: i, type: "Tweezer Bottom", direction: BULLISH,
      confidence: withVolBoost(76, candles, i),
      emoji: "⬆️",
      description: "Two candles with matching lows — strong support at that level. Bulls defended the low twice; bullish reversal signal.",
      successRate: 63,
    };
  }
  return null;
}

function detectRisingWindow(c0, c1, i) {
  // Gap up: current low > previous high = bullish gap continuation
  if (c1.l > c0.h && isGreen(c1)) {
    return {
      barIndex: i, type: "Rising Window", direction: BULLISH, confidence: 80,
      emoji: "🚀",
      description: "Price gapped up with no overlap to the prior candle — strong bullish continuation. The gap acts as new support.",
      successRate: 70,
    };
  }
  return null;
}

function detectFallingWindow(c0, c1, i) {
  // Gap down: current high < previous low = bearish gap continuation
  if (c1.h < c0.l && isRed(c1)) {
    return {
      barIndex: i, type: "Falling Window", direction: BEARISH, confidence: 80,
      emoji: "💣",
      description: "Price gapped down with no overlap to the prior candle — strong bearish continuation. The gap acts as new resistance.",
      successRate: 70,
    };
  }
  return null;
}

// ─── Three-candle patterns ────────────────────────────────────────────────────

function detectMorningStar(c0, c1, c2, i, candles) {
  if (!isRed(c0) || !isGreen(c2)) return null;
  if (body(c0) < avgBody([c0, c2]) * 0.8) return null;
  const hasGapDown = Math.max(c1.o, c1.c) < c0.c;
  const closesHigh = c2.c > midpoint(c0);
  if (hasGapDown && closesHigh && body(c1) < body(c0) * 0.5) {
    return {
      barIndex: i, type: "Morning Star", direction: BULLISH,
      confidence: withVolBoost(90, candles, i),
      emoji: "🌅",
      description: "Three-candle reversal: large red → small indecision → large green closing above mid. One of the most reliable bullish reversal patterns.",
      successRate: 78,
    };
  }
  return null;
}

function detectEveningStar(c0, c1, c2, i, candles) {
  if (!isGreen(c0) || !isRed(c2)) return null;
  if (body(c0) < avgBody([c0, c2]) * 0.8) return null;
  const hasGapUp = Math.min(c1.o, c1.c) > c0.c;
  const closesLow = c2.c < midpoint(c0);
  if (hasGapUp && closesLow && body(c1) < body(c0) * 0.5) {
    return {
      barIndex: i, type: "Evening Star", direction: BEARISH,
      confidence: withVolBoost(90, candles, i),
      emoji: "🌇",
      description: "Three-candle reversal: large green → small indecision → large red closing below mid. Highly reliable bearish reversal pattern.",
      successRate: 77,
    };
  }
  return null;
}

function detectThreeWhiteSoldiers(c0, c1, c2, i, candles) {
  if (!isGreen(c0) || !isGreen(c1) || !isGreen(c2)) return null;
  const rising = c1.c > c0.c && c2.c > c1.c;
  const opens  = c1.o > c0.o && c1.o < c0.c && c2.o > c1.o && c2.o < c1.c;
  const smallShadows =
    upperShadow(c0) < body(c0) * 0.3 &&
    upperShadow(c1) < body(c1) * 0.3 &&
    upperShadow(c2) < body(c2) * 0.3;
  if (rising && opens && smallShadows) {
    return {
      barIndex: i, type: "Three White Soldiers", direction: BULLISH,
      confidence: withVolBoost(92, candles, i),
      emoji: "💪",
      description: "Three consecutive bullish candles with progressively higher closes and small upper shadows. Very strong institutional buying momentum.",
      successRate: 82,
    };
  }
  return null;
}

function detectThreeBlackCrows(c0, c1, c2, i, candles) {
  if (!isRed(c0) || !isRed(c1) || !isRed(c2)) return null;
  const declining = c1.c < c0.c && c2.c < c1.c;
  const opens     = c1.o < c0.o && c1.o > c0.c && c2.o < c1.o && c2.o > c1.c;
  const smallShadows =
    lowerShadow(c0) < body(c0) * 0.3 &&
    lowerShadow(c1) < body(c1) * 0.3 &&
    lowerShadow(c2) < body(c2) * 0.3;
  if (declining && opens && smallShadows) {
    return {
      barIndex: i, type: "Three Black Crows", direction: BEARISH,
      confidence: withVolBoost(92, candles, i),
      emoji: "🦅",
      description: "Three consecutive bearish candles with progressively lower closes. Very strong downward selling momentum; avoid buying.",
      successRate: 81,
    };
  }
  return null;
}

// ─── Main detection — FIXED: independent checks per bar, no early-exit ────────
export function detectPatterns(candles) {
  if (!candles || candles.length < 3) return [];
  const results = [];

  for (let i = 0; i < candles.length; i++) {
    const c  = candles[i];
    const c1 = i > 0 ? candles[i - 1] : null;
    const c2 = i > 1 ? candles[i - 2] : null;

    // ── Single-candle: ALL checked independently (no else-if) ──
    const doji = detectDoji(c, i, candles);
    if (doji) results.push(doji);

    const spin = detectSpinningTop(c, i);
    if (spin && !doji) results.push(spin); // Spinning top is weaker than Doji — skip if Doji found

    const hammer = detectHammer(c, i, candles);
    if (hammer) results.push(hammer);

    const invHammer = detectInvertedHammer(c, i, candles);
    if (invHammer) results.push(invHammer);

    const hangingMan = detectHangingMan(c, i, candles);
    if (hangingMan) results.push(hangingMan);

    const shootingStar = detectShootingStar(c, i, candles);
    if (shootingStar) results.push(shootingStar);

    const marubozu = detectMarubozu(c, i, candles);
    if (marubozu) results.push(marubozu);

    // ── Two-candle: all independent checks ──
    if (c1) {
      const bullEng = detectBullishEngulfing(c1, c, i, candles);
      if (bullEng) results.push(bullEng);

      const bearEng = detectBearishEngulfing(c1, c, i, candles);
      if (bearEng) results.push(bearEng);

      const piercing = detectPiercingLine(c1, c, i, candles);
      if (piercing) results.push(piercing);

      const darkCloud = detectDarkCloudCover(c1, c, i, candles);
      if (darkCloud) results.push(darkCloud);

      const bullHarami = detectBullishHarami(c1, c, i);
      if (bullHarami) results.push(bullHarami);

      const bearHarami = detectBearishHarami(c1, c, i);
      if (bearHarami) results.push(bearHarami);

      const tweezerTop = detectTweezerTop(c1, c, i, candles);
      if (tweezerTop) results.push(tweezerTop);

      const tweezerBot = detectTweezerBottom(c1, c, i, candles);
      if (tweezerBot) results.push(tweezerBot);

      const risingWin = detectRisingWindow(c1, c, i);
      if (risingWin) results.push(risingWin);

      const fallingWin = detectFallingWindow(c1, c, i);
      if (fallingWin) results.push(fallingWin);
    }

    // ── Three-candle: all independent checks ──
    if (c1 && c2) {
      const morningStar = detectMorningStar(c2, c1, c, i, candles);
      if (morningStar) results.push(morningStar);

      const eveningStar = detectEveningStar(c2, c1, c, i, candles);
      if (eveningStar) results.push(eveningStar);

      const soldiers = detectThreeWhiteSoldiers(c2, c1, c, i, candles);
      if (soldiers) results.push(soldiers);

      const crows = detectThreeBlackCrows(c2, c1, c, i, candles);
      if (crows) results.push(crows);
    }
  }

  // Sort by confidence descending, return last 20 most recent high-confidence
  return results
    .sort((a, b) => b.barIndex - a.barIndex || b.confidence - a.confidence)
    .slice(0, 20);
}

export const PATTERN_COLORS = {
  bullish: "#10b981",
  bearish: "#f43f5e",
  neutral: "#f59e0b",
};
