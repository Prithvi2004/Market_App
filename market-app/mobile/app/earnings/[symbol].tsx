/**
 * Deep Institutional Research & Short-Term Trader Playbook for Q-Results / Corporate Action.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface AnalysisResponse {
  symbol: string;
  company_name: string;
  verdict: string;
  verdict_badge_color: string;
  short_term_rating: string;
  executive_summary: string;
  financial_grid: {
    revenue_cr: number;
    revenue_yoy_pct: number;
    revenue_qoq_pct: number;
    pat_cr: number;
    pat_yoy_pct: number;
    pat_qoq_pct: number;
    ebitda_margin_pct: number;
    surprise_verdict: string;
  };
  trader_playbook: {
    entry_strategy: string;
    ideal_entry_zone: string;
    target_1_immediate: string;
    target_2_swing: string;
    stop_loss: string;
    risk_reward_ratio: string;
    optimal_holding_period: string;
    trading_action: string;
  };
  historical_reaction: {
    q4_fy25_post_move: string;
    q3_fy25_post_move: string;
    q2_fy25_post_move: string;
    q1_fy25_post_move: string;
    win_rate_post_earnings: string;
  };
  catalysts: string[];
  red_flags: string[];
}

export default function EarningsDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  const { data, isLoading } = useQuery<AnalysisResponse>({
    queryKey: ['earnings-analysis', symbol],
    queryFn: () => apiFetch(`/api/earnings/${encodeURIComponent(symbol || '')}/analysis`),
    enabled: !!symbol,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Synthesizing Institutional Q-Result Playbook...</Text>
      </View>
    );
  }

  const pb = data.trader_playbook;
  const fg = data.financial_grid;
  const hr = data.historical_reaction;

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
          <Text style={styles.navTitle}>{data.symbol.replace('.NS', '')}</Text>
          <Text style={styles.navSubtitle} numberOfLines={1}>{data.company_name}</Text>
        </View>
        <View style={styles.verdictBadge}>
          <Text style={styles.verdictBadgeText}>{data.verdict}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Rating Overview Banner ── */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View>
              <Text style={styles.overviewLabel}>SHORT-TERM TRADE POTENTIAL</Text>
              <Text style={styles.overviewRating}>{data.short_term_rating}</Text>
            </View>
            <View style={styles.actionPill}>
              <Text style={styles.actionPillText}>{pb.trading_action}</Text>
            </View>
          </View>
        </View>

        {/* ── Executive Verdict ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.accent} />
            <Text style={styles.sectionTitle}>Senior Analyst Verdict</Text>
          </View>
          <Text style={styles.summaryText}>{data.executive_summary}</Text>
        </View>

        {/* ── Financial Performance Matrix ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bar-chart-outline" size={16} color={colors.accent} />
            <Text style={styles.sectionTitle}>Financial Surprise Matrix</Text>
          </View>

          <View style={styles.finGrid}>
            <View style={styles.finCell}>
              <Text style={styles.finLabel}>NET PROFIT (PAT)</Text>
              <Text style={styles.finValue}>₹{fg.pat_cr.toLocaleString()} Cr</Text>
              <Text
                style={[
                  styles.finSub,
                  { color: fg.pat_yoy_pct >= 0 ? colors.bull : colors.bear },
                ]}
              >
                {fg.pat_yoy_pct >= 0 ? `+${fg.pat_yoy_pct}% YoY` : `${fg.pat_yoy_pct}% YoY`}
              </Text>
            </View>

            <View style={styles.finCellDivider} />

            <View style={styles.finCell}>
              <Text style={styles.finLabel}>REVENUE</Text>
              <Text style={styles.finValue}>₹{fg.revenue_cr.toLocaleString()} Cr</Text>
              <Text
                style={[
                  styles.finSub,
                  { color: fg.revenue_yoy_pct >= 0 ? colors.bull : colors.bear },
                ]}
              >
                {fg.revenue_yoy_pct >= 0 ? `+${fg.revenue_yoy_pct}% YoY` : `${fg.revenue_yoy_pct}% YoY`}
              </Text>
            </View>

            <View style={styles.finCellDivider} />

            <View style={styles.finCell}>
              <Text style={styles.finLabel}>EBITDA MARGIN</Text>
              <Text style={[styles.finValue, { color: colors.accent }]}>
                {fg.ebitda_margin_pct}%
              </Text>
              <Text style={styles.finSubMuted}>Operating Margin</Text>
            </View>
          </View>

          <View style={styles.surpriseBanner}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.accent} />
            <Text style={styles.surpriseVerdict}>{fg.surprise_verdict}</Text>
          </View>
        </View>

        {/* ── Short-Term Trader Profit Playbook ── */}
        <View style={styles.playbookCard}>
          <View style={styles.playbookHeader}>
            <View style={styles.playbookTitleRow}>
              <Ionicons name="flash" size={16} color={colors.accent} />
              <Text style={styles.playbookTitle}>SHORT-TERM TRADER PLAYBOOK</Text>
            </View>
            <View style={styles.holdingPill}>
              <Text style={styles.holdingPillText}>{pb.optimal_holding_period}</Text>
            </View>
          </View>

          <View style={styles.strategyBox}>
            <Text style={styles.strategyText}>{pb.entry_strategy}</Text>
          </View>

          {/* 2x2 Target Matrix */}
          <View style={styles.targetsGrid}>
            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>IDEAL ENTRY ZONE</Text>
              <Text style={styles.targetValueGold}>{pb.ideal_entry_zone}</Text>
            </View>

            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>STOP-LOSS</Text>
              <Text style={styles.targetValueRed}>{pb.stop_loss}</Text>
            </View>

            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>TARGET 1 (0-3 DAYS)</Text>
              <Text style={styles.targetValueGreen}>{pb.target_1_immediate}</Text>
            </View>

            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>TARGET 2 (1-4 WEEKS)</Text>
              <Text style={styles.targetValueGreen}>{pb.target_2_swing}</Text>
            </View>
          </View>

          <View style={styles.riskRewardRow}>
            <Text style={styles.riskRewardLabel}>Risk : Reward Ratio</Text>
            <Text style={styles.riskRewardVal}>{pb.risk_reward_ratio}</Text>
          </View>
        </View>

        {/* ── Post-Earnings Reaction History ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <Text style={styles.sectionTitle}>Post-Earnings Reaction History</Text>
            <View style={styles.winRateBadge}>
              <Text style={styles.winRateText}>{hr.win_rate_post_earnings}</Text>
            </View>
          </View>

          <View style={styles.reactionList}>
            {[
              { period: 'Q4 FY25 Result', val: hr.q4_fy25_post_move },
              { period: 'Q3 FY25 Result', val: hr.q3_fy25_post_move },
              { period: 'Q2 FY25 Result', val: hr.q2_fy25_post_move },
              { period: 'Q1 FY25 Result', val: hr.q1_fy25_post_move },
            ].map((item, idx) => (
              <View key={idx} style={styles.reactionRow}>
                <Text style={styles.reactionPeriod}>{item.period}</Text>
                <Text style={styles.reactionVal}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Growth Catalysts & Risk Audit ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-up-outline" size={16} color={colors.bull} />
            <Text style={styles.sectionTitle}>Growth Catalysts</Text>
          </View>
          <View style={styles.bulletList}>
            {data.catalysts.map((cat, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.bull} style={{ marginTop: 2 }} />
                <Text style={styles.bulletText}>{cat}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.sectionHeaderRow, { marginTop: spacing.md }]}>
            <Ionicons name="warning-outline" size={16} color={colors.bear} />
            <Text style={styles.sectionTitle}>Risk Audit & Caveats</Text>
          </View>
          <View style={styles.bulletList}>
            {data.red_flags.map((rf, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="alert-circle" size={14} color={colors.bear} style={{ marginTop: 2 }} />
                <Text style={styles.bulletText}>{rf}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingState: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textMuted,
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
  },
  navSubtitle: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 1,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  verdictBadgeText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.bull,
  },

  // Overview Banner
  overviewCard: {
    backgroundColor: '#151822',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  overviewRating: {
    fontSize: 13,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  actionPillText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: '#0b0b09',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#151822',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: 12.5,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Financial Grid
  finGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  finCell: {
    flex: 1,
    alignItems: 'center',
  },
  finCellDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  finLabel: {
    fontSize: 8.5,
    fontFamily: typography.monoMedium,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  finValue: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  finSub: {
    fontSize: 10,
    fontFamily: typography.monoMedium,
    marginTop: 2,
  },
  finSubMuted: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textDim,
    marginTop: 2,
  },
  surpriseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 150, 58, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.2)',
  },
  surpriseVerdict: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.accent,
  },

  // Playbook Standout Card
  playbookCard: {
    backgroundColor: '#181d29',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.2,
    borderColor: 'rgba(212, 150, 58, 0.45)',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playbookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playbookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playbookTitle: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  holdingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  holdingPillText: {
    fontSize: 9.5,
    fontFamily: typography.monoMedium,
    color: colors.textMuted,
  },
  strategyBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  strategyText: {
    fontSize: 11.5,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetBox: {
    width: '48.5%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  targetLabel: {
    fontSize: 8.5,
    fontFamily: typography.monoMedium,
    color: colors.textDim,
  },
  targetValueGold: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.accent,
    marginTop: 3,
  },
  targetValueGreen: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.bull,
    marginTop: 3,
  },
  targetValueRed: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.bear,
    marginTop: 3,
  },
  riskRewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  riskRewardLabel: {
    fontSize: 10.5,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  riskRewardVal: {
    fontSize: 11,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },

  // Reaction Scorecard
  winRateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  winRateText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.bull,
  },
  reactionList: {
    gap: 6,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  reactionPeriod: {
    fontSize: 11.5,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  reactionVal: {
    fontSize: 11.5,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },

  // Bullets
  bulletList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
