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

// ─── Terminal-specific chart hook (separate cache key from StockDetail) ────────
// StockDetail uses useChart(symbol, "1D") → queryKey: ["chart", symbol, "1D"]
// AnalysisTerminal uses useTerminalChart → queryKey: ["terminal:chart", symbol, range]
// This prevents the terminal from interfering with the side-panel's cached data.
export const useTerminalChart = (symbol, range) =>
  useQuery({
    queryKey: ["terminal:chart", symbol, range],
    queryFn: () =>
      j(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`),
    enabled: !!symbol,
    staleTime: 5 * 60_000, // 5 min — chart data doesn't change rapidly
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

// ─── Fundamentals ─────────────────────────────────────────────────────────────
export const useFundamentals = (symbol) =>
  useQuery({
    queryKey: ["fundamentals", symbol],
    queryFn: () => j(`/api/fundamentals/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 30 * 60_000, // 30 min — fundamental data is slow-moving
    retry: 1,
  });

// ─── Peers ────────────────────────────────────────────────────────────────────
export const usePeers = (symbol) =>
  useQuery({
    queryKey: ["peers", symbol],
    queryFn: () => j(`/api/peers/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
