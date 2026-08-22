/**
 * SectorCard — visual card for the sector heatmap.
 * Color intensity reflects avg change % like the web's heatmap.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatPct } from '../../utils/formatters';
import type { Sector } from '../../types/market';

interface SectorCardProps {
  sector: Sector;
  onPress?: (sector: Sector) => void;
}

export function SectorCard({ sector: s, onPress }: SectorCardProps) {
  const pct = s.avg_change_pct;
  const isPos = pct > 0;
  const isNeg = pct < 0;
  const intensity = Math.min(1, Math.abs(pct) / 3);

  const bgColor = isPos
    ? `rgba(16,185,129,${0.05 + intensity * 0.15})`
    : isNeg
    ? `rgba(244,63,94,${0.05 + intensity * 0.15})`
    : 'rgba(100,116,139,0.06)';

  const borderColor = isPos
    ? `rgba(16,185,129,${0.15 + intensity * 0.25})`
    : isNeg
    ? `rgba(244,63,94,${0.15 + intensity * 0.25})`
    : 'rgba(100,116,139,0.15)';

  const textColor = isPos ? colors.bull : isNeg ? colors.bear : colors.neutral;

  const advancePct = s.active_count > 0
    ? Math.round((s.advance_count / s.active_count) * 100)
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(s)}
      style={[styles.card, { backgroundColor: bgColor, borderColor }]}
    >
      <Text style={styles.name} numberOfLines={1}>{s.sector}</Text>
      <Text style={[styles.pct, { color: textColor }]}>{formatPct(pct)}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{s.count} stocks</Text>
        <Text style={[styles.advdec, { color: textColor }]}>
          ▲{s.advance_count} ▼{s.decline_count}
        </Text>
      </View>
      {/* Mini advance/decline bar */}
      {s.active_count > 0 && (
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${advancePct}%` as any }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  name: {
    fontSize: typography.size.base,
    fontFamily: typography.sansSemiBold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  pct: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.sansBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  meta: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  advdec: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
  },
  barBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.15)',
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.bull,
  },
});
