/**
 * Card — the fundamental glass-card surface.
 * Replicates the web app's glass-card CSS class as a React Native component.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  accentColor?: string;
  accentSide?: 'left' | 'top' | 'bottom';
}

export function Card({ children, style, accentColor, accentSide = 'left' }: CardProps) {
  const accentStyle: ViewStyle = accentColor
    ? accentSide === 'left'
      ? { borderLeftWidth: 3, borderLeftColor: accentColor }
      : accentSide === 'top'
      ? { borderTopWidth: 3, borderTopColor: accentColor }
      : { borderBottomWidth: 3, borderBottomColor: accentColor }
    : {};

  return (
    <View style={[styles.card, accentStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
});
