/**
 * Senior Analyst IPO Deep Research & Allotment Strategy Screen.
 * Complete Groww-style Lifecycle Stepper, Registrar Allotment Link, and Financial Breakdown.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface IPODetailReport {
  ipo_details: {
    id: string;
    name: string;
    symbol: string;
    status: string;
    category: string;
    sector: string;
    exchange?: string;
    price_min: number;
    price_max: number;
    lot_size: number;
    min_investment?: number;
    issue_size_cr: number;
    fresh_issue_cr: number;
    ofs_cr: number;
    open_date: string;
    close_date: string;
    allotment_date: string;
    refund_date?: string;
    demat_credit_date?: string;
    listing_date: string;
    registrar_name?: string;
    registrar_url?: string;
    gmp_rs: number;
    gmp_pct: number;
    gmp_trend: { day: string; gmp: number; pct: number }[];
    qib_sub: number;
    nii_sub: number;
    retail_sub: number;
    total_sub: number;
    rev_growth_pct?: number;
    pat_margin_pct?: number;
    pe_ratio?: number;
    financials?: {
      fy24_revenue: number;
      fy25_revenue: number;
      fy26_revenue: number;
      fy26_pat: number;
      net_worth: number;
    };
    promoter_holding?: {
      pre_issue: number;
      post_issue: number;
    };
  };
  analyst_report: {
    ipo_name: string;
    recommendation: string;
    recommendation_badge_color?: string;
    executive_summary?: string;
    confidence_rating: string;
    fair_value_estimate: string;
    predicted_listing_gain_pct: number;
    predicted_listing_price: number;
    expected_profit_per_lot?: number;
    valuation_analysis?: {
      pe_ratio_verdict: string;
      financial_health_score: string;
      competitive_moat: string;
    };
    strengths: string[];
    red_flags: string[];
    allotment_maximizer_strategy?: {
      retail_strategy: string;
      hni_strategy: string;
      key_action_items: string[];
    };
    allotment_maximizer_steps?: string[];
    post_listing_plan?: {
      flippers: string;
      long_term_investors: string;
    };
  };
}

export default function IPODetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<IPODetailReport>({
    queryKey: ['ipo-detail', id],
    queryFn: () => apiFetch(`/api/ipo/${id}/analysis`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'IPO Research Report' }} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Synthesizing OpenRouter ox-alpha Research Report...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'IPO Research Report' }} />
        <Text style={styles.errorText}>Unable to load IPO research. Tap to retry.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { ipo_details: details, analyst_report: report } = data;

  const steps =
    report.allotment_maximizer_strategy?.key_action_items ||
    report.allotment_maximizer_steps ||
    [];

  const lotCost = details.min_investment || (details.price_max * details.lot_size);
  const profitPerLot = report.expected_profit_per_lot || (details.gmp_rs * details.lot_size);

  const timelineSteps = [
    { title: 'Bidding Starts', date: details.open_date, icon: 'calendar-outline' },
    { title: 'Bidding Closes', date: details.close_date, icon: 'lock-closed-outline' },
    { title: 'Allotment Finalization', date: details.allotment_date, icon: 'checkmark-circle-outline' },
    { title: 'Refunds Initiated', date: details.refund_date || details.allotment_date, icon: 'refresh-circle-outline' },
    { title: 'Demat Credit', date: details.demat_credit_date || details.allotment_date, icon: 'wallet-outline' },
    { title: 'Listing Day', date: details.listing_date, icon: 'trending-up-outline' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: `${details.symbol} IPO`,
          headerStyle: { backgroundColor: '#090A0F' },
          headerTintColor: colors.textPrimary,
        }}
      />

      {/* Header Box */}
      <View style={styles.headerBox}>
        <View style={styles.tagRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{details.category.toUpperCase()}</Text>
          </View>
          <View style={styles.tagBadgeOutline}>
            <Text style={styles.tagTextOutline}>{details.exchange || 'NSE / BSE'}</Text>
          </View>
          <View style={styles.tagBadgeOutline}>
            <Text style={styles.tagTextOutline}>{details.sector}</Text>
          </View>
        </View>
        <Text style={styles.mainTitle}>{details.name}</Text>
        <Text style={styles.subTitle}>
          Symbol: {details.symbol} • Lot Size: {details.lot_size} shares
        </Text>
      </View>

      {/* Recommendation Banner */}
      <View style={styles.recCard}>
        <View style={styles.recHeader}>
          <View style={styles.recBadge}>
            <Text style={styles.recBadgeText}>{report.recommendation}</Text>
          </View>
          <View style={styles.confBox}>
            <Text style={styles.confLabel}>CONFIDENCE</Text>
            <Text style={styles.confValue}>{report.confidence_rating}</Text>
          </View>
        </View>

        {report.executive_summary && (
          <Text style={styles.summaryText}>{report.executive_summary}</Text>
        )}

        <View style={styles.predictionGrid}>
          <View style={styles.predBox}>
            <Text style={styles.predLabel}>EST. LISTING</Text>
            <Text style={styles.predPrice}>₹{report.predicted_listing_price}</Text>
            <Text style={styles.predSub}>(+{report.predicted_listing_gain_pct}%)</Text>
          </View>
          <View style={styles.predBox}>
            <Text style={styles.predLabel}>PROFIT / LOT</Text>
            <Text style={[styles.predPrice, { color: '#10B981' }]}>
              +₹{profitPerLot.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.predSub}>Lot: ₹{lotCost.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.predBox}>
            <Text style={styles.predLabel}>FAIR VALUE</Text>
            <Text style={styles.predValue}>{report.fair_value_estimate}</Text>
            <Text style={styles.predSub}>Band: ₹{details.price_max}</Text>
          </View>
        </View>
      </View>

      {/* Groww-Style 6-Step Lifecycle Timeline */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>IPO Event Timeline (Lifecycle)</Text>
        </View>
        <View style={styles.timelineContainer}>
          {timelineSteps.map((step, idx) => (
            <View key={idx} style={styles.timelineStep}>
              <View style={styles.timelineIconBox}>
                <Ionicons name={step.icon as any} size={14} color={colors.accent} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Registrar & Allotment Link */}
      {details.registrar_name && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Registrar & Allotment Status</Text>
          </View>
          <Text style={styles.regName}>{details.registrar_name}</Text>
          {details.registrar_url && (
            <TouchableOpacity
              style={styles.regButton}
              onPress={() => Linking.openURL(details.registrar_url!)}
            >
              <Text style={styles.regButtonText}>Check Allotment Status Portal</Text>
              <Ionicons name="open-outline" size={14} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Groww-style Financial History & Shareholding */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Financials & Shareholding</Text>
        </View>

        {details.financials && (
          <View style={styles.finGrid}>
            <View style={styles.finBox}>
              <Text style={styles.finBoxLabel}>FY24 Revenue</Text>
              <Text style={styles.finBoxVal}>₹{details.financials.fy24_revenue} Cr</Text>
            </View>
            <View style={styles.finBox}>
              <Text style={styles.finBoxLabel}>FY25 Revenue</Text>
              <Text style={styles.finBoxVal}>₹{details.financials.fy25_revenue} Cr</Text>
            </View>
            <View style={styles.finBox}>
              <Text style={styles.finBoxLabel}>FY26 Revenue</Text>
              <Text style={styles.finBoxVal}>₹{details.financials.fy26_revenue} Cr</Text>
            </View>
          </View>
        )}

        {details.promoter_holding && (
          <View style={styles.holdingRow}>
            <View style={styles.holdingCell}>
              <Text style={styles.holdingLabel}>Pre-Issue Promoter Holding</Text>
              <Text style={styles.holdingVal}>{details.promoter_holding.pre_issue}%</Text>
            </View>
            <View style={styles.holdingCell}>
              <Text style={styles.holdingLabel}>Post-Issue Promoter Holding</Text>
              <Text style={styles.holdingVal}>{details.promoter_holding.post_issue}%</Text>
            </View>
          </View>
        )}
      </View>

      {/* Subscription Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pie-chart" size={18} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Demand & Subscription Breakdown</Text>
        </View>
        <View style={styles.subGrid}>
          <View style={styles.subBox}>
            <Text style={styles.subBoxLabel}>QIB (Inst.)</Text>
            <Text style={styles.subBoxVal}>{details.qib_sub}x</Text>
          </View>
          <View style={styles.subBox}>
            <Text style={styles.subBoxLabel}>NII (HNI)</Text>
            <Text style={styles.subBoxVal}>{details.nii_sub}x</Text>
          </View>
          <View style={styles.subBox}>
            <Text style={styles.subBoxLabel}>Retail</Text>
            <Text style={styles.subBoxVal}>{details.retail_sub}x</Text>
          </View>
          <View style={[styles.subBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Text style={styles.subBoxLabel}>Total Oversub</Text>
            <Text style={[styles.subBoxVal, { color: colors.accent }]}>
              {details.total_sub}x
            </Text>
          </View>
        </View>
      </View>

      {/* Allotment Maximizer Playbook */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Allotment Maximizer Playbook</Text>
        </View>

        {report.allotment_maximizer_strategy?.retail_strategy && (
          <View style={styles.stratCallout}>
            <Text style={styles.stratTitle}>Retail Strategy (&lt; ₹2 Lakhs)</Text>
            <Text style={styles.stratText}>{report.allotment_maximizer_strategy.retail_strategy}</Text>
          </View>
        )}

        <Text style={styles.subSectionTitle}>Actionable Steps to Increase Allotment Odds:</Text>
        <View style={styles.stepsList}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Key Strengths & Red Flags Audit */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Senior Analyst Risk & Growth Audit</Text>

        <View style={styles.auditGroup}>
          <Text style={styles.auditSubTitle}>✅ Growth Drivers & Key Strengths</Text>
          {report.strengths.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.auditItem}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.auditGroup}>
          <Text style={[styles.auditSubTitle, { color: '#EF4444' }]}>⚠️ Key Risks & Red Flags</Text>
          {report.red_flags.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: '#EF4444' }]}>•</Text>
              <Text style={styles.auditItem}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: '#090A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.negative,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  retryText: {
    color: '#000000',
    fontFamily: typography.sansBold,
    fontSize: 12,
  },
  headerBox: {
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  tagBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#000',
    fontSize: 9,
    fontFamily: typography.sansBold,
  },
  tagBadgeOutline: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagTextOutline: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: typography.sans,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  recCard: {
    backgroundColor: '#12131A',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    gap: spacing.sm,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  recBadgeText: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  confBox: {
    alignItems: 'flex-end',
  },
  confLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  confValue: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: '#10B981',
  },
  summaryText: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  predictionGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
    marginTop: 4,
  },
  predBox: {
    flex: 1,
    alignItems: 'center',
  },
  predLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  predPrice: {
    fontSize: 14,
    fontFamily: typography.mono,
    color: colors.textPrimary,
    marginTop: 2,
  },
  predSub: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  predValue: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.accent,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#12131A',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  timelineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  timelineStep: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  timelineIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  timelineDate: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.accent,
  },
  regName: {
    fontSize: 12,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  regButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  regButtonText: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
  finGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  finBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  finBoxLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  finBoxVal: {
    fontSize: 11,
    fontFamily: typography.mono,
    color: colors.textPrimary,
    marginTop: 2,
  },
  holdingRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.sm,
    borderRadius: radius.md,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  holdingCell: {
    flex: 1,
    alignItems: 'center',
  },
  holdingLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  holdingVal: {
    fontSize: 12,
    fontFamily: typography.mono,
    color: '#10B981',
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.textSecondary,
    marginTop: 6,
  },
  subGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  subBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: 2,
  },
  subBoxLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  subBoxVal: {
    fontSize: 13,
    fontFamily: typography.mono,
    color: colors.textPrimary,
  },
  stratCallout: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 4,
    gap: 2,
  },
  stratTitle: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  stratText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  stepsList: {
    gap: 6,
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  auditGroup: {
    gap: 4,
    marginTop: 4,
  },
  auditSubTitle: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: '#10B981',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: typography.sansBold,
  },
  auditItem: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
