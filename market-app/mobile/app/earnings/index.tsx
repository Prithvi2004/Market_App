/**
 * Q-Results & Major Corporate Announcements Intelligence Hub.
 * Standout Dalal Street Event Terminal for Very Short-Term (0-3 Days) & Short-Term (1-4 Weeks) Profitability.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface EarningsEvent {
  symbol: string;
  company_name: string;
  event_type: string;
  event_title: string;
  announcement_date: string;
  period: string;
  segment: string;
  revenue_cr: number;
  revenue_yoy_pct: number;
  revenue_qoq_pct: number;
  pat_cr: number;
  pat_yoy_pct: number;
  pat_qoq_pct: number;
  ebitda_margin_pct: number;
  estimate_verdict: string;
  surprise_pct: number;
  key_highlights: string[];
  short_term_rating: string;
  source_url: string;
}

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'All Filings' },
  { id: 'Q-RESULTS', label: '📊 Q-Results' },
  { id: 'DIVIDENDS', label: '🎁 Actions' },
];

const VERDICT_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'MEGA BEAT', label: '🚀 Mega Beat' },
  { id: 'BEAT', label: '🟢 Beat' },
  { id: 'IN-LINE', label: '🟡 In-Line' },
];

export default function EarningsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVerdict, setSelectedVerdict] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isRefetching, refetch } = useQuery<{
    count: number;
    events: EarningsEvent[];
  }>({
    queryKey: ['earnings-live', selectedCategory, selectedVerdict],
    queryFn: () => {
      let url = '/api/earnings/live?';
      if (selectedCategory !== 'ALL') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedVerdict !== 'ALL') url += `verdict=${encodeURIComponent(selectedVerdict)}`;
      return apiFetch(url);
    },
    staleTime: 30_000,
  });

  const events = data?.events ?? [];

  const filteredEvents = events.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.company_name.toLowerCase().includes(q) ||
      item.event_title.toLowerCase().includes(q)
    );
  });

  const getVerdictBadgeStyle = (verdict: string) => {
    if (verdict.includes('MEGA BEAT')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.45)', text: '#10b981' };
    }
    if (verdict.includes('BEAT')) {
      return { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.35)', text: '#22c55e' };
    }
    if (verdict.includes('MISS')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.45)', text: '#ef4444' };
    }
    return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#f59e0b' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* ── Top Navigation Bar ── */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>Q-Results Intelligence</Text>
          <Text style={styles.navSubtitle}>DALAL STREET FILINGS & PLAYBOOKS</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredEvents.length} LIVE</Text>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={15} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock symbol, company or filing..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Category Segmented Bar ── */}
      <View style={styles.categoryRow}>
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Verdict Filters (Single Fixed Row) ── */}
      <View style={styles.verdictRow}>
        {VERDICT_FILTERS.map((v) => {
          const isActive = selectedVerdict === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              activeOpacity={0.8}
              style={[styles.verdictChip, isActive && styles.verdictChipActive]}
              onPress={() => setSelectedVerdict(v.id)}
            >
              <Text
                style={[styles.verdictChipText, isActive && styles.verdictChipTextActive]}
                numberOfLines={1}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Main Feed List ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Synthesizing Real-Time Q-Results...</Text>
        </View>
      ) : !filteredEvents.length ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No matching corporate filings</Text>
          <Text style={styles.emptySubtitle}>Try changing your search query or verdict filters above.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.symbol}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badge = getVerdictBadgeStyle(item.estimate_verdict);
            const isPatPositive = item.pat_yoy_pct >= 0;
            const isRevPositive = item.revenue_yoy_pct >= 0;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/earnings/${encodeURIComponent(item.symbol)}`)}
              >
                {/* Header: Symbol + Name + Period + Verdict Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.symbolCol}>
                    <View style={styles.symbolHeaderRow}>
                      <Text style={styles.symbolText}>{item.symbol.replace('.NS', '')}</Text>
                      <View style={styles.periodPill}>
                        <Text style={styles.periodPillText}>{item.period || 'Q3 FY26'}</Text>
                      </View>
                    </View>
                    <Text style={styles.companyName} numberOfLines={1}>
                      {item.company_name}
                    </Text>
                  </View>

                  <View style={[styles.verdictBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.verdictBadgeText, { color: badge.text }]}>
                      {item.estimate_verdict}
                    </Text>
                  </View>
                </View>

                {/* Announcement Headline */}
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.event_title}
                </Text>

                {/* Metrics Grid (4 Clean Columns) */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>PAT YoY</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: isPatPositive ? colors.bull : colors.bear },
                      ]}
                    >
                      {isPatPositive ? `+${item.pat_yoy_pct}%` : `${item.pat_yoy_pct}%`}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>REV YoY</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: isRevPositive ? colors.bull : colors.bear },
                      ]}
                    >
                      {isRevPositive ? `+${item.revenue_yoy_pct}%` : `${item.revenue_yoy_pct}%`}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>MARGIN</Text>
                    <Text style={[styles.metricValue, { color: colors.accent }]}>
                      {item.ebitda_margin_pct}%
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>RATING</Text>
                    <Text style={styles.metricRatingText} numberOfLines={1}>
                      {item.short_term_rating.replace('Rating: ', '')}
                    </Text>
                  </View>
                </View>

                {/* Card Footer: Date & Playbook CTA */}
                <View style={styles.cardFooter}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={11} color={colors.textDim} />
                    <Text style={styles.dateText}>{item.announcement_date}</Text>
                  </View>

                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaButtonText}>Analyze Playbook</Text>
                    <Ionicons name="arrow-forward" size={12} color="#0b0b09" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  // Navigation Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  navTitleContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  navSubtitle: {
    fontSize: 8.5,
    fontFamily: typography.monoMedium,
    color: colors.accent,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(212, 150, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs + 2,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141c',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.sans,
    fontSize: 12.5,
    marginLeft: spacing.xs,
    paddingVertical: 0,
  },

  // Category Tabs
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingVertical: 4,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryTabText: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  categoryTabTextActive: {
    color: '#0b0b09',
    fontFamily: typography.sansBold,
  },

  // Verdict Chips
  verdictRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingBottom: 6,
  },
  verdictChip: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  verdictChipActive: {
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    borderColor: colors.accent,
  },
  verdictChipText: {
    fontSize: 10,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  verdictChipTextActive: {
    color: colors.accent,
    fontFamily: typography.sansBold,
  },

  // List & Cards
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Card Structure
  card: {
    backgroundColor: '#151822',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
    // Elevation shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symbolCol: {
    flex: 1,
    marginRight: 8,
  },
  symbolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  symbolText: {
    fontSize: 15,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  periodPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  periodPillText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.textMuted,
  },
  companyName: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 1,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  verdictBadgeText: {
    fontSize: 9.5,
    fontFamily: typography.sansBold,
    letterSpacing: 0.3,
  },
  eventTitle: {
    fontSize: 12,
    fontFamily: typography.sansMedium,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // 4-Column Metrics Bar
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: {
    fontSize: 8.5,
    fontFamily: typography.monoMedium,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 11.5,
    fontFamily: typography.monoMedium,
    marginTop: 1,
  },
  metricRatingText: {
    fontSize: 10.5,
    fontFamily: typography.sansBold,
    color: colors.bull,
    marginTop: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textDim,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    gap: 4,
  },
  ctaButtonText: {
    fontSize: 10.5,
    fontFamily: typography.sansBold,
    color: '#0b0b09',
  },
});
