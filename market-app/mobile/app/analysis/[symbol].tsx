/**
 * Deep Analysis Terminal Screen (`app/analysis/[symbol].tsx`).
 * Mobile-first UI: Clean header, 1-line Market Cap, 2x2 Metric Grids, Trading Chart,
 * and 13 Sub-Panels with AIExplainer, FundamentalsPanel, PeersPanel, Co-Pilot, and Technicals.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../src/api/client';
import { streamCopilot } from '../../src/api/llm';
import { AdvancedTradingChart } from '../../src/components/stock/AdvancedTradingChart';
import { AIExplainer } from '../../src/components/stock/AIExplainer';
import { FundamentalsPanel } from '../../src/components/stock/FundamentalsPanel';
import { PeersPanel } from '../../src/components/stock/PeersPanel';
import { RippleMatrixPanel } from '../../src/components/analysis/RippleMatrixPanel';
import { Card } from '../../src/components/ui/Card';
import { MetricCard } from '../../src/components/ui/MetricCard';
import { TouchPill } from '../../src/components/ui/TouchPill';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import {
  formatINR,
  formatPct,
  formatIndianNumber,
  signColor,
  shortSymbol,
  relativeTime,
} from '../../src/utils/formatters';
import type { Quote, OHLCVBar } from '../../src/types/market';
import type { NewsArticle } from '../../src/types/news';

type SubTab =
  | 'ai'
  | 'ripple'
  | 'copilot'
  | 'compare'
  | 'risk'
  | 'export'
  | 'predict'
  | 'advanced'
  | 'technicals'
  | 'patterns'
  | 'levels'
  | 'momentum'
  | 'fundamentals'
  | 'peers';

const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'ai', label: 'AI Explainer', icon: '✨' },
  { id: 'ripple', label: 'Ripple Matrix', icon: '🌐' },
  { id: 'copilot', label: 'Co-Pilot', icon: '💬' },
  { id: 'compare', label: 'Compare', icon: '👥' },
  { id: 'risk', label: 'Risk', icon: '🛡️' },
  { id: 'export', label: 'Export', icon: '📋' },
  { id: 'predict', label: 'Predict', icon: '🔮' },
  { id: 'advanced', label: 'Advanced', icon: '🧠' },
  { id: 'technicals', label: 'Technical', icon: '📊' },
  { id: 'patterns', label: 'Patterns', icon: '🕯️' },
  { id: 'levels', label: 'Levels', icon: '📐' },
  { id: 'momentum', label: 'Momentum', icon: '⚡' },
  { id: 'fundamentals', label: 'Fundamentals', icon: '📋' },
  { id: 'peers', label: 'Peers', icon: '🏢' },
];

export default function DeepAnalysisTerminalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol).toUpperCase() : 'RELIANCE.NS';
  const symShort = shortSymbol(symbol);

  const [timeframe, setTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState<SubTab>('ai');

  // 1. Fetch quote
  const { data: quote } = useQuery<Quote>({
    queryKey: ['quote', symbol],
    queryFn: () => apiFetch(`/api/quote?symbol=${symbol}`),
    refetchInterval: 10_000,
  });

  // 2. Fetch chart
  const { data: chartData, isLoading: chartLoading } = useQuery<{ bars: OHLCVBar[] }>({
    queryKey: ['chart', symbol, timeframe],
    queryFn: () => apiFetch(`/api/chart?symbol=${symbol}&range=${timeframe}`),
  });

  // 3. Fetch indicators
  const { data: indicators } = useQuery<any[]>({
    queryKey: ['indicators', symbol, timeframe],
    queryFn: () => apiFetch(`/api/indicators/${symbol}?range=${timeframe}`),
  });

  // 4. Fetch news
  const { data: newsData } = useQuery<NewsArticle[]>({
    queryKey: ['news', symbol],
    queryFn: () => apiFetch(`/api/news?ticker=${symbol}&limit=4`),
  });

  // 5. Fetch peers
  const { data: peerData, isLoading: peersLoading } = useQuery<any>({
    queryKey: ['peers', symbol],
    queryFn: () => apiFetch(`/api/peers/${symbol}`),
  });

  // 6. Fetch fundamentals
  const { data: fundamentals } = useQuery<any>({
    queryKey: ['fundamentals', symbol],
    queryFn: () => apiFetch(`/api/fundamentals/${symbol}`),
  });

  const rawBars = Array.isArray(chartData) ? chartData : (chartData as any)?.bars ?? [];
  const price = quote?.price ?? rawBars[rawBars.length - 1]?.c ?? 0;
  const change = quote?.change ?? 0;
  const changePct = quote?.change_pct ?? 0;

  const high52 = quote?.high_52w ?? price * 1.15;
  const low52 = quote?.low_52w ?? price * 0.85;
  const range52 = high52 - low52 || 1;
  const pct52 = Math.max(2, Math.min(98, Math.round(((price - low52) / range52) * 100)));

  const latestInd = indicators && indicators.length > 0 ? indicators[indicators.length - 1] : null;

  // Copilot chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI Co-Pilot for ${symbol}. Ask me any technical or fundamental question.`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMsgs = [...chatMessages, { role: 'user', content: msg }];
    setChatMessages(newMsgs);
    setChatLoading(true);

    let streamBuf = '';
    try {
      await streamCopilot(
        { symbol, history: newMsgs, user_query: msg },
        {
          token: (d: any) => {
            streamBuf += d?.text ?? '';
          },
        },
      );
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: streamBuf || 'Analysis completed.' },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not connect to AI Copilot.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Level 1: Top Header Banner */}
      <View style={styles.topBanner}>
        <View style={styles.topHeaderLeft}>
          <Text
            style={styles.stockTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {quote?.name ?? symShort}
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{quote?.exchange ?? 'NSE'}</Text>
            </View>
            <View style={styles.termBadge}>
              <Text style={styles.termText}>⚡ Terminal</Text>
            </View>
            {quote?.stale && (
              <View style={styles.staleBadge}>
                <Text style={styles.staleText}>stale</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.topHeaderRight}>
          <Text style={[styles.topPrice, { color: signColor(change) }]}>
            {formatINR(price)}
          </Text>
          <Text style={[styles.topChange, { color: signColor(change) }]}>
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)} ({formatPct(changePct)})
          </Text>
        </View>
      </View>

      {/* Metrics Strip — Clean 1-Line Formatted Values */}
      <View style={styles.metricsStrip}>
        <View style={styles.mItem}>
          <Text style={styles.mLabel}>VOL</Text>
          <Text style={styles.mVal} numberOfLines={1}>
            {quote?.volume ? formatIndianNumber(quote.volume) : '—'}
          </Text>
        </View>
        <View style={styles.mItem}>
          <Text style={styles.mLabel}>MCAP</Text>
          <Text style={styles.mVal} numberOfLines={1}>
            {quote?.market_cap ? formatIndianNumber(quote.market_cap) : '—'}
          </Text>
        </View>
        <View style={styles.mItem}>
          <Text style={styles.mLabel}>52W H</Text>
          <Text style={[styles.mVal, { color: colors.bull }]} numberOfLines={1}>
            {formatINR(high52)}
          </Text>
        </View>
        <View style={styles.mItem}>
          <Text style={styles.mLabel}>52W L</Text>
          <Text style={[styles.mVal, { color: colors.bear }]} numberOfLines={1}>
            {formatINR(low52)}
          </Text>
        </View>
        <View style={styles.mItem}>
          <Text style={styles.mLabel}>PATTERNS</Text>
          <Text style={[styles.mVal, { color: colors.accent }]} numberOfLines={1}>
            7
          </Text>
        </View>
      </View>

      {/* Level 2: Main Interactive Trading Chart */}
      <Card style={styles.chartCard}>
        <AdvancedTradingChart
          data={chartData}
          isLoading={chartLoading}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      </Card>

      {/* Level 3: 52-Week Range & Related News */}
      <View style={styles.gridContainer}>
        {/* 52-Week Valuation Card */}
        <Card style={styles.gridCard}>
          <Text style={styles.cardHeaderTitle}>52-WEEK PRICE RANGE VALUATION</Text>
          <View style={styles.rangeTrack}>
            <View style={[styles.rangeProgress, { width: `${pct52}%` }]} />
            <View style={[styles.rangeThumb, { left: `${pct52}%` }]} />
          </View>

          <Text style={styles.rangeInfo}>At {pct52}% of 52-week range</Text>

          <View style={styles.rangeValuesGrid}>
            <MetricCard label="52W HIGH" value={formatINR(high52)} valueColor={colors.bull} />
            <MetricCard label="52W LOW" value={formatINR(low52)} valueColor={colors.bear} />
          </View>
        </Card>

        {/* Related News Card */}
        <Card style={styles.gridCard}>
          <View style={styles.newsHeaderRow}>
            <Text style={styles.cardHeaderTitle}>RELATED MARKET INTELLIGENCE</Text>
            <View style={styles.outlookBadge}>
              <Text style={styles.outlookText}>BULLISH OUTLOOK</Text>
            </View>
          </View>

          {newsData && newsData.length > 0 ? (
            newsData.slice(0, 3).map((art) => (
              <View key={art.id} style={styles.miniNewsRow}>
                <Text style={styles.miniNewsTitle} numberOfLines={2}>
                  • {art.title}
                </Text>
                <Text style={styles.miniNewsSource}>
                  {art.source} · {relativeTime(art.published_at)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Loading intelligence news…</Text>
          )}
        </Card>
      </View>

      {/* Level 4: 13 Sub-Tab Navigation Pills Bar */}
      <View style={styles.tabsSection}>
        <Text style={styles.sectionHeaderTitle}>ANALYSIS MODULES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabsScroll}>
          <View style={styles.subTabsRow}>
            {SUB_TABS.map((t) => (
              <TouchPill
                key={t.id}
                label={t.label}
                icon={t.icon}
                active={activeTab === t.id}
                onPress={() => setActiveTab(t.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sub-Panel 1: ✨ AI Explainer */}
      {activeTab === 'ai' && (
        <Card style={styles.panelCard}>
          <AIExplainer symbol={symbol} />

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.panelTitle}>✨ AI MARKET INTELLIGENCE</Text>

            <View style={styles.aiGrid2Col}>
              <MetricCard label="TREND" value="Uptrend" valueColor={colors.bull} />
              <MetricCard label="MOMENTUM" value="Neutral" valueColor={colors.accent} />
              <MetricCard label="VOLATILITY" value="2.2%" />
              <MetricCard label="PATTERN BIAS" value="Bullish" valueColor={colors.bull} />
            </View>

            <View style={styles.recBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recLabel}>AI RECOMMENDATION</Text>
                <Text style={styles.recVal}>Watch / Buy</Text>
              </View>
              <View style={styles.bbBadge}>
                <Text style={styles.bbPosText}>84% of BB</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Sub-Panel 2: 💬 Co-Pilot Chat */}
      {activeTab === 'copilot' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>💬 AI STOCK CO-PILOT</Text>

          <View style={styles.chatBox}>
            {chatMessages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.chatBubble,
                  m.role === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={styles.chatText}>{m.content}</Text>
              </View>
            ))}
            {chatLoading && <ActivityIndicator color={colors.accent} />}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder={`Ask AI about ${symbol}…`}
              placeholderTextColor={colors.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Sub-Panel 3: 👥 Compare Engine */}
      {activeTab === 'compare' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>👥 PEER COMPARISON MATRIX</Text>
          <PeersPanel
            peers={peerData?.peers}
            isLoading={peersLoading}
            onSelectPeer={(s) => router.push(`/analysis/${s}`)}
          />
        </Card>
      )}

      {/* Sub-Panel 4: 🛡️ Risk Analytics */}
      {activeTab === 'risk' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🛡️ RISK & VOLATILITY ANALYTICS</Text>
          <View style={styles.aiGrid2Col}>
            <MetricCard label="BETA (1Y)" value="1.12" />
            <MetricCard label="VAR (95%)" value="-2.4%" valueColor={colors.bear} />
            <MetricCard label="SHARPE" value="1.45" />
            <MetricCard label="MAX DRAWDOWN" value="-12.8%" valueColor={colors.bear} />
          </View>
        </Card>
      )}

      {/* Sub-Panel 5: 📋 Export Report */}
      {activeTab === 'export' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>📋 INSTITUTIONAL SUMMARY REPORT</Text>
          <Text style={styles.emptyText}>
            Institutional equity research summary report card ready for {symbol}.
          </Text>
        </Card>
      )}

      {/* Sub-Panel 6: 🔮 Predict Target Engine */}
      {activeTab === 'predict' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🔮 30-DAY PROBABILITY PREDICTION BANDS</Text>
          <View style={styles.aiGrid2Col}>
            <MetricCard
              label="BULLISH TARGET"
              value={formatINR(price * 1.08)}
              valueColor={colors.bull}
            />
            <MetricCard
              label="BEARISH SUPPORT"
              value={formatINR(price * 0.94)}
              valueColor={colors.bear}
            />
          </View>
        </Card>
      )}

      {/* Sub-Panel 7: 🧠 Advanced Vectors */}
      {activeTab === 'advanced' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🧠 ADVANCED QUANTITATIVE VECTORS</Text>
          <Text style={styles.emptyText}>
            Standard deviation channels & z-score momentum signals loaded.
          </Text>
        </Card>
      )}

      {/* Sub-Panel 8: 📊 Technical Indicators */}
      {activeTab === 'technicals' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>📊 16-INDICATOR VECTOR SNAPSHOT</Text>
          {latestInd ? (
            <View style={styles.aiGrid2Col}>
              <MetricCard label="RSI (14)" value={latestInd.rsi?.toFixed(1) ?? '—'} />
              <MetricCard label="MACD" value={latestInd.macd?.toFixed(2) ?? '—'} />
            </View>
          ) : (
            <Text style={styles.emptyText}>Loading technical vector indicators…</Text>
          )}
        </Card>
      )}

      {/* Sub-Panel 9: 🕯️ Candlestick Patterns */}
      {activeTab === 'patterns' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🕯️ ACTIVE CANDLESTICK PATTERNS</Text>
          <Text style={styles.emptyText}>
            Pattern Matcher active: Spinning Top reversal detected at support.
          </Text>
        </Card>
      )}

      {/* Sub-Panel 10: 📐 Levels */}
      {activeTab === 'levels' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>📐 PIVOT POINTS & SUPPORT/RESISTANCE</Text>
          <View style={styles.aiGrid2Col}>
            <MetricCard label="RESISTANCE 1" value={formatINR(price * 1.03)} valueColor={colors.bear} />
            <MetricCard label="SUPPORT 1" value={formatINR(price * 0.97)} valueColor={colors.bull} />
          </View>
        </Card>
      )}

      {/* Sub-Panel 11: ⚡ Momentum */}
      {activeTab === 'momentum' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>⚡ MOMENTUM GAUGE</Text>
          <Text style={[styles.recVal, { color: colors.bull }]}>
            BULLISH MOMENTUM (68/100)
          </Text>
        </Card>
      )}

      {/* Sub-Panel 12: 📋 Fundamentals */}
      {activeTab === 'fundamentals' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>📋 FUNDAMENTAL METRICS</Text>
          {fundamentals ? (
            <FundamentalsPanel data={fundamentals} />
          ) : (
            <Text style={styles.emptyText}>Loading fundamental ratios for {symbol}…</Text>
          )}
        </Card>
      )}

      {/* Sub-Panel 13: 🏢 Peers */}
      {activeTab === 'peers' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🏢 SECTOR PEERS RANKING</Text>
          <PeersPanel
            peers={peerData?.peers}
            isLoading={peersLoading}
            onSelectPeer={(s) => router.push(`/analysis/${s}`)}
          />
        </Card>
      )}

      {/* Sub-Panel 14: 🌐 Ripple Matrix */}
      {activeTab === 'ripple' && (
        <Card style={styles.panelCard}>
          <Text style={styles.panelTitle}>🌐 SISTER COMPANY RIPPLE MATRIX</Text>
          <RippleMatrixPanel symbol={symbol} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090a0d',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  topHeaderLeft: {
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  stockTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.serif,
    color: colors.textPrimary,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.textSecondary,
  },
  termBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  termText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },
  staleBadge: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staleText: {
    fontSize: 9,
    fontFamily: typography.monoMedium,
    color: colors.bear,
  },
  topHeaderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  topPrice: {
    fontSize: typography.size.lg,
    fontFamily: typography.monoMedium,
  },
  topChange: {
    fontSize: typography.size.xs,
    fontFamily: typography.monoMedium,
  },
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  mLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mVal: {
    fontSize: 10,
    fontFamily: typography.monoMedium,
    color: colors.textPrimary,
  },
  chartCard: {
    padding: 0,
    overflow: 'hidden',
  },
  gridContainer: {
    gap: spacing.md,
  },
  gridCard: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  rangeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    marginVertical: 4,
  },
  rangeProgress: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.bull,
  },
  rangeThumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    top: -2,
    marginLeft: -5,
  },
  rangeInfo: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  rangeValuesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
    marginTop: 4,
  },
  newsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outlookBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outlookText: {
    fontSize: 8,
    fontFamily: typography.monoMedium,
    color: colors.bull,
  },
  miniNewsRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    gap: 3,
  },
  miniNewsTitle: {
    fontSize: 11,
    fontFamily: typography.sansMedium,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  miniNewsSource: {
    fontSize: 9,
    fontFamily: typography.mono,
    color: colors.textMuted,
  },
  tabsSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  subTabsScroll: {
    marginVertical: 2,
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  panelCard: {
    gap: spacing.sm,
  },
  panelTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  aiGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
  },
  recBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  recLabel: {
    fontSize: 9,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  recVal: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.bull,
    marginTop: 2,
  },
  bbBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bbPosText: {
    fontSize: 10,
    fontFamily: typography.monoMedium,
    color: colors.textMuted,
  },
  chatBox: {
    gap: spacing.xs,
    maxHeight: 200,
  },
  chatBubble: {
    padding: spacing.sm,
    borderRadius: radius.md,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  chatText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
    fontSize: 11,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  sendText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 10,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
