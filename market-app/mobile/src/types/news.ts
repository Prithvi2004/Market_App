// ── TypeScript types for news data ────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string; // ISO string
  category: 'national' | 'international' | 'sector' | string;
  tickers: string[];
  sentiment: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
}

export type NewsCategory = 'all' | 'national' | 'international' | 'sector';

export interface CategoryCount {
  all: number;
  national: number;
  international: number;
  sector: number;
  [key: string]: number;
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}
