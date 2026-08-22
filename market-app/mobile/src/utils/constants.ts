// ── Constants ─────────────────────────────────────────────────────────────────

export const SECTORS = [
  'IT',
  'Banking',
  'Pharma',
  'Auto',
  'Energy',
  'FMCG',
  'Metals',
  'Financial',
  'Telecom',
  'Infrastructure',
  'Cement',
  'Insurance',
  'Healthcare',
  'Consumer',
  'Conglomerate',
  'Chemicals',
] as const;

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'national', label: '🇮🇳 National' },
  { id: 'international', label: '🌐 Global' },
  { id: 'sector', label: '📊 Sector' },
] as const;

export const EXCHANGE_OPTIONS = ['NSE', 'BSE'] as const;

export const CHART_RANGE_OPTIONS = ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y'] as const;
export type ChartRange = typeof CHART_RANGE_OPTIONS[number];

export const SENTIMENT_CONFIG = {
  positive: { label: 'BULL', color: '#10b981', dotColor: '#10b981', bgColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.25)' },
  negative: { label: 'BEAR', color: '#f43f5e', dotColor: '#f43f5e', bgColor: 'rgba(244,63,94,0.10)', borderColor: 'rgba(244,63,94,0.25)' },
  neutral:  { label: 'NEU',  color: '#64748b', dotColor: '#64748b', bgColor: 'rgba(100,116,139,0.10)', borderColor: 'rgba(100,116,139,0.18)' },
} as const;

export const CONFIDENCE_COLORS = {
  high:   { bg: 'rgba(16,185,129,0.12)',   text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.12)',   text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  low:    { bg: 'rgba(244,63,94,0.12)',    text: '#f43f5e', border: 'rgba(244,63,94,0.25)' },
} as const;

export const SIGNAL_DIRECTION_COLORS = {
  bullish: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
  bearish: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.25)' },
  neutral: { color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.18)' },
} as const;
