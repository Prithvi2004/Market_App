/**
 * MetricCard — Standardized 2-column financial metric card primitive.
 * Enforces tabular monospace numbers, crisp gold borders, and optional contextual labels.
 */
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface MetricCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  context?: string;
  contextColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricCard({
  label,
  value,
  valueColor = colors.textPrimary,
  context,
  contextColor = colors.textMuted,
  style,
}: MetricCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      {context ? (
        <Text style={[styles.context, { color: contextColor }]} numberOfLines={1}>
          {context}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontFamily: typography.monoMedium,
  },
  context: {
    fontSize: 9,
    fontFamily: typography.sans,
  },
});
