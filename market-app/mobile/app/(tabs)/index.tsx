/**
 * Markets Tab — index tiles, gainers, losers, exchange toggle, live WebSocket data.
 */
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIndices, useGainers, useLosers, useMarketStatus } from '../../src/api/market';
import { useAppStore } from '../../src/store/useAppStore';
import { IndexTile, IndexTileSkeleton } from '../../src/components/market/IndexTile';
import { MoverCard } from '../../src/components/market/MoverCard';
import { ExchangeToggle } from '../../src/components/market/ExchangeToggle';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { LiveDot } from '../../src/components/ui/LiveDot';
import { MiniStockModal } from '../../src/components/stock/MiniStockModal';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const exchange = useAppStore((s) => s.exchange);
  const setExchange = useAppStore((s) => s.setExchange);
  const livePrices = useAppStore((s) => s.livePrices);

  const { data: indicesData, isLoading: indicesLoading, refetch: refetchIndices } = useIndices();
  const { data: gainersData, isLoading: gainersLoading, refetch: refetchGainers } = useGainers(exchange, 10);
  const { data: losersData, isLoading: losersLoading, refetch: refetchLosers } = useLosers(exchange, 10);
  const { data: statusData } = useMarketStatus();

  // Merge live WS data with React Query fallback
  const indices = livePrices?.indices?.length ? livePrices.indices : indicesData;
  const gainers = exchange === 'NSE' && livePrices?.gainers?.length
    ? livePrices.gainers
    : exchange === 'BSE' && livePrices?.gainers_bse?.length
    ? livePrices.gainers_bse
    : gainersData;
  const losers = exchange === 'NSE' && livePrices?.losers?.length
    ? livePrices.losers
    : exchange === 'BSE' && livePrices?.losers_bse?.length
    ? livePrices.losers_bse
    : losersData;

  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);

  const isOpen = statusData?.is_open;

  function handleRefresh() {
    refetchIndices();
    refetchGainers();
    refetchLosers();
  }

  function handleStockPress(symbol: string) {
    setSelectedSymbol(symbol);
  }

  const refreshing = indicesLoading && !indices;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Market status banner */}
      <View style={styles.statusRow}>
        <LiveDot color={isOpen ? colors.bull : colors.textDim} />
        <Text style={[styles.statusText, { color: isOpen ? colors.bull : colors.textMuted }]}>
          {statusData?.market_status ? statusData.market_status.toUpperCase() : '…'}
        </Text>
        <Text style={styles.statusSub}>NSE · BSE · AI</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
          style={styles.searchBtn}
        >
          <Text style={styles.searchBtnText}>🔍 Search</Text>
        </TouchableOpacity>
      </View>

      {/* Standout Q-Results & Corporate Action Terminal Banner */}
      <TouchableOpacity
        style={styles.qResultsHeroCard}
        activeOpacity={0.85}
        onPress={() => router.push('/earnings')}
      >
        <View style={styles.qResultsCardHeader}>
          <Text style={styles.qResultsBadge}>🔥 NEW STANDOUT FEATURE</Text>
          <Text style={styles.qResultsArrow}>Explore Hub ➔</Text>
        </View>
        <Text style={styles.qResultsTitle}>📊 Q-Results & Corporate Action Intelligence</Text>
        <Text style={styles.qResultsSubtitle}>
          Multi-source verified quarterly filings, PAT YoY %, revenue, margins & AI short-term profit playbooks.
        </Text>
      </TouchableOpacity>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Market Overview</Text>
        <ExchangeToggle value={exchange} onChange={setExchange} />
      </View>

      {/* Index tiles — 2x2 grid */}
      <View style={styles.indexGrid}>
        {indices?.length
          ? indices.map((q) => (
              <View key={q.symbol} style={styles.tileWrapper}>
                <IndexTile index={q} />
              </View>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.tileWrapper}>
                <IndexTileSkeleton />
              </View>
            ))
        }
      </View>

      {/* Movers section */}
      <View style={styles.moversContainer}>
        {/* Gainers */}
        <MoversList
          title="Top Gainers"
          icon="▲"
          iconColor={colors.bull}
          rows={gainers}
          isGainer={true}
          loading={gainersLoading}
          onPress={handleStockPress}
        />

        {/* Losers */}
        <MoversList
          title="Top Losers"
          icon="▼"
          iconColor={colors.bear}
          rows={losers}
          isGainer={false}
          loading={losersLoading}
          onPress={handleStockPress}
        />
      </View>

      <MiniStockModal
        symbol={selectedSymbol}
        visible={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />
    </ScrollView>
  );
}

function MoversList({
  title,
  icon,
  iconColor,
  rows,
  isGainer,
  loading,
  onPress,
}: {
  title: string;
  icon: string;
  iconColor: string;
  rows: any[] | undefined;
  isGainer: boolean;
  loading: boolean;
  onPress: (symbol: string) => void;
}) {
  return (
    <Card style={styles.moversCard}>
      <View style={styles.moversHeader}>
        <Text style={[styles.moversIcon, { color: iconColor }]}>{icon}</Text>
        <Text style={styles.moversTitle}>{title}</Text>
        {loading && (
          <View style={styles.spinner} />
        )}
      </View>
      {rows?.length
        ? rows.map((q, i) => (
            <MoverCard
              key={q.symbol}
              mover={q}
              rank={i + 1}
              isGainer={isGainer}
              onPress={onPress}
            />
          ))
        : Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton height={14} />
            </View>
          ))
      }
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    letterSpacing: 1,
  },
  statusSub: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textDim,
    marginLeft: 2,
    flex: 1,
  },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.accentSubtle,
  },
  searchBtnText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.accent,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.serif,
    color: colors.textPrimary,
  },
  indexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  tileWrapper: {
    width: '48.5%',
  },
  moversContainer: {
    gap: spacing.md,
  },
  moversCard: {
    overflow: 'hidden',
  },
  moversHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  moversIcon: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
  },
  moversTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.sansSemiBold,
    color: colors.textPrimary,
    flex: 1,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: `${colors.accent}40`,
    borderTopColor: colors.accent,
  },
  skeletonRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderDim,
  },
  qResultsHeroCard: {
    backgroundColor: '#161922',
    borderColor: '#D4963A40',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  qResultsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qResultsBadge: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: '#D4963A',
    letterSpacing: 0.5,
  },
  qResultsArrow: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  qResultsTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  qResultsSubtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
