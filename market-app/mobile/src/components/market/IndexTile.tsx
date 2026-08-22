/**
 * IndexTile — displays a single market index (NIFTY 50, SENSEX, etc.)
 * Mobile equivalent of the web's IndexTile component with auto-scaling font size.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatINR, formatPct, signColor } from '../../utils/formatters';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { Index } from '../../types/market';

interface IndexTileProps {
  index: Index;
}

export function IndexTile({ index: q }: IndexTileProps) {
  const accentColor = signColor(q.change_pct);

  return (
    <Card style={styles.card} accentColor={accentColor} accentSide="left">
      {/* Index name */}
      <View style={styles.nameRow}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text
          style={styles.name}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {q.name}
        </Text>
      </View>

      {/* Price */}
      <Text
        style={styles.price}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {formatINR(q.price)}
      </Text>

      {/* Change */}
      <View style={styles.changeRow}>
        <Text style={[styles.change, { color: accentColor }]}>
          {formatPct(q.change_pct)}
        </Text>
        {q.stale && (
          <View style={styles.staleBadge}>
            <Text style={styles.staleText}>stale</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

export function IndexTileSkeleton() {
  return (
    <Card style={styles.card}>
      <Skeleton width={60} height={10} style={{ marginBottom: 8 }} />
      <Skeleton width={110} height={20} style={{ marginBottom: 6 }} />
      <Skeleton width={50} height={12} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  change: {
    fontSize: typography.size.sm,
    fontFamily: typography.mono,
  },
  staleBadge: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  staleText: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: '#f59e0b',
  },
});
