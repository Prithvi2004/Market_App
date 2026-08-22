/**
 * NewsCard — article card for the news feed.
 * Mobile equivalent of the web app's article grid item.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { relativeTime, shortSymbol } from '../../utils/formatters';
import { SENTIMENT_CONFIG } from '../../utils/constants';
import type { NewsArticle } from '../../types/news';

interface NewsCardProps {
  article: NewsArticle;
  onTickerPress?: (symbol: string) => void;
  onImpactPress?: (article: NewsArticle) => void;
}

export function NewsCard({ article: a, onTickerPress, onImpactPress }: NewsCardProps) {
  const sent = SENTIMENT_CONFIG[a.sentiment_label as keyof typeof SENTIMENT_CONFIG] ?? SENTIMENT_CONFIG.neutral;

  return (
    <Card style={styles.card} accentColor={sent.borderColor} accentSide="left">
      <View style={styles.inner}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={[styles.sentDot, { backgroundColor: sent.dotColor, shadowColor: sent.dotColor }]} />
          <TouchableOpacity
            style={styles.titleWrapper}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(a.url)}
          >
            <Text style={styles.title} numberOfLines={2}>{a.title}</Text>
          </TouchableOpacity>
          <View style={[styles.sentBadge, { backgroundColor: sent.bgColor, borderColor: sent.borderColor }]}>
            <Text style={[styles.sentLabel, { color: sent.color }]}>{sent.label}</Text>
          </View>
        </View>

        {/* Summary */}
        {a.summary ? (
          <Text style={styles.summary} numberOfLines={2}>{a.summary}</Text>
        ) : null}

        {/* Meta row */}
        <View style={styles.meta}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceInitial}>{(a.source || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.source}>{a.source}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{relativeTime(a.published_at)}</Text>
          {a.category ? (
            <>
              <Text style={styles.dot}>·</Text>
              <View style={styles.catBadge}>
                <Text style={styles.catLabel}>{a.category}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Tickers + impact */}
        {a.tickers && a.tickers.length > 0 ? (
          <View style={styles.tickerRow}>
            {a.tickers.slice(0, 5).map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                onPress={() => onTickerPress?.(t)}
                style={styles.ticker}
              >
                <Text style={styles.tickerText}>{shortSymbol(t)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onImpactPress?.(a)}
              style={styles.impactBtn}
            >
              <Text style={styles.impactText}>⚡ Impact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.impactRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onImpactPress?.(a)}
              style={styles.impactBtn}
            >
              <Text style={styles.impactText}>⚡ Impact</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  inner: {
    padding: spacing.md,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.md,
    fontFamily: typography.sansSemiBold,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sentBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 1,
  },
  sentLabel: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.sansBold,
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    lineHeight: 15,
    paddingLeft: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 16,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInitial: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  source: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  dot: {
    color: colors.textDim,
    fontSize: typography.size.xs,
  },
  time: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  catBadge: {
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: 'rgba(212,150,58,0.12)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  catLabel: {
    fontSize: 8,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingLeft: 16,
    alignItems: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  ticker: {
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: 'rgba(212,150,58,0.18)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tickerText: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.accent,
  },
  impactBtn: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  impactText: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.monoMedium,
    color: '#f59e0b',
  },
});
