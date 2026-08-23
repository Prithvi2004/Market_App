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

const FILTER_OPTIONS = [
  { id: 'all',     label: 'All' },
  { id: 'bullish', label: '🟢 Bullish' },
  { id: 'bearish', label: '🔴 Bearish' },
  { id: 'neutral', label: '⚪ Neutral' },
];

export default function ScreenerScreen() {
  const insets = useSafeAreaInsets();
  const screenerFilter = useAppStore((s) => s.screenerFilter);
  const setScreenerFilter = useAppStore((s) => s.setScreenerFilter);

  const { data, isLoading, refetch } = useScreenerAlerts();

  const filtered = useMemo(() => {
    if (!data) return [];
    if (screenerFilter === 'all') return data;
    return data.filter((a) => a.signals.some((s) => s.direction === screenerFilter));
  }, [data, screenerFilter]);

  const bullCount = data?.filter((a) => a.signals.some((s) => s.direction === 'bullish')).length ?? 0;
  const bearCount = data?.filter((a) => a.signals.some((s) => s.direction === 'bearish')).length ?? 0;

  return (
    <View style={styles.container}>

      {/* ── Stat pills row ── */}
      <View style={styles.statsRow}>
        <StatPill label="Alerts"  value={data?.length ?? 0} color={colors.accent} />
        <StatPill label="Bullish" value={bullCount}          color={colors.bull}   />
        <StatPill label="Bearish" value={bearCount}          color={colors.bear}   />
      </View>

      {/* ── Q-Results shortcut card (Elevated) ── */}
      <TouchableOpacity
        style={styles.qCard}
        activeOpacity={0.85}
        onPress={() => router.push('/earnings')}
      >
        <View style={styles.qCardInner}>
          <View style={styles.qCardIconBox}>
            <Text style={styles.qCardIcon}>📊</Text>
          </View>
          <View style={styles.qCardContent}>
            <View style={styles.qCardRow}>
              <Text style={styles.qCardTitle}>Q-Results & Corporate Action</Text>
              <View style={styles.qCardBadge}>
                <Text style={styles.qCardBadgeText}>EXPLORE ➔</Text>
              </View>
            </View>
            <Text style={styles.qCardSub} numberOfLines={1}>
              Multi-source filings · PAT growth % · margins & playbooks
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Filter buttons (Single fixed row, constant gap, equal width) ── */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f.id}
            activeOpacity={0.8}
            onPress={() => setScreenerFilter(f.id)}
            style={[styles.pill, screenerFilter === f.id && styles.pillActive]}
          >
            <Text
              style={[styles.pillLabel, screenerFilter === f.id && styles.pillLabelActive]}
              numberOfLines={1}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Alert list ── */}
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

// ─── StatPill ────────────────────────────────────────────────────────────────
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
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 7,
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
    marginTop: 1,
  },
});

// ─── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },

  // Elevated Q-Results card
  qCard: {
    backgroundColor: '#181c28',
    borderColor: 'rgba(212, 150, 58, 0.45)',
    borderWidth: 1.2,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: spacing.lg,
    marginTop: 2,
    marginBottom: 6,
    // Elevation & shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  qCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qCardIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qCardIcon: {
    fontSize: 16,
  },
  qCardContent: {
    flex: 1,
  },
  qCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  qCardTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    flex: 1,
  },
  qCardBadge: {
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.3)',
    marginLeft: 6,
  },
  qCardBadgeText: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  qCardSub: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
    lineHeight: 15,
  },

  // Filters (Fixed single row, constant gap, equal width)
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: 2,
    paddingBottom: 6,
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accentBorder,
  },
  pillLabel: {
    fontSize: 11,
    fontFamily: typography.sansSemiBold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pillLabelActive: {
    color: colors.accent,
    fontFamily: typography.sansBold,
  },

  // List
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
  },
  skeletons: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonCard: {
    borderRadius: 14,
  },

  // Empty
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
});
