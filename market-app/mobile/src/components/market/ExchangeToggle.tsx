/**
 * ExchangeToggle — NSE / BSE toggle pill.
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

interface ExchangeToggleProps {
  value: 'NSE' | 'BSE';
  onChange: (v: 'NSE' | 'BSE') => void;
}

export function ExchangeToggle({ value, onChange }: ExchangeToggleProps) {
  return (
    <View style={styles.container}>
      {(['NSE', 'BSE'] as const).map((ex) => (
        <TouchableOpacity
          key={ex}
          activeOpacity={0.8}
          onPress={() => onChange(ex)}
          style={[styles.btn, value === ex && styles.btnActive]}
        >
          <Text style={[styles.label, value === ex && styles.labelActive]}>{ex}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  btnActive: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
  },
});
