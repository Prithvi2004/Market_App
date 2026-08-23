/**
 * Groww-Style IPO Hub Screen — Mainboard & SME IPOs (Live, Closed, Upcoming, Listed).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface IPOItem {
  id: string;
  name: string;
  symbol: string;
  status: 'ACTIVE' | 'CLOSED' | 'UPCOMING' | 'LISTED';
  category: 'Mainboard' | 'SME';
  sector: string;
  price_min: number;
  price_max: number;
  lot_size: number;
  min_investment: number;
  issue_size_cr: number;
  open_date: string;
  close_date: string;
  gmp_rs: number;
  gmp_pct: number;
  total_sub: number;
}

export default function IPOScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'CLOSED' | 'UPCOMING' | 'LISTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Mainboard' | 'SME'>('ALL');

  const { data: ipoList, isLoading, refetch, isRefetching } = useQuery<IPOItem[]>({
    queryKey: ['ipo-list', statusFilter, categoryFilter],
    queryFn: () => {
      let url = '/api/ipo/list?';
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
      if (categoryFilter !== 'ALL') url += `category=${categoryFilter}&`;
      return apiFetch(url);
    },
    staleTime: 60_000,
  });

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTitle}>IPO Hub 🚀</Text>
          <Text style={styles.bannerSubtitle}>
            Live Mainboard & SME IPOs • Allotment Trackers • AI Research
          </Text>
        </View>
      </View>

      {/* Segment Selector (Mainboard vs SME) */}
      <View style={styles.segContainer}>
        {(['ALL', 'Mainboard', 'SME'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.segButton, categoryFilter === cat && styles.segButtonActive]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text style={[styles.segText, categoryFilter === cat && styles.segTextActive]}>
              {cat === 'ALL' ? 'All Types' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Filter Scrollbar */}
      <View style={{ height: 44 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['ALL', 'LIVE', 'CLOSED', 'UPCOMING', 'LISTED'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, statusFilter === tab && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text style={[styles.filterText, statusFilter === tab && styles.filterTextActive]}>
                {tab === 'LIVE' ? '🟢 LIVE' : tab === 'CLOSED' ? '⏳ CLOSED' : tab === 'UPCOMING' ? '📅 UPCOMING' : tab === 'LISTED' ? '📈 LISTED' : 'ALL STATUS'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading Live IPO Directory...</Text>
        </View>
      ) : (
        <FlatList
          data={ipoList || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/ipo/${item.id}` as any)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.companyName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'ACTIVE'
                          ? styles.statusActive
                          : item.status === 'CLOSED'
                          ? styles.statusClosed
                          : item.status === 'UPCOMING'
                          ? styles.statusUpcoming
                          : styles.statusListed,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {item.status === 'ACTIVE' ? 'LIVE' : item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectorText}>
                    {item.sector} • <Text style={{ color: colors.accent }}>{item.category}</Text>
                  </Text>
                </View>

                {/* GMP Badge */}
                <View style={styles.gmpBox}>
                  <Text style={styles.gmpLabel}>{item.status === 'LISTED' ? 'LISTING GAIN' : 'EST. GMP'}</Text>
                  <Text style={styles.gmpValue}>+₹{item.gmp_rs}</Text>
                  <Text style={styles.gmpPct}>(+{item.gmp_pct}%)</Text>
                </View>
              </View>

              {/* Grid Metrics */}
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Price Band</Text>
                  <Text style={styles.cellValue}>₹{item.price_min} - ₹{item.price_max}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Min Investment</Text>
                  <Text style={styles.cellValue}>
                    ₹{item.min_investment.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Bidding Dates</Text>
                  <Text style={styles.cellValue}>{item.open_date.slice(5)} to {item.close_date.slice(5)}</Text>
                </View>
              </View>

              {/* Subscription Progress */}
              <View style={styles.subRow}>
                <View style={styles.subTextRow}>
                  <Text style={styles.subTitle}>
                    {item.status === 'LISTED' ? 'Final Subscription' : item.status === 'CLOSED' ? 'Closed Subscription' : 'Live Subscription'}
                  </Text>
                  <Text style={styles.subValue}>
                    {item.total_sub > 0 ? `${item.total_sub}x` : 'Opens Soon'}
                  </Text>
                </View>
                {item.total_sub > 0 && (
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(item.total_sub * 2.5, 100)}%` },
                      ]}
                    />
                  </View>
                )}
              </View>

              {/* Card Footer Action */}
              <View style={styles.cardFooter}>
                <Text style={styles.actionText}>View Full Timeline & Analyst Report</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.accent} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  banner: {
    padding: spacing.md,
    backgroundColor: '#12131A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.15)',
  },
  bannerLeft: {
    gap: 2,
  },
  bannerTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  segContainer: {
    flexDirection: 'row',
    backgroundColor: '#12131A',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    padding: 3,
  },
  segButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segButtonActive: {
    backgroundColor: colors.accent,
  },
  segText: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  segTextActive: {
    color: '#000000',
    fontFamily: typography.sansBold,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: colors.accent,
  },
  filterText: {
    fontSize: 10,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.accent,
    fontFamily: typography.sansBold,
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: '#12131A',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  companyName: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusClosed: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  statusUpcoming: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  statusListed: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  statusText: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  sectorText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 2,
  },
  gmpBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  gmpLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  gmpValue: {
    fontSize: 13,
    fontFamily: typography.mono,
    color: '#10B981',
  },
  gmpPct: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: '#10B981',
  },
  gridRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  gridCell: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  cellValue: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  subRow: {
    gap: 4,
  },
  subTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subTitle: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  subValue: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  actionText: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.accent,
  },
});
