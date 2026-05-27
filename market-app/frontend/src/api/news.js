import { useQuery } from "@tanstack/react-query";

const j = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

export const useLatestNews = (limit = 30) =>
  useQuery({ queryKey: ["news:latest", limit], queryFn: () => j(`/api/news/latest?limit=${limit}`), refetchInterval: 5 * 60_000 });

export const useTickerNews = (ticker, limit = 10) =>
  useQuery({
    queryKey: ["news:ticker", ticker, limit],
    queryFn: () => j(`/api/news?ticker=${encodeURIComponent(ticker)}&limit=${limit}`),
    enabled: !!ticker,
    refetchInterval: 5 * 60_000,
  });

export const useNewsByCategory = (category, limit = 30) =>
  useQuery({
    queryKey: ["news:cat", category, limit],
    queryFn: () => {
      if (!category || category === "all") return j(`/api/news/latest?limit=${limit}`);
      return j(`/api/news?category=${category}&limit=${limit}`);
    },
    refetchInterval: 5 * 60_000,
  });
