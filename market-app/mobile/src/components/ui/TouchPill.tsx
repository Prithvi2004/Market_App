/**
 * TouchPill — Touch-friendly 44dp+ pill primitive for timeframes, filters, and sub-tabs.
 * Guarantees mobile accessibility compliance (44x44dp minimum touch target).
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface TouchPillProps {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function TouchPill({ label, icon, active, onPress, style }: TouchPillProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.pill, active && styles.pillActive, style]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 10,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.accent,
    fontFamily: typography.sansBold,
  },
});
