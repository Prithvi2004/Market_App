/**
 * CategoryFilter — horizontal scrollable news category pill filter.
 */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { NEWS_CATEGORIES } from '../../utils/constants';

interface CategoryFilterProps {
  active: string;
  counts?: Record<string, number>;
  onChange: (id: string) => void;
  onImpactPress?: () => void;
}

export function CategoryFilter({ active, counts, onChange, onImpactPress }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {NEWS_CATEGORIES.map((c) => (
        <TouchableOpacity
          key={c.id}
          activeOpacity={0.8}
          onPress={() => onChange(c.id)}
          style={[styles.pill, active === c.id && styles.pillActive]}
        >
          <Text style={[styles.label, active === c.id && styles.labelActive]}>
            {c.label}
          </Text>
          {counts && counts[c.id] != null ? (
            <Text style={[styles.count, active === c.id && styles.countActive]}>
              {counts[c.id]}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}

      {onImpactPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onImpactPress}
          style={[styles.pill, styles.impactPill]}
        >
          <Text style={styles.impactLabel}>⚡ AI Impact</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accentBorder,
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansSemiBold,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
  },
  count: {
    fontSize: typography.size['2xs'],
    fontFamily: typography.mono,
    color: colors.textDim,
  },
  countActive: {
    color: colors.accentLight,
    opacity: 0.7,
  },
  impactPill: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderColor: 'rgba(245,158,11,0.18)',
  },
  impactLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansSemiBold,
    color: colors.accent,
  },
});
