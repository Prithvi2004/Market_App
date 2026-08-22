/**
 * Sectors Tab — interactive sector heatmap.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSectors } from '../../src/api/market';
import { SectorCard } from '../../src/components/sectors/SectorCard';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatPct, formatINR, signColor, shortSymbol } from '../../src/utils/formatters';
import type { Sector, SectorStock } from '../../src/types/market';

export default function SectorsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useSectors();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  function handleSectorPress(sector: Sector) {
    setSelectedSector(sector);
  }

  function handleStockPress(symbol: string) {
    setSelectedSector(null);
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sector Heatmap</Text>
          <Text style={styles.headerSub}>NIFTY 50 · Avg Sector Change</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.bull }]} />
            <Text style={styles.legendText}>Advance</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.bear }]} />
            <Text style={styles.legendText}>Decline</Text>
          </View>
        </View>

        {/* Sector grid */}
        {isLoading && !data ? (
          <View style={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={styles.gridCell}>
                <Skeleton height={90} />
              </View>
            ))}
          </View>
        ) : !data?.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sector data yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {data.map((s) => (
              <View key={s.sector} style={styles.gridCell}>
                <SectorCard sector={s} onPress={handleSectorPress} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sector detail modal */}
      <SectorDetailModal
        sector={selectedSector}
        onClose={() => setSelectedSector(null)}
        onStockPress={handleStockPress}
        insets={insets}
      />
    </View>
  );
}

function SectorDetailModal({
  sector,
  onClose,
  onStockPress,
  insets,
}: {
  sector: Sector | null;
  onClose: () => void;
  onStockPress: (symbol: string) => void;
  insets: any;
}) {
  if (!sector) return null;

  return (
    <Modal visible={!!sector} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <TouchableOpacity style={modalStyles.dim} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>{sector.sector}</Text>
          <Text style={[modalStyles.avgChange, { color: signColor(sector.avg_change_pct) }]}>
            {formatPct(sector.avg_change_pct)} avg
          </Text>
          <Text style={modalStyles.subtitle}>
            {sector.advance_count} ▲ advancing · {sector.decline_count} ▼ declining
          </Text>
          <FlatList
            data={sector.stocks}
            keyExtractor={(s) => s.symbol}
            renderItem={({ item: s }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onStockPress(s.symbol)}
                style={modalStyles.stockRow}
              >
                <View style={modalStyles.stockInfo}>
                  <Text style={modalStyles.stockSymbol}>{shortSymbol(s.symbol)}</Text>
                  <Text style={modalStyles.stockName} numberOfLines={1}>{s.name}</Text>
                </View>
                <View style={modalStyles.stockRight}>
                  <Text style={modalStyles.stockPrice}>{formatINR(s.price)}</Text>
                  <Text style={[modalStyles.stockPct, { color: signColor(s.change_pct) }]}>
                    {formatPct(s.change_pct)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={modalStyles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: 3,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    width: '48%',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#111110',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  avgChange: {
    fontSize: typography.size.xl,
    fontFamily: typography.sansBold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
    gap: 8,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: typography.size.md,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  stockName: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  stockPct: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
  },
});
