import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Main app store (non-persisted) ──────────────────────────────────────────
const useAppStore = create((set, get) => ({
  // Stock selection
  selectedSymbol: null,
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),

  // News filter
  newsFilter: "all",
  setNewsFilter: (f) => set({ newsFilter: f }),

  // Sector filter
  sectorFilter: null,
  setSectorFilter: (s) => set({ sectorFilter: s }),

  // Exchange toggle
  exchange: "NSE",
  setExchange: (e) => set({ exchange: e }),

  // Market status
  marketStatus: "closed",
  setMarketStatus: (s) => set({ marketStatus: s }),

  // Live prices (from WebSocket)
  livePrices: { indices: [], gainers: [], losers: [] },
  setLivePrices: (p) => set({ livePrices: p }),

  // ── AI Explainer ─────────────────────────────────────────────
  explainText: "",
  explainLoading: false,
  explainSources: [],
  explainConfidence: null,
  setExplainText: (t) => set({ explainText: t }),
  appendExplainText: (t) => set((s) => ({ explainText: s.explainText + t })),
  setExplainLoading: (b) => set({ explainLoading: b }),
  setExplainSources: (s) => set({ explainSources: s }),
  setExplainConfidence: (c) => set({ explainConfidence: c }),
  resetExplain: () =>
    set({ explainText: "", explainSources: [], explainConfidence: null }),

  // ── Impact Analyzer ──────────────────────────────────────────
  impactOpen: false,
  impactText: "",
  impactLoading: false,
  impactHeadline: "",
  impactSummary: "",
  setImpactOpen: (b) => set({ impactOpen: b }),
  setImpactText: (t) => set({ impactText: t }),
  appendImpactText: (t) => set((s) => ({ impactText: s.impactText + t })),
  setImpactLoading: (b) => set({ impactLoading: b }),
  setImpactHeadline: (h) => set({ impactHeadline: h }),
  setImpactSummary: (s) => set({ impactSummary: s }),
  resetImpact: () =>
    set({ impactText: "", impactHeadline: "", impactSummary: "" }),

  // ── Analysis Terminal ─────────────────────────────────────────
  analysisOpen: false,
  setAnalysisOpen: (b) => set({ analysisOpen: b }),
  analysisSymbol: null,
  setAnalysisSymbol: (s) => set({ analysisSymbol: s }),
  analysisStandalone: false,
  setAnalysisStandalone: (b) => set({ analysisStandalone: b }),

  // ── Portfolio overlay ─────────────────────────────────────────
  portfolioOpen: false,
  setPortfolioOpen: (b) => set({ portfolioOpen: b }),
}));

// ─── Portfolio store (persisted to localStorage) ──────────────────────────────
export const usePortfolioStore = create(
  persist(
    (set, get) => ({
      holdings: [], // [{ symbol, name, qty, buy_price, added_at }]
      addHolding: (h) =>
        set((s) => ({
          holdings: [
            ...s.holdings,
            { ...h, added_at: new Date().toISOString() },
          ],
        })),
      removeHolding: (symbol) =>
        set((s) => ({
          holdings: s.holdings.filter((h) => h.symbol !== symbol),
        })),
      updateHolding: (symbol, updates) =>
        set((s) => ({
          holdings: s.holdings.map((h) =>
            h.symbol === symbol ? { ...h, ...updates } : h,
          ),
        })),
      clearHoldings: () => set({ holdings: [] }),
    }),
    { name: "market-portfolio" },
  ),
);

export const useStore = useAppStore;
