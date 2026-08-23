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
} from 'react-native';
import { useRouter } from 'expo-router';
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
  { id: 'ALL', label: 'All Events' },
  { id: 'Q-RESULTS', label: '📊 Q-Results' },
  { id: 'DIVIDENDS', label: '🎁 Corporate Action' },
];

const VERDICT_FILTERS = [
  { id: 'ALL', label: 'All Verdicts' },
  { id: 'MEGA BEAT', label: '🚀 Mega Beat' },
  { id: 'BEAT', label: '🟢 Beat' },
  { id: 'IN-LINE', label: '🟡 In-Line' },
];

export default function EarningsHubScreen() {
  const router = useRouter();
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
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.company_name.toLowerCase().includes(q) ||
      item.event_title.toLowerCase().includes(q)
    );
  });

  const getVerdictBadgeStyle = (verdict: string) => {
    if (verdict.includes('MEGA BEAT')) return { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.5)', text: '#10b981' };
    if (verdict.includes('BEAT')) return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22c55e' };
    if (verdict.includes('MISS')) return { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', text: '#ef4444' };
    return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' };
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ Q-Results & Action Hub</Text>
          <Text style={styles.headerSubtitle}>
            Institutional Earnings Intelligence & Short-Term Trade Playbooks
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Symbol or Announcement..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Segment Bar */}
      <View style={styles.filterRow}>
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Verdict Filter Bar */}
      <View style={styles.verdictRow}>
        {VERDICT_FILTERS.map((v) => {
          const isActive = selectedVerdict === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.verdictChip, isActive && styles.verdictChipActive]}
              onPress={() => setSelectedVerdict(v.id)}
            >
              <Text style={[styles.verdictChipText, isActive && styles.verdictChipTextActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Fetching Real-Time Q-Results...</Text>
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
            />
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const badge = getVerdictBadgeStyle(item.estimate_verdict);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/earnings/${encodeURIComponent(item.symbol)}`)}
              >
                {/* Top Symbol & Verdict Bar */}
                <View style={styles.cardHeader}>
                  <View style={styles.symbolBox}>
                    <Text style={styles.symbolText}>{item.symbol.replace('.NS', '')}</Text>
                    <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
                  </View>
                  <View
                    style={[
                      styles.verdictBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.verdictBadgeText, { color: badge.text }]}>
                      {item.estimate_verdict}
                    </Text>
                  </View>
                </View>

                {/* Announcement Title */}
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.event_title}
                </Text>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>PAT YoY</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: item.pat_yoy_pct >= 0 ? colors.positive : colors.negative },
                      ]}
                    >
                      {item.pat_yoy_pct >= 0 ? `+${item.pat_yoy_pct}%` : `${item.pat_yoy_pct}%`}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Revenue YoY</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: item.revenue_yoy_pct >= 0 ? colors.positive : colors.negative },
                      ]}
                    >
                      {item.revenue_yoy_pct >= 0 ? `+${item.revenue_yoy_pct}%` : `${item.revenue_yoy_pct}%`}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>EBITDA Margin</Text>
                    <Text style={styles.metricValueHighlight}>{item.ebitda_margin_pct}%</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Short-Term Profit</Text>
                    <Text style={styles.metricRatingText}>{item.short_term_rating}</Text>
                  </View>
                </View>

                {/* Action CTA */}
                <View style={styles.cardFooter}>
                  <Text style={styles.periodTag}>{item.period} Announcement</Text>
                  <View style={styles.ctaBtn}>
                    <Text style={styles.ctaBtnText}>Analyze Trade Playbook</Text>
                    <Ionicons name="chevron-forward" size={14} color="#000000" />
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.sans,
    fontSize: 13,
    marginLeft: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#000000',
  },
  verdictRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  verdictChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  verdictChipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: colors.accent,
  },
  verdictChipText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  verdictChipTextActive: {
    color: colors.accent,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symbolBox: {
    flex: 1,
  },
  symbolText: {
    fontSize: 16,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  companyName: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  verdictBadgeText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
  },
  eventTitle: {
    fontSize: 12,
    fontFamily: typography.sansMedium,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: typography.monoMedium,
    marginTop: 2,
  },
  metricValueHighlight: {
    fontSize: 12,
    fontFamily: typography.monoMedium,
    color: colors.accent,
    marginTop: 2,
  },
  metricRatingText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.positive,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  periodTag: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    gap: 4,
  },
  ctaBtnText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
});
