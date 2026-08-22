/**
 * Stock Detail Screen — comprehensive stock view with live quote, chart, fundamentals, peers, AI explainer, and ticker news.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useQuote,
  useChart,
  useFundamentals,
  usePeers,
} from '../../src/api/market';
import { useTickerNews } from '../../src/api/news';
import { usePortfolioStore } from '../../src/store/usePortfolioStore';
import { ChartView } from '../../src/components/stock/ChartView';
import { FundamentalsPanel } from '../../src/components/stock/FundamentalsPanel';
import { PeersPanel } from '../../src/components/stock/PeersPanel';
import { AIExplainer } from '../../src/components/stock/AIExplainer';
import { NewsCard } from '../../src/components/news/NewsCard';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import {
  formatINR,
  formatPct,
  shortSymbol,
  signColor,
  formatIndianNumber,
} from '../../src/utils/formatters';

type Tab = 'ai' | 'fundamentals' | 'peers' | 'news';

export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : '';
  const symShort = shortSymbol(symbol);

  const [chartRange, setChartRange] = useState('1D');
  const [activeTab, setActiveTab] = useState<Tab>('ai');

  // API hooks
  const { data: quote, isLoading: quoteLoading, refetch: refetchQuote } = useQuote(symbol);
  const { data: chartData, isLoading: chartLoading, refetch: refetchChart } = useChart(symbol, chartRange);
  const { data: fundamentals, isLoading: fundLoading } = useFundamentals(symbol);
  const { data: peers, isLoading: peersLoading } = usePeers(symbol);
  const { data: newsData, isLoading: newsLoading } = useTickerNews(symbol, 10);

  // Portfolio store
  const { holdings, addHolding } = usePortfolioStore();
  const isHeld = holdings.some((h) => h.symbol === symbol);

  function handleRefresh() {
    refetchQuote();
    refetchChart();
  }

  function handleAddPortfolio() {
    if (isHeld) return;
    addHolding({
      symbol,
      name: quote?.name ?? symShort,
      qty: 1,
      buy_price: quote?.price ?? 0,
    });
  }

  const changeColor = signColor(quote?.change_pct);

  return (
    <>
      <Stack.Screen options={{ title: symShort }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={quoteLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Symbol Name & Exchange */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{quote?.name ?? symShort}</Text>
            <Text style={styles.exchange}>
              {quote?.exchange ?? 'NSE'} · {symbol}
            </Text>
          </View>
          <View style={styles.headerBtnRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/stock-screener/${encodeURIComponent(symbol)}`)}
              style={styles.screenerBtn}
            >
              <Text style={styles.screenerBtnText}>📈 Screener & Forecast ⤢</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/analysis/${encodeURIComponent(symbol)}`)}
              style={styles.terminalBtn}
            >
              <Text style={styles.terminalBtnText}>⚡ Deep Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Box */}
        <View style={styles.priceContainer}>
          {quoteLoading && !quote ? (
            <Skeleton height={40} width={180} />
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatINR(quote?.price)}</Text>
              <View style={styles.changeBadge}>
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {formatPct(quote?.change_pct)}
                </Text>
              </View>
            </View>
          )}

          {/* Quick Metrics */}
          <View style={styles.quickMetrics}>
            <MetricItem label="High" value={formatINR(quote?.high_52w)} />
            <MetricItem label="Low" value={formatINR(quote?.low_52w)} />
            <MetricItem label="Vol" value={formatIndianNumber(quote?.volume)} />
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddPortfolio}
            disabled={isHeld}
            style={[styles.actionBtn, isHeld && styles.actionBtnDisabled]}
          >
            <Text style={[styles.actionBtnText, isHeld && styles.actionBtnTextDisabled]}>
              {isHeld ? '✓ In Portfolio' : '+ Add to Portfolio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart View with Expand */}
        <View style={styles.chartCard}>
          <ChartView
            data={chartData}
            isLoading={chartLoading}
            range={chartRange}
            onRangeChange={setChartRange}
            onExpand={() => router.push(`/analysis/${encodeURIComponent(symbol)}`)}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsRow}>
          {(['ai', 'fundamentals', 'peers', 'news'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'ai'
                  ? '⚡ AI Explain'
                  : tab === 'fundamentals'
                  ? 'Fundamentals'
                  : tab === 'peers'
                  ? 'Peers'
                  : 'News'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'ai' && <AIExplainer symbol={symbol} />}
          {activeTab === 'fundamentals' && (
            fundLoading ? (
              <Skeleton height={200} />
            ) : fundamentals ? (
              <FundamentalsPanel data={fundamentals} />
            ) : (
              <Text style={styles.emptyText}>Fundamentals unavailable</Text>
            )
          )}
          {activeTab === 'peers' && (
            <PeersPanel
              peers={peers}
              isLoading={peersLoading}
              onSelectPeer={(pSym) => router.push(`/stock/${encodeURIComponent(pSym)}`)}
            />
          )}
          {activeTab === 'news' && (
            <View style={styles.newsList}>
              {newsLoading ? (
                <Skeleton height={120} />
              ) : newsData?.length ? (
                newsData.map((item) => (
                  <NewsCard
                    key={item.id}
                    article={item}
                    onTickerPress={(t) => router.push(`/stock/${encodeURIComponent(t)}`)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No recent news for this stock</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: typography.size.xl,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  exchange: {
    fontSize: typography.size.xs,
    fontFamily: typography.mono,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerBtnRow: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
  },
  screenerBtn: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  screenerBtnText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: '#60a5fa',
  },
  terminalBtn: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  terminalBtnText: {
    fontSize: 11,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },
  priceContainer: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  price: {
    fontSize: typography.size['4xl'],
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  changeText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
  },
  quickMetrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: 4,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.monoMedium,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: colors.cardBorder,
  },
  actionBtnText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  actionBtnTextDisabled: {
    color: colors.textMuted,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tabPillActive: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.accent,
  },
  tabContent: {
    marginTop: spacing.xs,
  },
  newsList: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
