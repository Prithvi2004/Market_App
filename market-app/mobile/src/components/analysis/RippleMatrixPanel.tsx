/**
 * Sister Company & Conglomerate News Ripple Matrix Panel.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface RippleSpillover {
  symbol: string;
  name: string;
  impact_score: number;
  spillover_type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rationale: string;
}

interface RippleResponse {
  group_name: string;
  primary_ticker: string;
  primary_impact_score: number;
  validity_score: number;
  prediction_headline: string;
  executive_summary: string;
  causal_justification: string[];
  sister_spillovers: RippleSpillover[];
}

export function RippleMatrixPanel({ symbol }: { symbol: string }) {
  const { data, isLoading, refetch } = useQuery<RippleResponse>({
    queryKey: ['ripple-analysis', symbol],
    queryFn: () => apiFetch(`/api/analysis/ripple/${symbol}`),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Analyzing Sister-Company News Spillovers...</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBox}>
        <View style={styles.groupBadge}>
          <Ionicons name="git-network" size={14} color={colors.accent} />
          <Text style={styles.groupBadgeText}>{data.group_name}</Text>
        </View>

        <Text style={styles.headline}>{data.prediction_headline}</Text>
        <Text style={styles.summary}>{data.executive_summary}</Text>

        <View style={styles.scoresRow}>
          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>Impact Score</Text>
            <Text
              style={[
                styles.scoreVal,
                { color: data.primary_impact_score >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {data.primary_impact_score >= 0 ? `+${data.primary_impact_score}` : data.primary_impact_score}
            </Text>
          </View>

          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>News Validity</Text>
            <Text style={[styles.scoreVal, { color: colors.accent }]}>{data.validity_score}%</Text>
          </View>
        </View>
      </View>

      {/* Causal Chain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Causal Impact Chain</Text>
        {data.causal_justification.map((step, idx) => (
          <View key={idx} style={styles.chainRow}>
            <Text style={styles.chainNum}>{idx + 1}.</Text>
            <Text style={styles.chainText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Sister Companies Spillover Cards */}
      {data.sister_spillovers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Sister Company Spillovers</Text>
          {data.sister_spillovers.map((item, idx) => (
            <View key={idx} style={styles.sisterCard}>
              <View style={styles.sisterHeader}>
                <View>
                  <Text style={styles.sisterName}>{item.name}</Text>
                  <Text style={styles.sisterSymbol}>{item.symbol}</Text>
                </View>

                <View
                  style={[
                    styles.spilloverTag,
                    item.spillover_type === 'BULLISH'
                      ? styles.tagBullish
                      : item.spillover_type === 'BEARISH'
                      ? styles.tagBearish
                      : styles.tagNeutral,
                  ]}
                >
                  <Text style={styles.tagText}>{item.spillover_type}</Text>
                </View>
              </View>

              <Text style={styles.sisterRationale}>{item.rationale}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  center: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  headerBox: {
    backgroundColor: '#12131A',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    gap: spacing.sm,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  groupBadgeText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  headline: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  summary: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  scorePill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  scoreVal: {
    fontSize: 14,
    fontFamily: typography.mono,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#12131A',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  chainRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chainNum: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  chainText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sisterCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  sisterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sisterName: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  sisterSymbol: {
    fontSize: 10,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  spilloverTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagBullish: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  tagBearish: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  tagNeutral: {
    backgroundColor: 'rgba(156,163,175,0.15)',
  },
  tagText: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  sisterRationale: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textMuted,
    lineHeight: 15,
  },
});
