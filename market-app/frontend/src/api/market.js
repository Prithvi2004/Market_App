import { useQuery } from "@tanstack/react-query";

const j = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

export const useIndices = () =>
  useQuery({ queryKey: ["indices"], queryFn: () => j("/api/indices"), refetchInterval: 60_000 });

export const useGainers = (exchange = "NSE", n = 10) =>
  useQuery({ queryKey: ["gainers", exchange, n], queryFn: () => j(`/api/gainers?exchange=${exchange}&n=${n}`), refetchInterval: 60_000 });

export const useLosers = (exchange = "NSE", n = 10) =>
  useQuery({ queryKey: ["losers", exchange, n], queryFn: () => j(`/api/losers?exchange=${exchange}&n=${n}`), refetchInterval: 60_000 });

export const useQuote = (symbol) =>
  useQuery({ queryKey: ["quote", symbol], queryFn: () => j(`/api/quote?symbol=${encodeURIComponent(symbol)}`), enabled: !!symbol, refetchInterval: 60_000 });

export const useChart = (symbol, range) =>
  useQuery({ queryKey: ["chart", symbol, range], queryFn: () => j(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`), enabled: !!symbol });

export const useSectors = () =>
  useQuery({ queryKey: ["sectors"], queryFn: () => j("/api/sectors"), refetchInterval: 60_000 });

export const useStatus = () =>
  useQuery({ queryKey: ["status"], queryFn: () => j("/api/status"), refetchInterval: 30_000 });

export const searchSymbols = (q) => j(`/api/search?q=${encodeURIComponent(q)}`);
