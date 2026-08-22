/**
 * EstimatedPathChart — Renders historical price curve + projected estimated price path
 * with Bullish Target, Base Case, and Bearish Support bounds.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect, Text as SvgText, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatINR, formatPct, signColor } from '../../utils/formatters';
import type { OHLCVBar } from '../../types/market';

interface EstimatedPathChartProps {
  history: OHLCVBar[] | undefined;
  currentPrice: number;
  high52w?: number;
  low52w?: number;
  rsi?: number;
  ema20?: number;
  ema50?: number;
  atr?: number;
}

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 48;
const CHART_H = 220;
const PAD = { top: 24, bottom: 32, left: 10, right: 60 };

export function EstimatedPathChart({
  history,
  currentPrice,
  high52w,
  low52w,
  rsi = 50,
  ema20,
  ema50,
  atr = 0,
}: EstimatedPathChartProps) {
  const calculations = useMemo(() => {
    if (!history || history.length === 0) {
      return null;
    }

    const price = currentPrice || history[history.length - 1].c;
    const volatr = atr > 0 ? atr : price * 0.025;

    // Trend bias from EMA and RSI
    let trendFactor = 0;
    if (ema20 && ema50) {
      trendFactor = ema20 > ema50 ? 0.03 : -0.03;
    }
    if (rsi > 60) trendFactor += 0.02;
    if (rsi < 40) trendFactor -= 0.02;

    // Estimated price targets (30-day projection)
    const bullishTarget = Math.round(price * (1 + 0.06 + trendFactor));
    const baseTarget = Math.round(price * (1 + 0.02 + trendFactor / 2));
    const bearishTarget = Math.round(price * (1 - 0.05 + trendFactor));

    // Combine historical close prices with 3 projected points
    const histCloses = history.slice(-20).map((b) => b.c);
    const minVal = Math.min(...histCloses, bearishTarget) * 0.98;
    const maxVal = Math.max(...histCloses, bullishTarget) * 1.02;
    const rangeVal = maxVal - minVal || 1;

    const w = CHART_W - PAD.left - PAD.right;
    const h = CHART_H - PAD.top - PAD.bottom;

    // Historical points
    const histLen = histCloses.length;
    const totalSteps = histLen + 5; // 5 steps for projected future
    const stepW = w / (totalSteps - 1);

    const histPts = histCloses.map((c, i) => ({
      x: PAD.left + i * stepW,
      y: PAD.top + h - ((c - minVal) / rangeVal) * h,
    }));

    const lastHistPt = histPts[histPts.length - 1];

    // Future estimated paths (Bullish, Base, Bearish)
    const projX1 = lastHistPt.x + 2 * stepW;
    const projX2 = lastHistPt.x + 5 * stepW;

    const projBullY1 = PAD.top + h - (((price + bullishTarget) / 2 - minVal) / rangeVal) * h;
    const projBullY2 = PAD.top + h - ((bullishTarget - minVal) / rangeVal) * h;

    const projBaseY1 = PAD.top + h - (((price + baseTarget) / 2 - minVal) / rangeVal) * h;
    const projBaseY2 = PAD.top + h - ((baseTarget - minVal) / rangeVal) * h;

    const projBearY1 = PAD.top + h - (((price + bearishTarget) / 2 - minVal) / rangeVal) * h;
    const projBearY2 = PAD.top + h - ((bearishTarget - minVal) / rangeVal) * h;

    const histPathD = histPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const bullPathD = `M${lastHistPt.x.toFixed(1)},${lastHistPt.y.toFixed(1)} L${projX1.toFixed(1)},${projBullY1.toFixed(1)} L${projX2.toFixed(1)},${projBullY2.toFixed(1)}`;
    const basePathD = `M${lastHistPt.x.toFixed(1)},${lastHistPt.y.toFixed(1)} L${projX1.toFixed(1)},${projBaseY1.toFixed(1)} L${projX2.toFixed(1)},${projBaseY2.toFixed(1)}`;
    const bearPathD = `M${lastHistPt.x.toFixed(1)},${lastHistPt.y.toFixed(1)} L${projX1.toFixed(1)},${projBearY1.toFixed(1)} L${projX2.toFixed(1)},${projBearY2.toFixed(1)}`;

    return {
      price,
      bullishTarget,
      baseTarget,
      bearishTarget,
      minVal,
      maxVal,
      lastHistPt,
      projX2,
      projBullY2,
      projBaseY2,
      projBearY2,
      histPathD,
      bullPathD,
      basePathD,
      bearPathD,
    };
  }, [history, currentPrice, rsi, ema20, ema50, atr]);

  if (!calculations) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Loading estimated path chart…</Text>
      </View>
    );
  }

  const {
    price,
    bullishTarget,
    baseTarget,
    bearishTarget,
    lastHistPt,
    projX2,
    projBullY2,
    projBaseY2,
    projBearY2,
    histPathD,
    bullPathD,
    basePathD,
    bearPathD,
  } = calculations;

  const bullPct = ((bullishTarget - price) / price) * 100;
  const bearPct = ((bearishTarget - price) / price) * 100;

  return (
    <View style={styles.container}>
      {/* Forecast header cards */}
      <View style={styles.targetRow}>
        <View style={[styles.targetCard, { borderColor: `${colors.bull}40`, backgroundColor: `${colors.bull}10` }]}>
          <Text style={styles.targetLabel}>Bullish Target</Text>
          <Text style={[styles.targetVal, { color: colors.bull }]}>{formatINR(bullishTarget)}</Text>
          <Text style={[styles.targetPct, { color: colors.bull }]}>{formatPct(bullPct)}</Text>
        </View>

        <View style={[styles.targetCard, { borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}10` }]}>
          <Text style={styles.targetLabel}>Base Case</Text>
          <Text style={[styles.targetVal, { color: colors.accent }]}>{formatINR(baseTarget)}</Text>
          <Text style={[styles.targetPct, { color: colors.accent }]}>Est. 30D</Text>
        </View>

        <View style={[styles.targetCard, { borderColor: `${colors.bear}40`, backgroundColor: `${colors.bear}10` }]}>
          <Text style={styles.targetLabel}>Bearish Support</Text>
          <Text style={[styles.targetVal, { color: colors.bear }]}>{formatINR(bearishTarget)}</Text>
          <Text style={[styles.targetPct, { color: colors.bear }]}>{formatPct(bearPct)}</Text>
        </View>
      </View>

      {/* SVG Chart */}
      <View style={styles.svgContainer}>
        <Svg width={CHART_W} height={CHART_H}>
          <Defs>
            <LinearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Forecast dividing line */}
          <Line
            x1={lastHistPt.x}
            y1={PAD.top}
            x2={lastHistPt.x}
            y2={CHART_H - PAD.bottom}
            stroke={colors.borderSubtle}
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          <SvgText
            x={lastHistPt.x + 4}
            y={PAD.top - 6}
            fill={colors.accent}
            fontSize={9}
            fontFamily={typography.monoMedium}
          >
            FORECAST ➔
          </SvgText>

          {/* Historical price line */}
          <Path d={histPathD} stroke={colors.accent} strokeWidth={2.5} fill="none" />

          {/* Historical last point dot */}
          <Circle cx={lastHistPt.x} cy={lastHistPt.y} r={4} fill={colors.accent} />

          {/* Projected Path lines */}
          <Path d={bullPathD} stroke={colors.bull} strokeWidth={2} strokeDasharray="5,5" fill="none" />
          <Path d={basePathD} stroke={colors.accent} strokeWidth={2} strokeDasharray="3,3" fill="none" />
          <Path d={bearPathD} stroke={colors.bear} strokeWidth={2} strokeDasharray="5,5" fill="none" />

          {/* End points dots & labels */}
          <Circle cx={projX2} cy={projBullY2} r={3.5} fill={colors.bull} />
          <SvgText x={projX2 + 4} y={projBullY2 + 3} fill={colors.bull} fontSize={9} fontFamily={typography.sansBold}>
            {formatINR(bullishTarget)}
          </SvgText>

          <Circle cx={projX2} cy={projBaseY2} r={3.5} fill={colors.accent} />
          <SvgText x={projX2 + 4} y={projBaseY2 + 3} fill={colors.accent} fontSize={9} fontFamily={typography.sansBold}>
            {formatINR(baseTarget)}
          </SvgText>

          <Circle cx={projX2} cy={projBearY2} r={3.5} fill={colors.bear} />
          <SvgText x={projX2 + 4} y={projBearY2 + 3} fill={colors.bear} fontSize={9} fontFamily={typography.sansBold}>
            {formatINR(bearishTarget)}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  targetCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  targetLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  targetVal: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
  },
  targetPct: {
    fontSize: 10,
    fontFamily: typography.monoMedium,
  },
  svgContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xs,
    alignItems: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
