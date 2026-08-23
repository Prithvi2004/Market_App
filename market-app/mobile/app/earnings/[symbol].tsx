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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.symbolTitle}>{data.symbol.replace('.NS', '')}</Text>
            <Text style={styles.companySub}>{data.company_name}</Text>
          </View>
          <View style={styles.verdictBadge}>
            <Text style={styles.verdictBadgeText}>{data.verdict}</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Short-Term Profit Potential:</Text>
          <Text style={styles.ratingValue}>{data.short_term_rating}</Text>
        </View>
      </View>

      {/* Executive Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>📊 Senior Analyst Verdict</Text>
        <Text style={styles.summaryText}>{data.executive_summary}</Text>
      </View>

      {/* Financial Performance Matrix */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>📈 Financial Surprise Matrix</Text>
        <View style={styles.finGrid}>
          <View style={styles.finCell}>
            <Text style={styles.finLabel}>NET PROFIT (PAT)</Text>
            <Text style={styles.finValue}>₹{fg.pat_cr.toLocaleString()} Cr</Text>
            <Text style={[styles.finSub, { color: fg.pat_yoy_pct >= 0 ? colors.positive : colors.negative }]}>
              {fg.pat_yoy_pct >= 0 ? `+${fg.pat_yoy_pct}% YoY` : `${fg.pat_yoy_pct}% YoY`}
            </Text>
          </View>

          <View style={styles.finCell}>
            <Text style={styles.finLabel}>REVENUE</Text>
            <Text style={styles.finValue}>₹{fg.revenue_cr.toLocaleString()} Cr</Text>
            <Text style={[styles.finSub, { color: fg.revenue_yoy_pct >= 0 ? colors.positive : colors.negative }]}>
              {fg.revenue_yoy_pct >= 0 ? `+${fg.revenue_yoy_pct}% YoY` : `${fg.revenue_yoy_pct}% YoY`}
            </Text>
          </View>

          <View style={styles.finCell}>
            <Text style={styles.finLabel}>EBITDA MARGIN</Text>
            <Text style={[styles.finValue, { color: colors.accent }]}>{fg.ebitda_margin_pct}%</Text>
            <Text style={styles.finSubMuted}>Operating Leverage</Text>
          </View>
        </View>
        <Text style={styles.surpriseVerdict}>{fg.surprise_verdict}</Text>
      </View>

      {/* SHORT-TERM TRADER PROFIT PLAYBOOK (GOLD/EMERALD STANDOUT CARD) */}
      <View style={styles.playbookCard}>
        <View style={styles.playbookHeader}>
          <Ionicons name="flash" size={18} color="#000000" />
          <Text style={styles.playbookTitle}>SHORT-TERM TRADER PLAYBOOK</Text>
          <View style={styles.actionTag}>
            <Text style={styles.actionTagText}>{pb.trading_action}</Text>
          </View>
        </View>

        <Text style={styles.entryStrategyText}>{pb.entry_strategy}</Text>

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

        <View style={styles.playbookMetaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>Risk : Reward</Text>
            <Text style={styles.metaPillVal}>{pb.risk_reward_ratio}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>Holding Window</Text>
            <Text style={styles.metaPillVal}>{pb.optimal_holding_period}</Text>
          </View>
        </View>
      </View>

      {/* Historical Stock Reaction Scorecard */}
      <View style={styles.sectionCard}>
        <View style={styles.scorecardHeader}>
          <Text style={styles.sectionHeader}>⏳ Post-Earnings Reaction History</Text>
          <Text style={styles.winRateText}>{hr.win_rate_post_earnings}</Text>
        </View>

        <View style={styles.reactionList}>
          <View style={styles.reactionRow}>
            <Text style={styles.reactionPeriod}>Q4 FY25 Result</Text>
            <Text style={styles.reactionVal}>{hr.q4_fy25_post_move}</Text>
          </View>
          <View style={styles.reactionRow}>
            <Text style={styles.reactionPeriod}>Q3 FY25 Result</Text>
            <Text style={styles.reactionVal}>{hr.q3_fy25_post_move}</Text>
          </View>
          <View style={styles.reactionRow}>
            <Text style={styles.reactionPeriod}>Q2 FY25 Result</Text>
            <Text style={styles.reactionVal}>{hr.q2_fy25_post_move}</Text>
          </View>
          <View style={styles.reactionRow}>
            <Text style={styles.reactionPeriod}>Q1 FY25 Result</Text>
            <Text style={styles.reactionVal}>{hr.q1_fy25_post_move}</Text>
          </View>
        </View>
      </View>

      {/* Catalysts & Red Flags */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>🚀 Growth Catalysts</Text>
        {data.catalysts.map((cat, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.positive} />
            <Text style={styles.bulletText}>{cat}</Text>
          </View>
        ))}

        <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>⚠️ Risk Audit</Text>
        {data.red_flags.map((rf, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <Ionicons name="alert-circle" size={14} color={colors.negative} />
            <Text style={styles.bulletText}>{rf}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symbolTitle: {
    fontSize: 22,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  companySub: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.5)',
  },
  verdictBadgeText: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.positive,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ratingLabel: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  ratingValue: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  finGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  finCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  finValue: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  finSub: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    marginTop: 2,
  },
  finSubMuted: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 2,
  },
  surpriseVerdict: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.accent,
    marginTop: 2,
  },
  playbookCard: {
    backgroundColor: '#161922',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    gap: spacing.sm,
  },
  playbookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playbookTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  actionTag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  actionTagText: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
  entryStrategyText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: 2,
  },
  targetBox: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  targetLabel: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  targetValueGold: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.accent,
    marginTop: 2,
  },
  targetValueGreen: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.positive,
    marginTop: 2,
  },
  targetValueRed: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
    color: colors.negative,
    marginTop: 2,
  },
  playbookMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaPill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillLabel: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  metaPillVal: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  scorecardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winRateText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.positive,
  },
  reactionList: {
    gap: spacing.xs,
    marginTop: 2,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  reactionPeriod: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  reactionVal: {
    fontSize: 11,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bulletText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    flex: 1,
  },
});
