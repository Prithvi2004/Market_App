/**
 * MiniStockModal — Sleek bottom-sheet modal matching Web App Screenshot 1.
 * Mobile-first architecture: 4-Level Information Hierarchy, 2-column MetricCards, 52W range track.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { ChartView } from './ChartView';
import { NewsCard } from '../news/NewsCard';
import { MetricCard } from '../ui/MetricCard';
import { TouchPill } from '../ui/TouchPill';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatINR, formatPct, formatIndianNumber, formatSigned, signColor, shortSymbol } from '../../utils/formatters';
import type { Quote, OHLCVBar } from '../../types/market';
import type { NewsArticle } from '../../types/news';

interface MiniStockModalProps {
  symbol: string | null;
  visible: boolean;
  onClose: () => void;
}

const RANGES = ['1D', '1W', '1M', '1Y'];

export function MiniStockModal({ symbol, visible, onClose }: MiniStockModalProps) {
  const router = useRouter();
  const [range, setRange] = useState('1D');

  const cleanSym = symbol ? symbol.toUpperCase() : '';
  const symShort = shortSymbol(cleanSym);

  // 1. Fetch quote
  const { data: quote } = useQuery<Quote>({
    queryKey: ['quote', cleanSym],
    queryFn: () => apiFetch(`/api/quote?symbol=${cleanSym}`),
    enabled: !!cleanSym && visible,
    refetchInterval: 10_000,
  });

  // 2. Fetch chart
  const { data: chartData, isLoading: chartLoading } = useQuery<{ bars: OHLCVBar[] }>({
    queryKey: ['chart', cleanSym, range],
    queryFn: () => apiFetch(`/api/chart?symbol=${cleanSym}&range=${range}`),
    enabled: !!cleanSym && visible,
  });

  // 3. Fetch related news
  const { data: newsData } = useQuery<NewsArticle[]>({
    queryKey: ['ticker_news', cleanSym],
    queryFn: () => apiFetch(`/api/news?ticker=${cleanSym}&limit=5`),
    enabled: !!cleanSym && visible,
  });

  if (!cleanSym || !visible) return null;

  const rawBars = Array.isArray(chartData) ? chartData : (chartData as any)?.bars ?? [];
  const price = quote?.price ?? rawBars[rawBars.length - 1]?.c ?? 0;
  const change = quote?.change ?? 0;
  const changePct = quote?.change_pct ?? 0;

  // 52-week range calculations
  const high52 = quote?.high_52w ?? price * 1.15;
  const low52 = quote?.low_52w ?? price * 0.85;
  const range52 = high52 - low52 || 1;
  const pct52 = Math.max(2, Math.min(98, Math.round(((price - low52) / range52) * 100)));

  const handleFullAnalysis = () => {
    onClose();
    router.push(`/analysis/${encodeURIComponent(cleanSym)}` as any);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Handle bar indicator */}
          <View style={styles.handle} />

          {/* Level 1: Asset Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.nameText} numberOfLines={1}>
                {quote?.name ?? symShort}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.nseBadge}>
                  <Text style={styles.nseText}>{quote?.exchange ?? 'NSE'}</Text>
                </View>
                {quote?.stale && (
                  <View style={styles.staleBadge}>
                    <Text style={styles.staleText}>stale</Text>
                  </View>
                )}
                <Text style={styles.symbolSubText}>{cleanSym}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleFullAnalysis}
                style={styles.fullAnalysisBtn}
              >
                <Text style={styles.fullAnalysisText}>⚡ Full Analysis</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Level 1: Price & Movement */}
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{formatINR(price)}</Text>

              <View style={styles.changeBadge}>
                <Text style={[styles.changeText, { color: signColor(change) }]}>
                  {formatSigned(change)} ({formatPct(changePct)})
                </Text>
              </View>
            </View>

            {/* Level 2: 52-Week Price Range Slider */}
            <View style={styles.rangeBox}>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeMinText}>52W Low {formatINR(low52)}</Text>
                <Text style={styles.rangeMaxText}>52W High {formatINR(high52)}</Text>
              </View>

              <View style={styles.rangeTrack}>
                <View style={[styles.rangeProgress, { width: `${pct52}%` }]} />
                <View style={[styles.rangeThumb, { left: `${pct52}%` }]} />
              </View>

              <Text style={styles.rangeInfoText}>At {pct52}% of 52-week range</Text>
            </View>

            {/* Level 2: Primary Price Chart */}
            <View style={styles.chartBox}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Price Chart</Text>
                <View style={styles.rangePicker}>
                  {RANGES.map((r) => (
                    <TouchPill
                      key={r}
                      label={r}
                      active={range === r}
                      onPress={() => setRange(r)}
                      style={styles.pillOverride}
                    />
                  ))}
                </View>
              </View>

              <ChartView
                data={chartData}
                isLoading={chartLoading}
                range={range}
                onRangeChange={setRange}
                onExpand={handleFullAnalysis}
              />
            </View>

            {/* Level 3: Metric Cards Grid */}
            <View style={styles.metricsGrid2Col}>
              <MetricCard
                label="Volume"
                value={quote?.volume ? formatIndianNumber(quote.volume) : '—'}
              />
              <MetricCard
                label="Market Cap"
                value={quote?.market_cap ? formatINR(quote.market_cap) : '—'}
              />
              <MetricCard
                label="52W High"
                value={formatINR(high52)}
                valueColor={colors.bull}
              />
              <MetricCard
                label="52W Low"
                value={formatINR(low52)}
                valueColor={colors.bear}
              />
            </View>

            {/* Level 4: Related News Feed */}
            <View style={styles.newsSection}>
              <Text style={styles.newsTitle}>Related News ({newsData?.length ?? 0})</Text>
              {newsData && newsData.length > 0 ? (
                newsData.slice(0, 3).map((art) => <NewsCard key={art.id} article={art} />)
              ) : (
                <Text style={styles.emptyNewsText}>No recent market intelligence news for {cleanSym}.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
    marginRight: spacing.xs,
  },
  nameText: {
    fontSize: typography.size.lg,
    fontFamily: typography.serif,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nseBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nseText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.textSecondary,
  },
  staleBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  staleText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },
  symbolSubText: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fullAnalysisBtn: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  fullAnalysisText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  closeBtn: {
    padding: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  closeText: {
    fontSize: typography.size.md,
    color: colors.textMuted,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  priceText: {
    fontSize: typography.size['3xl'],
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  changeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  changeText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
  },
  metricsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  rangeBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeMinText: {
    fontSize: 9,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  rangeMaxText: {
    fontSize: 9,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  rangeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  rangeProgress: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  rangeThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.accent,
    top: -3,
    marginLeft: -6,
  },
  rangeInfoText: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chartBox: {
    gap: spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  rangePicker: {
    flexDirection: 'row',
    gap: 4,
  },
  pillOverride: {
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newsSection: {
    gap: spacing.xs,
  },
  newsTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  emptyNewsText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
