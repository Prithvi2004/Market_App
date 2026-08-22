/**
 * Market data API hooks using TanStack Query.
 * Mirrors the web app's frontend/src/api/market.js.
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiPost } from './client';
import type {
  Index,
  Mover,
  Quote,
  OHLCVBar,
  Sector,
  Fundamentals,
  Indicator,
  SearchHit,
  MarketStatus,
  ScreenerAlert,
} from '../types/market';
import type { PortfolioRiskResult } from '../types/portfolio';

// ── Market Status ──────────────────────────────────────────────────────────────
export function useMarketStatus() {
  return useQuery<MarketStatus>({
    queryKey: ['status'],
    queryFn: () => apiFetch('/api/status'),
    refetchInterval: 30_000,
  });
}

// ── Indices ────────────────────────────────────────────────────────────────────
export function useIndices() {
  return useQuery<Index[]>({
    queryKey: ['indices'],
    queryFn: () => apiFetch('/api/indices'),
    refetchInterval: 60_000,
  });
}

// ── Movers ─────────────────────────────────────────────────────────────────────
export function useGainers(exchange = 'NSE', n = 10) {
  return useQuery<Mover[]>({
    queryKey: ['gainers', exchange, n],
    queryFn: () => apiFetch(`/api/gainers?exchange=${exchange}&n=${n}`),
    refetchInterval: 60_000,
  });
}

export function useLosers(exchange = 'NSE', n = 10) {
  return useQuery<Mover[]>({
    queryKey: ['losers', exchange, n],
    queryFn: () => apiFetch(`/api/losers?exchange=${exchange}&n=${n}`),
    refetchInterval: 60_000,
  });
}

// ── Quote ──────────────────────────────────────────────────────────────────────
export function useQuote(symbol: string | null) {
  return useQuery<Quote>({
    queryKey: ['quote', symbol],
    queryFn: () => apiFetch(`/api/quote?symbol=${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    refetchInterval: 60_000,
  });
}

// ── Chart ──────────────────────────────────────────────────────────────────────
export function useChart(symbol: string | null, range: string = '1D') {
  return useQuery<OHLCVBar[]>({
    queryKey: ['chart', symbol, range],
    queryFn: () =>
      apiFetch(`/api/chart?symbol=${encodeURIComponent(symbol!)}&range=${range}`),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}

// ── Sectors ────────────────────────────────────────────────────────────────────
export function useSectors() {
  return useQuery<Sector[]>({
    queryKey: ['sectors'],
    queryFn: () => apiFetch('/api/sectors'),
    refetchInterval: 60_000,
  });
}

// ── Symbols ────────────────────────────────────────────────────────────────────
export function useSymbols() {
  return useQuery<SearchHit[]>({
    queryKey: ['symbols'],
    queryFn: () => apiFetch('/api/symbols'),
    staleTime: Infinity,
  });
}

// ── Search (one-shot, not a hook) ──────────────────────────────────────────────
export async function searchSymbols(q: string): Promise<SearchHit[]> {
  return apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
}

// ── Fundamentals ───────────────────────────────────────────────────────────────
export function useFundamentals(symbol: string | null) {
  return useQuery<Fundamentals>({
    queryKey: ['fundamentals', symbol],
    queryFn: () => apiFetch(`/api/fundamentals/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

// ── Peers ──────────────────────────────────────────────────────────────────────
export function usePeers(symbol: string | null) {
  return useQuery<Mover[]>({
    queryKey: ['peers', symbol],
    queryFn: () => apiFetch(`/api/peers/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}

// ── Indicators ─────────────────────────────────────────────────────────────────
export function useIndicators(symbol: string | null, range = '3M') {
  return useQuery<Indicator[]>({
    queryKey: ['indicators', symbol, range],
    queryFn: () =>
      apiFetch(`/api/indicators/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── Category Counts ────────────────────────────────────────────────────────────
export function useCategoryCount() {
  return useQuery<Record<string, number>>({
    queryKey: ['news:cat_count'],
    queryFn: () => apiFetch('/api/news/categories/count'),
    refetchInterval: 5 * 60_000,
  });
}

// ── Screener ───────────────────────────────────────────────────────────────────
export function useScreenerAlerts() {
  return useQuery<ScreenerAlert[]>({
    queryKey: ['screener:alerts'],
    queryFn: () => apiFetch('/api/screener'),
    refetchInterval: 15 * 60_000,
    staleTime: 5 * 60_000,
  });
}

// ── Portfolio valuation (one-shot POST) ────────────────────────────────────────
export async function portfolioValue(
  holdings: { symbol: string; qty: number; buy_price: number }[],
) {
  return apiPost('/api/portfolio/value', holdings);
}

// ── Portfolio risk (one-shot POST) ─────────────────────────────────────────────
export async function portfolioRisk(
  holdings: { symbol: string; quantity: number; price: number }[],
  period = '1y',
): Promise<PortfolioRiskResult> {
  return apiPost('/api/portfolio/risk', { holdings, period });
}
