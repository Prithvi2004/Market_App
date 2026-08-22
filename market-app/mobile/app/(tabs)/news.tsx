/**
 * News Tab — categorized news feed with sentiment, AI impact trigger.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNewsByCategory, useCategoryCount, useSentimentSummary } from '../../src/api/news';
import { useAppStore } from '../../src/store/useAppStore';
import { NewsCard } from '../../src/components/news/NewsCard';
import { CategoryFilter } from '../../src/components/news/CategoryFilter';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import type { NewsArticle } from '../../src/types/news';

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const newsFilter = useAppStore((s) => s.newsFilter);
  const setNewsFilter = useAppStore((s) => s.setNewsFilter);
  const sectorFilter = useAppStore((s) => s.sectorFilter);
  const setImpactOpen = useAppStore((s) => s.setImpactOpen);
  const setImpactHeadline = useAppStore((s) => s.setImpactHeadline);
  const setImpactSummary = useAppStore((s) => s.setImpactSummary);

  const sectorParam = newsFilter === 'sector' ? sectorFilter : null;
  const { data, isLoading, refetch } = useNewsByCategory(newsFilter, 60, sectorParam);
  const { data: counts } = useCategoryCount();
  const { data: sentiment } = useSentimentSummary();

  function handleImpact(article: NewsArticle) {
    setImpactHeadline(article.title);
    setImpactSummary(article.summary ?? '');
    setImpactOpen(true);
    router.push('/impact');
  }

  function handleTicker(symbol: string) {
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  }

  // Sentiment bar data
  const total = sentiment?.total ?? 1;
  const posPct = ((sentiment?.positive ?? 0) / total) * 100;
  const negPct = ((sentiment?.negative ?? 0) / total) * 100;
  const neuPct = ((sentiment?.neutral ?? 0) / total) * 100;

  return (
    <View style={styles.container}>
      {/* Sentiment bar header */}
      {sentiment && sentiment.total > 0 && (
        <View style={styles.sentimentBanner}>
          <View style={styles.sentBar}>
            <View style={[styles.sentFill, { width: `${posPct}%`, backgroundColor: colors.bull }]} />
            <View style={[styles.sentFill, { width: `${neuPct}%`, backgroundColor: colors.neutral }]} />
            <View style={[styles.sentFill, { width: `${negPct}%`, backgroundColor: colors.bear }]} />
          </View>
          <View style={styles.sentLabels}>
            <Text style={[styles.sentLabel, { color: colors.bull }]}>
              {sentiment.positive} bullish
            </Text>
            <Text style={[styles.sentLabel, { color: colors.neutral }]}>
              {sentiment.neutral} neutral
            </Text>
            <Text style={[styles.sentLabel, { color: colors.bear }]}>
              {sentiment.negative} bearish
            </Text>
          </View>
        </View>
      )}

      {/* Category filter */}
      <View style={styles.filterRow}>
        <CategoryFilter
          active={newsFilter}
          counts={counts}
          onChange={(id) => setNewsFilter(id)}
          onImpactPress={() => router.push('/impact')}
        />
      </View>

      {/* Article list */}
      {isLoading && !data ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton height={14} style={{ marginBottom: 8 }} />
              <Skeleton height={12} width="80%" style={{ marginBottom: 6 }} />
              <Skeleton height={10} width="40%" />
            </View>
          ))}
        </View>
      ) : !data?.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={styles.emptyTitle}>No articles yet</Text>
          <Text style={styles.emptyBody}>First pull runs at startup — check back in a moment.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <NewsCard
              article={item}
              onTickerPress={handleTicker}
              onImpactPress={handleImpact}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
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
  sentimentBanner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sentBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    gap: 1,
  },
  sentFill: {
    height: '100%',
  },
  sentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sentLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sansSemiBold,
  },
  filterRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  list: {
    padding: spacing.lg,
  },
  skeletons: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.sansSemiBold,
    color: colors.textSecondary,
  },
  emptyBody: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
