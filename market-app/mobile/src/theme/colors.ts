/**
 * MarketPulse brand color palette — dark "ink" theme with amber/gold accents.
 * Faithfully ported from the web app's Tailwind config.
 */

export const colors = {
  // Backgrounds
  ink: '#0b0b09',
  surface: '#0e0f14',
  card: 'rgba(255,255,255,0.025)',
  cardBorder: 'rgba(212,150,58,0.12)',
  cardBorderHover: 'rgba(212,150,58,0.22)',

  // Accent — amber/gold
  accent: '#d4963a',
  accentLight: '#f0c56a',
  accentBg: 'rgba(212,150,58,0.10)',
  accentBorder: 'rgba(212,150,58,0.25)',
  accentSubtle: 'rgba(212,150,58,0.06)',

  // Market colors
  bull: '#10b981',
  bullBg: 'rgba(16,185,129,0.12)',
  bullBorder: 'rgba(16,185,129,0.25)',
  bear: '#f43f5e',
  bearBg: 'rgba(244,63,94,0.12)',
  bearBorder: 'rgba(244,63,94,0.25)',

  // Text
  textPrimary: '#ede8df',
  textSecondary: '#b8af9e',
  textMuted: '#7a7060',
  textDim: '#4a4540',

  // Borders
  borderSubtle: 'rgba(212,150,58,0.07)',
  borderDim: 'rgba(212,150,58,0.05)',

  // Sentiment
  positive: '#10b981',
  negative: '#f43f5e',
  neutral: '#64748b',

  // UI chrome
  white: '#ffffff',
  black: '#000000',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
