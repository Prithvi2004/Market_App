/**
 * Screener Tab — technical breakout and pattern alerts.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenerAlerts } from '../../src/api/market';
import { useAppStore } from '../../src/store/useAppStore';
import { AlertCard } from '../../src/components/screener/AlertCard';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import { SIGNAL_DIRECTION_COLORS } from '../../src/utils/constants';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Signals' },
  { id: 'bullish', label: '🟢 Bullish' },
  { id: 'bearish', label: '🔴 Bearish' },
  { id: 'neutral', label: '⚪ Neutral' },
];

export default function ScreenerScreen() {
  const insets = useSafeAreaInsets();
  const screenerFilter = useAppStore((s) => s.screenerFilter);
  const setScreenerFilter = useAppStore((s) => s.setScreenerFilter);

  const { data, isLoading, refetch, dataUpdatedAt } = useScreenerAlerts();

  const filtered = useMemo(() => {
    if (!data) return [];
    if (screenerFilter === 'all') return data;
    return data.filter((a) =>
      a.signals.some((s) => s.direction === screenerFilter)
    );
  }, [data, screenerFilter]);

  // Count by direction
  const bullCount = data?.filter((a) => a.signals.some((s) => s.direction === 'bullish')).length ?? 0;
  const bearCount = data?.filter((a) => a.signals.some((s) => s.direction === 'bearish')).length ?? 0;

  return (
    <View style={styles.container}>
      {/* Header stats */}
      <View style={styles.headerStats}>
        <StatPill label="Alerts" value={data?.length ?? 0} color={colors.accent} />
        <StatPill label="Bullish" value={bullCount} color={colors.bull} />
        <StatPill label="Bearish" value={bearCount} color={colors.bear} />
      </View>

      {/* Standout Q-Results & Corporate Announcements Hero Card */}
      <TouchableOpacity
        style={styles.qResultsHeroCard}
        activeOpacity={0.85}
        onPress={() => router.push('/earnings')}
      >
        <View style={styles.qResultsCardHeader}>
          <Text style={styles.qResultsBadge}>🔥 STANDOUT FEATURE</Text>
          <Text style={styles.qResultsArrow}>View Terminal ➔</Text>
        </View>
        <Text style={styles.qResultsTitle}>📊 Q-Results & Corporate Action Hub</Text>
        <Text style={styles.qResultsSubtitle}>
          Multi-source verified earnings, PAT growth %, margins & short-term profit playbooks.
        </Text>
      </TouchableOpacity>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f.id}
            activeOpacity={0.8}
            onPress={() => setScreenerFilter(f.id)}
            style={[styles.pill, screenerFilter === f.id && styles.pillActive]}
          >
            <Text style={[styles.pillLabel, screenerFilter === f.id && styles.pillLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alert list */}
      {isLoading && !data ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={100} style={styles.skeletonCard} />
          ))}
        </View>
      ) : !filtered.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>
            {data?.length ? 'No alerts match this filter' : 'No alerts detected'}
          </Text>
          <Text style={styles.emptyBody}>
            Screener scans NIFTY 50 every 15 minutes for candlestick patterns and technical breakouts.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.symbol}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onPress={(sym) => router.push(`/stock/${encodeURIComponent(sym)}`)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={10}
        />
      )}
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[pillStyles.pill, { borderColor: `${color}30`, backgroundColor: `${color}10` }]}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  value: {
    fontSize: typography.size.xl,
    fontFamily: typography.sansBold,
  },
  label: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  lastUpdate: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textDim,
    marginLeft: 'auto',
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accentBorder,
  },
  pillLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansSemiBold,
    color: colors.textMuted,
  },
  pillLabelActive: {
    color: colors.accent,
  },
  list: {
    padding: spacing.lg,
  },
  skeletons: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonCard: {
    borderRadius: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.sansSemiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  qResultsHeroCard: {
    backgroundColor: '#161922',
    borderColor: '#D4963A40',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
