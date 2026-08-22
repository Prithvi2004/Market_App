/**
 * AIExplainer — streams AI price explanation for a stock.
 * Faithfully ported from the web app's AIExplainer component.
 */
import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { streamExplain } from '../../api/llm';
import { useAppStore } from '../../store/useAppStore';
import { CONFIDENCE_COLORS } from '../../utils/constants';
import { relativeTime } from '../../utils/formatters';

interface AIExplainerProps {
  symbol: string;
}

export function AIExplainer({ symbol }: AIExplainerProps) {
  const explainText = useAppStore((s) => s.explainText);
  const explainLoading = useAppStore((s) => s.explainLoading);
  const explainSources = useAppStore((s) => s.explainSources);
  const explainConfidence = useAppStore((s) => s.explainConfidence);
  const setExplainText = useAppStore((s) => s.setExplainText);
  const appendExplainText = useAppStore((s) => s.appendExplainText);
  const setExplainLoading = useAppStore((s) => s.setExplainLoading);
  const setExplainSources = useAppStore((s) => s.setExplainSources);
  const setExplainConfidence = useAppStore((s) => s.setExplainConfidence);
  const resetExplain = useAppStore((s) => s.resetExplain);

  const abortRef = useRef<AbortController | null>(null);

  const handleExplain = useCallback(async () => {
    if (explainLoading) {
      abortRef.current?.abort();
      setExplainLoading(false);
      return;
    }
    resetExplain();
    setExplainLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamExplain(
        { symbol, timeframe: '1D', include_news: true },
        {
          meta: (d: any) => setExplainSources(d?.sources ?? []),
          token: (d: any) => appendExplainText(d?.text ?? ''),
          done: (d: any) => {
            if (d?.confidence) setExplainConfidence(d.confidence);
          },
        },
        controller.signal,
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        appendExplainText('\n\n[Error: Could not load AI explanation]');
      }
    } finally {
      setExplainLoading(false);
    }
  }, [symbol, explainLoading]);

  const confColors = explainConfidence
    ? CONFIDENCE_COLORS[explainConfidence as keyof typeof CONFIDENCE_COLORS]
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ AI Price Explanation</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleExplain}
          style={[styles.btn, explainLoading && styles.btnStop]}
        >
          {explainLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : null}
          <Text style={[styles.btnText, explainLoading && styles.btnTextStop]}>
            {explainLoading ? ' Stop' : explainText ? 'Regenerate' : 'Explain'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confidence badge */}
      {confColors && explainConfidence && (
        <View style={[styles.confBadge, { backgroundColor: confColors.bg, borderColor: confColors.border }]}>
          <Text style={[styles.confText, { color: confColors.text }]}>
            Confidence: {explainConfidence.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Text output */}
      {explainText ? (
        <View style={styles.textBox}>
          <ScrollView nestedScrollEnabled>
            <Text style={styles.narrative}>{explainText}</Text>
          </ScrollView>
        </View>
      ) : !explainLoading ? (
        <Text style={styles.hint}>
          Tap Explain to generate an AI-powered narrative about {symbol}'s recent price movement.
        </Text>
      ) : null}

      {/* Sources */}
      {explainSources.length > 0 && (
        <View style={styles.sources}>
          <Text style={styles.sourcesTitle}>Sources</Text>
          {explainSources.map((s, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(s.url)}
              style={styles.sourceRow}
            >
              <Text style={styles.sourceTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={styles.sourceMeta}>{s.source} · {relativeTime(s.published_at)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  btnStop: {
    backgroundColor: 'rgba(244,63,94,0.10)',
    borderColor: 'rgba(244,63,94,0.25)',
  },
  btnText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  btnTextStop: {
    color: colors.bear,
  },
  confBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  confText: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textBox: {
    maxHeight: 240,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  narrative: {
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  hint: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  sources: {
    gap: 6,
  },
  sourcesTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceRow: {
    paddingVertical: 5,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentBorder,
    paddingLeft: 8,
    gap: 2,
  },
  sourceTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansMedium,
    color: colors.textSecondary,
  },
  sourceMeta: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
