/**
 * News API hooks using TanStack Query.
 * Mirrors the web app's frontend/src/api/news.js.
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { NewsArticle, CategoryCount, SentimentSummary } from '../types/news';

export function useLatestNews(limit = 30) {
  return useQuery<NewsArticle[]>({
    queryKey: ['news:latest', limit],
    queryFn: () => apiFetch(`/api/news/latest?limit=${limit}`),
    refetchInterval: 5 * 60_000,
  });
}

export function useTickerNews(ticker: string | null, limit = 10) {
  return useQuery<NewsArticle[]>({
    queryKey: ['news:ticker', ticker, limit],
    queryFn: () =>
      apiFetch(`/api/news?ticker=${encodeURIComponent(ticker!)}&limit=${limit}`),
    enabled: !!ticker,
    refetchInterval: 5 * 60_000,
  });
}

export function useNewsByCategory(
  category: string,
  limit = 30,
  sector: string | null = null,
) {
  return useQuery<NewsArticle[]>({
    queryKey: ['news:cat', category, sector, limit],
    queryFn: () => {
      if (!category || category === 'all')
        return apiFetch(`/api/news/latest?limit=${limit}`);
      if (category === 'sector' && sector) {
        return apiFetch(
          `/api/news?category=sector&sector=${encodeURIComponent(sector)}&limit=${limit}`,
        );
      }
      return apiFetch(`/api/news?category=${category}&limit=${limit}`);
    },
    refetchInterval: 5 * 60_000,
  });
}

export function useCategoryCount() {
  return useQuery<CategoryCount>({
    queryKey: ['news:cat_count'],
    queryFn: () => apiFetch('/api/news/categories/count'),
    refetchInterval: 5 * 60_000,
  });
}

export function useSentimentSummary() {
  return useQuery<SentimentSummary>({
    queryKey: ['sentiment'],
    queryFn: () => apiFetch('/api/sentiment'),
    refetchInterval: 5 * 60_000,
  });
}
