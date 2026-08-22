/**
 * ChartView — Dynamic & resilient SVG chart component with Line / Volume bars,
 * onLayout container auto-resizing, and 1D -> 5D empty data fallback recovery.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatINR } from '../../utils/formatters';
import type { OHLCVBar } from '../../types/market';

const CHART_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y'] as const;

interface ChartViewProps {
  data: any; // Accepts OHLCVBar[] or { bars: OHLCVBar[] }
  isLoading?: boolean;
  range: string;
  onRangeChange: (r: string) => void;
  onExpand?: () => void;
  showVolume?: boolean;
}

const DEFAULT_CHART_H = 200;
const PAD = { top: 20, bottom: 32, left: 8, right: 8 };

export function ChartView({
  data,
  isLoading,
  range,
  onRangeChange,
  onExpand,
  showVolume = true,
}: ChartViewProps) {
  const [volEnabled, setVolEnabled] = useState(showVolume);
  const [containerW, setContainerW] = useState(0);

  // Dynamic layout measurement
  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerW) > 2) {
      setContainerW(w);
    }
  };

  // Safe data array normalization
  const bars: OHLCVBar[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.bars)) return (data as any).bars;
    return [];
  }, [data]);

  const chartW = containerW > 0 ? containerW - 24 : 320;

  const { pathD, gradientD, lineColor, minVal, maxVal, gradId, volBars } = useMemo(() => {
    if (bars.length < 2 || chartW <= 0) {
      return {
        pathD: '',
        gradientD: '',
        lineColor: colors.accent,
        minVal: 0,
        maxVal: 0,
        gradId: 'grad_empty',
        volBars: [],
      };
    }

    const min = Math.min(...bars.map((b) => b.l));
    const max = Math.max(...bars.map((b) => b.h));
    const maxVol = Math.max(...bars.map((b) => b.v || 1));
    const rangeVal = max - min || 1;

    const w = chartW - PAD.left - PAD.right;
    const h = DEFAULT_CHART_H - PAD.top - PAD.bottom;
    const stepX = w / (bars.length - 1);

    const pts = bars.map((b, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + h - ((b.c - min) / rangeVal) * h,
      v: b.v,
      isUp: b.c >= b.o,
    }));

    const pathDStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    const gradPathStr = `${pathDStr} L${lastPt.x.toFixed(1)},${DEFAULT_CHART_H - PAD.bottom} L${firstPt.x.toFixed(1)},${DEFAULT_CHART_H - PAD.bottom} Z`;

    const isOverallUp = bars[bars.length - 1].c >= bars[0].c;
    const color = isOverallUp ? colors.bull : colors.bear;
    const id = `grad_${Math.random().toString(36).substr(2, 6)}`;

    const maxVolH = h * 0.3;
    const barW = Math.max(1.5, (w / bars.length) * 0.6);
    const volumeRects = pts.map((p) => {
      const volH = Math.max(2, ((p.v || 0) / maxVol) * maxVolH);
      return {
        x: p.x - barW / 2,
        y: DEFAULT_CHART_H - PAD.bottom - volH,
        w: barW,
        h: volH,
        isUp: p.isUp,
      };
    });

    return {
      pathD: pathDStr,
      gradientD: gradPathStr,
      lineColor: color,
      minVal: min,
      maxVal: max,
      gradId: id,
      volBars: volumeRects,
    };
  }, [bars, chartW]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Header Range Bar & Controls (Minimum 44dp tap target height) */}
      <View style={styles.headerControls}>
        <View style={styles.rangeRow}>
          {CHART_RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => onRangeChange(r)}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rightControls}>
          <TouchableOpacity
            style={[styles.toggleBtn, volEnabled && styles.toggleBtnActive]}
            onPress={() => setVolEnabled((prev) => !prev)}
          >
            <Text style={[styles.toggleText, volEnabled && styles.toggleTextActive]}>VOL</Text>
          </TouchableOpacity>

          {onExpand && (
            <TouchableOpacity style={styles.expandBtn} onPress={onExpand}>
              <Text style={styles.expandText}>⤢ Expand</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SVG Chart Rendering */}
      {isLoading ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading Chart History…</Text>
        </View>
      ) : bars.length < 2 ? (
        <View style={styles.emptyRecoveryBox}>
          <Text style={styles.emptyTitle}>No Intraday History Available</Text>
          <Text style={styles.emptySub}>
            Market is closed or intraday data is un-cached. Switch to 5D / 1M to view history.
          </Text>
          <TouchableOpacity
            style={styles.recoveryBtn}
            onPress={() => onRangeChange('1M')}
          >
            <Text style={styles.recoveryBtnText}>Switch to 1M Range ➔</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Svg width={chartW} height={DEFAULT_CHART_H}>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Volume bars */}
            {volEnabled &&
              volBars.map((vb, i) => (
                <Rect
                  key={i}
                  x={vb.x}
                  y={vb.y}
                  width={vb.w}
                  height={vb.h}
                  fill={vb.isUp ? `${colors.bull}40` : `${colors.bear}40`}
                />
              ))}

            {/* Gradient fill */}
            <Path d={gradientD} fill={`url(#${gradId})`} />

            {/* Price Line */}
            <Path d={pathD} stroke={lineColor} strokeWidth={2} fill="none" />

            {/* Min / Max Labels */}
            <SvgText
              x={PAD.left + 4}
              y={DEFAULT_CHART_H - PAD.bottom + 14}
              fill={colors.textMuted}
              fontSize={9}
              fontFamily={typography.mono}
            >
              Low: {formatINR(minVal)}
            </SvgText>
            <SvgText
              x={PAD.left + 4}
              y={PAD.top - 4}
              fill={colors.textMuted}
              fontSize={9}
              fontFamily={typography.mono}
            >
              High: {formatINR(maxVal)}
            </SvgText>
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xs,
    width: '100%',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 3,
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: colors.cardBorder,
  },
  rangeText: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  rangeTextActive: {
    color: colors.accent,
    fontFamily: typography.monoMedium,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(212,150,58,0.15)',
    borderColor: colors.accent,
  },
  toggleText: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.accent,
  },
  expandBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  expandText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  placeholder: {
    height: DEFAULT_CHART_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  emptyRecoveryBox: {
    height: DEFAULT_CHART_H,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  recoveryBtn: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(212,150,58,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  recoveryBtnText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
});
