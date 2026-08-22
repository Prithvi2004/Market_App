import { StyleSheet } from 'react-native';

export const typography = {
  // Font families
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
  serif: 'DMSerifDisplay_400Regular',

  // Sizes
  size: {
    '2xs': 9,
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 14,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 24,
    '5xl': 28,
  },

  // Line heights
  leading: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export type FontFamily = keyof Pick<
  typeof typography,
  'sans' | 'sansMedium' | 'sansSemiBold' | 'sansBold' | 'mono' | 'monoMedium' | 'serif'
>;
