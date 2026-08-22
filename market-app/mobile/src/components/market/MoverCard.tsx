/**
 * MoverCard — tappable row for top gainers/losers list.
 * Mobile equivalent of the web's MoverRow table row.
 */
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatINR, shortSymbol } from '../../utils/formatters';
import type { Mover } from '../../types/market';

interface MoverCardProps {
  mover: Mover;
  rank: number;
  isGainer: boolean;
  onPress?: (symbol: string) => void;
}

export function MoverCard({ mover: q, rank, isGainer, onPress }: MoverCardProps) {
  const sym = shortSymbol(q.symbol);
  const pct = q.change_pct ?? 0;
  const barWidth = Math.min(100, Math.abs(pct) * 10);
  const barColor = isGainer ? colors.bull : colors.bear;
  const textColor = isGainer ? colors.bull : colors.bear;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(q.symbol)}
      style={styles.row}
    >
      {/* Rank */}
      <Text style={styles.rank}>{rank}</Text>

      {/* Symbol + Name */}
      <View style={styles.info}>
        <Text style={styles.symbol}>{sym}</Text>
        <Text style={styles.name} numberOfLines={1}>{q.name}</Text>
      </View>

      {/* Price */}
      <Text style={styles.price}>{formatINR(q.price)}</Text>

      {/* Bar + Pct */}
      <View style={styles.changeCol}>
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              { width: `${barWidth}%` as any, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={[styles.pct, { color: textColor }]}>
          {isGainer ? '+' : ''}{pct.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderDim,
  },
  rank: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textMuted,
    width: 16,
    textAlign: 'right',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  symbol: {
    fontSize: typography.size.base,
    fontFamily: typography.monoMedium,
    color: colors.textSecondary,
  },
  name: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  price: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  changeCol: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 64,
  },
  bar: {
    width: 40,
    height: 3,
    backgroundColor: colors.slate800,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  pct: {
    fontSize: typography.size.base,
    fontFamily: typography.sansBold,
  },
});
