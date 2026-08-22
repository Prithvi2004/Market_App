/**
 * HoldingCard — shows a portfolio holding with live P&L.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatINR, formatPct, shortSymbol, signColor } from '../../utils/formatters';
import type { HoldingResult } from '../../types/portfolio';

interface HoldingCardProps {
  result: HoldingResult;
  onRemove?: (symbol: string) => void;
  onPress?: (symbol: string) => void;
}

export function HoldingCard({ result: r, onRemove, onPress }: HoldingCardProps) {
  const pnlColor = signColor(r.pnl);

  return (
    <Card style={styles.card} accentColor={pnlColor} accentSide="left">
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPress?.(r.symbol)} style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.symbolArea}>
            <Text style={styles.symbol}>{shortSymbol(r.symbol)}</Text>
            <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
          </View>
          <View style={styles.priceArea}>
            {r.current_price != null ? (
              <Text style={styles.currentPrice}>{formatINR(r.current_price)}</Text>
            ) : (
              <Text style={styles.stalePill}>stale</Text>
            )}
            {r.change_pct != null && (
              <Text style={[styles.dayChange, { color: signColor(r.change_pct) }]}>
                {formatPct(r.change_pct)} today
              </Text>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCell label="Qty" value={String(r.qty)} />
          <StatCell label="Avg Cost" value={formatINR(r.buy_price)} />
          <StatCell label="Invested" value={formatINR(r.invested)} />
          <StatCell
            label="P&L"
            value={r.pnl != null ? formatINR(r.pnl) : '—'}
            valueColor={pnlColor}
          />
          <StatCell
            label="P&L %"
            value={r.pnl_pct != null ? formatPct(r.pnl_pct) : '—'}
            valueColor={pnlColor}
          />
        </View>
      </TouchableOpacity>

      {/* Remove button */}
      {onRemove && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onRemove(r.symbol)}
          style={styles.removeBtn}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

function StatCell({
  label,
  value,
  valueColor = colors.textPrimary,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  inner: {
    padding: spacing.md,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  symbolArea: {
    flex: 1,
  },
  symbol: {
    fontSize: typography.size.lg,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  name: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  priceArea: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: typography.size.lg,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  dayChange: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
  },
  stalePill: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.10)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    minWidth: 70,
  },
  statLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansMedium,
  },
  removeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  removeText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.bear,
    opacity: 0.7,
  },
});
