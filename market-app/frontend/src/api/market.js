import { useQuery } from "@tanstack/react-query";

const j = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ─── Indices ──────────────────────────────────────────────────────────────────
export const useIndices = () =>
  useQuery({
    queryKey: ["indices"],
    queryFn: () => j("/api/indices"),
    refetchInterval: 60_000,
  });

// ─── Movers ───────────────────────────────────────────────────────────────────
export const useGainers = (exchange = "NSE", n = 10) =>
  useQuery({
    queryKey: ["gainers", exchange, n],
    queryFn: () => j(`/api/gainers?exchange=${exchange}&n=${n}`),
    refetchInterval: 60_000,
  });

export const useLosers = (exchange = "NSE", n = 10) =>
  useQuery({
    queryKey: ["losers", exchange, n],
    queryFn: () => j(`/api/losers?exchange=${exchange}&n=${n}`),
    refetchInterval: 60_000,
  });

// ─── Quote & chart ────────────────────────────────────────────────────────────
export const useQuote = (symbol) =>
  useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => j(`/api/quote?symbol=${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    refetchInterval: 60_000,
  });

export const useChart = (symbol, range) =>
  useQuery({
    queryKey: ["chart", symbol, range],
    queryFn: () =>
      j(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`),
    enabled: !!symbol,
  });

// ─── Sectors ──────────────────────────────────────────────────────────────────
export const useSectors = () =>
  useQuery({
    queryKey: ["sectors"],
    queryFn: () => j("/api/sectors"),
    refetchInterval: 60_000,
  });

// ─── Market status ────────────────────────────────────────────────────────────
export const useStatus = () =>
  useQuery({
    queryKey: ["status"],
    queryFn: () => j("/api/status"),
    refetchInterval: 30_000,
  });

// ─── Symbol search ────────────────────────────────────────────────────────────
export const useSymbols = () =>
  useQuery({
    queryKey: ["symbols"],
    queryFn: () => j("/api/symbols"),
    staleTime: Infinity,
  });

export const searchSymbols = (q) =>
  j(`/api/search?q=${encodeURIComponent(q)}`);

// ─── Portfolio valuation ──────────────────────────────────────────────────────
export const portfolioValue = (holdings) =>
  fetch("/api/portfolio/value", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(holdings),
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ─── News category counts ─────────────────────────────────────────────────────
export const useCategoryCount = () =>
  useQuery({
    queryKey: ["news:cat_count"],
    queryFn: () => j("/api/news/categories/count"),
    refetchInterval: 5 * 60_000,
  });
