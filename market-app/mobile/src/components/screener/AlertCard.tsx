/**
 * AlertCard — screener alert with signals.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatINR, formatPct, shortSymbol, signColor } from '../../utils/formatters';
import { SIGNAL_DIRECTION_COLORS } from '../../utils/constants';
import type { ScreenerAlert } from '../../types/market';

interface AlertCardProps {
  alert: ScreenerAlert;
  onPress?: (symbol: string) => void;
}

export function AlertCard({ alert: a, onPress }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pctColor = signColor(a.change_pct);

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded((v) => !v)}
        style={styles.header}
      >
        {/* Left: symbol + sector */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress?.(a.symbol)} style={styles.symbolArea}>
          <Text style={styles.symbol}>{shortSymbol(a.symbol)}</Text>
          <Text style={styles.sector}>{a.sector}</Text>
        </TouchableOpacity>

        {/* Right: price + change */}
        <View style={styles.priceArea}>
          <Text style={styles.price}>{formatINR(a.price)}</Text>
          <Text style={[styles.change, { color: pctColor }]}>{formatPct(a.change_pct)}</Text>
        </View>

        {/* Signal count */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{a.signals.length}</Text>
        </View>

        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* RSI pill */}
      <View style={styles.rsiRow}>
        <Text style={styles.rsiLabel}>RSI</Text>
        <Text style={[
          styles.rsiValue,
          { color: a.rsi > 70 ? colors.bear : a.rsi < 30 ? colors.bull : colors.textMuted }
        ]}>
          {a.rsi.toFixed(1)}
        </Text>
      </View>

      {/* Signal pills */}
      <View style={styles.signalsRow}>
        {a.signals.map((sig, i) => {
          const dc = SIGNAL_DIRECTION_COLORS[sig.direction] ?? SIGNAL_DIRECTION_COLORS.neutral;
          return (
            <View key={i} style={[styles.sigBadge, { backgroundColor: dc.bg, borderColor: dc.border }]}>
              <Text style={[styles.sigText, { color: dc.color }]}>{sig.name}</Text>
            </View>
          );
        })}
      </View>

      {/* Expanded descriptions */}
      {expanded && (
        <View style={styles.descriptions}>
          {a.signals.map((sig, i) => {
            const dc = SIGNAL_DIRECTION_COLORS[sig.direction] ?? SIGNAL_DIRECTION_COLORS.neutral;
            return (
              <View key={i} style={[styles.descRow, { borderLeftColor: dc.color }]}>
                <Text style={styles.descType}>{sig.type}: {sig.name}</Text>
                <Text style={styles.descText}>{sig.desc}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolArea: {
    flex: 1,
  },
  symbol: {
    fontSize: typography.size.md,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  sector: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  priceArea: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  change: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  chevron: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  rsiRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  rsiLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rsiValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.monoMedium,
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  sigBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sigText: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sansSemiBold,
  },
  descriptions: {
    gap: 6,
    marginTop: 4,
  },
  descRow: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    gap: 2,
  },
  descType: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.textSecondary,
  },
  descText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
