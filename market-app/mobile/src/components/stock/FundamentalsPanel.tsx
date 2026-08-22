/**
 * FundamentalsPanel — key metrics for a stock.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatINR, formatIndianNumber } from '../../utils/formatters';
import type { Fundamentals } from '../../types/market';

interface FundamentalsPanelProps {
  data: Fundamentals;
}

export function FundamentalsPanel({ data: f }: FundamentalsPanelProps) {
  const fmt = (v: number | null | undefined, suffix = '') =>
    v != null ? `${v.toFixed(2)}${suffix}` : '—';

  const rows: { label: string; value: string }[] = [
    { label: 'Market Cap', value: formatIndianNumber(f.market_cap) },
    { label: 'P/E Ratio', value: fmt(f.pe_ratio) },
    { label: 'Fwd P/E', value: fmt(f.forward_pe) },
    { label: 'P/B Ratio', value: fmt(f.pb_ratio) },
    { label: 'EPS', value: fmt(f.eps) },
    { label: 'Div Yield', value: f.dividend_yield != null ? `${f.dividend_yield}%` : '—' },
    { label: 'ROE', value: f.roe != null ? `${f.roe}%` : '—' },
    { label: 'Profit Margin', value: f.profit_margin != null ? `${f.profit_margin}%` : '—' },
    { label: 'D/E Ratio', value: fmt(f.debt_to_equity) },
    { label: 'Beta', value: fmt(f.beta) },
    { label: '52W High', value: formatINR(f['52w_high']) },
    { label: '52W Low', value: formatINR(f['52w_low']) },
    { label: 'Revenue', value: formatIndianNumber(f.revenue) },
    { label: 'Book Value', value: fmt(f.book_value) },
    { label: 'Inst. Held', value: f.held_by_institutions != null ? `${f.held_by_institutions}%` : '—' },
    { label: 'Target Price', value: formatINR(f.target_price) },
    { label: 'Analysts', value: f.num_analysts != null ? String(f.num_analysts) : '—' },
    {
      label: 'Recommendation',
      value: f.analyst_recommendation
        ? f.analyst_recommendation.replace(/_/g, ' ').toUpperCase()
        : '—',
    },
  ];

  // 52W position bar
  const pos = f['52w_position_pct'];

  return (
    <View style={styles.container}>
      {/* Industry + Sector */}
      <View style={styles.tagRow}>
        {f.sector ? <Tag label={f.sector} /> : null}
        {f.industry ? <Tag label={f.industry} /> : null}
      </View>

      {/* 52W position bar */}
      {pos != null && (
        <View style={styles.posBar}>
          <Text style={styles.posLabel}>52W Position: {pos.toFixed(0)}%</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pos}%` as any }]} />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barMin}>{formatINR(f['52w_low'])}</Text>
            <Text style={styles.barMax}>{formatINR(f['52w_high'])}</Text>
          </View>
        </View>
      )}

      {/* Metrics grid */}
      <View style={styles.grid}>
        {rows.map((r) => (
          <View key={r.label} style={styles.cell}>
            <Text style={styles.cellLabel}>{r.label}</Text>
            <Text style={styles.cellValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={tagStyles.tag}>
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  posBar: {
    gap: 6,
  },
  posLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.15)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barMin: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  barMax: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  cell: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
  },
  cellLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
});
