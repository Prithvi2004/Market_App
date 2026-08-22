/**
 * PeersPanel — renders sector peers for a stock.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatINR, formatPct, shortSymbol, signColor } from '../../utils/formatters';
import type { Mover } from '../../types/market';

interface PeersPanelProps {
  peers: Mover[] | undefined;
  isLoading?: boolean;
  onSelectPeer?: (symbol: string) => void;
}

export function PeersPanel({ peers, isLoading, onSelectPeer }: PeersPanelProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading sector peers…</Text>
      </View>
    );
  }

  if (!peers || peers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No peer data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {peers.map((peer) => {
        const pctColor = signColor(peer.change_pct);
        return (
          <TouchableOpacity
            key={peer.symbol}
            activeOpacity={0.8}
            onPress={() => onSelectPeer?.(peer.symbol)}
            style={styles.row}
          >
            <View style={styles.info}>
              <Text style={styles.symbol}>{shortSymbol(peer.symbol)}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {peer.name}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.price}>{formatINR(peer.price)}</Text>
              <Text style={[styles.pct, { color: pctColor }]}>
                {formatPct(peer.change_pct)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
  },
  info: {
    flex: 1,
  },
  symbol: {
    fontSize: typography.size.md,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  name: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  pct: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
  },
  loading: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  empty: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
