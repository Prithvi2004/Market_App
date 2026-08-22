import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  style?: ViewStyle;
  size?: 'xs' | 'sm';
}

export function Badge({
  label,
  color = colors.accent,
  bgColor = colors.accentBg,
  borderColor = colors.accentBorder,
  style,
  size = 'sm',
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
        },
        size === 'xs' && styles.xs,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color },
          size === 'xs' && styles.labelXs,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  xs: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelXs: {
    fontSize: typography.size['2xs'],
  },
});
