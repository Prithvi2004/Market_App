/**
 * AI Impact Analyzer Screen (Modal) — streams AI news impact analysis.
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { streamImpact } from '../src/api/llm';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const headline = useAppStore((s) => s.impactHeadline);
  const summary = useAppStore((s) => s.impactSummary);
  const impactText = useAppStore((s) => s.impactText);
  const loading = useAppStore((s) => s.impactLoading);

  const setHeadline = useAppStore((s) => s.setImpactHeadline);
  const setSummary = useAppStore((s) => s.setImpactSummary);
  const setImpactText = useAppStore((s) => s.setImpactText);
  const appendImpactText = useAppStore((s) => s.appendImpactText);
  const setLoading = useAppStore((s) => s.setImpactLoading);
  const resetImpact = useAppStore((s) => s.resetImpact);

  const abortRef = useRef<AbortController | null>(null);

  async function handleAnalyze() {
    if (!headline.trim()) return;
    if (loading) {
      abortRef.current?.abort();
      setLoading(false);
      return;
    }

    setImpactText('');
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamImpact(
        { headline: headline.trim(), summary: summary.trim() },
        {
          token: (d: any) => appendImpactText(d?.text ?? ''),
        },
        controller.signal,
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        appendImpactText('\n\n[Error: Could not perform impact analysis]');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '⚡ AI News Impact' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Headline Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>News Headline</Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            placeholder="e.g., RBI keeps repo rate unchanged at 6.5%"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
          />
        </View>

        {/* Context Summary Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Context (Optional)</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Paste article summary or extra details…"
            placeholderTextColor={colors.textDim}
            style={[styles.input, styles.textArea]}
            multiline
          />
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAnalyze}
            style={[styles.analyzeBtn, loading && styles.analyzeBtnStop]}
          >
            {loading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
            <Text style={styles.analyzeBtnText}>
              {loading ? ' Stop Analysis' : '⚡ Stream Impact Analysis'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={resetImpact} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Output */}
        {impactText ? (
          <View style={styles.outputBox}>
            <Text style={styles.outputTitle}>Analysis Result</Text>
            <Text style={styles.outputText}>{impactText}</Text>
          </View>
        ) : !loading ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Enter a financial headline above and tap Stream Impact Analysis to see how the market and specific stocks might react.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </>
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
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  analyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  analyzeBtnStop: {
    backgroundColor: colors.bear,
  },
  analyzeBtnText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  outputBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  outputTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outputText: {
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  hintBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
