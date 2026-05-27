import { create } from "zustand";

export const useStore = create((set) => ({
  selectedSymbol: null,
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),

  newsFilter: "all",
  setNewsFilter: (f) => set({ newsFilter: f }),

  sectorFilter: null,
  setSectorFilter: (s) => set({ sectorFilter: s }),

  explainText: "",
  explainLoading: false,
  explainSources: [],
  explainConfidence: null,
  setExplainText: (t) => set({ explainText: t }),
  appendExplainText: (t) => set((s) => ({ explainText: s.explainText + t })),
  setExplainLoading: (b) => set({ explainLoading: b }),
  setExplainSources: (s) => set({ explainSources: s }),
  setExplainConfidence: (c) => set({ explainConfidence: c }),
  resetExplain: () => set({ explainText: "", explainSources: [], explainConfidence: null }),

  exchange: "NSE",
  setExchange: (e) => set({ exchange: e }),

  marketStatus: "closed",
  setMarketStatus: (s) => set({ marketStatus: s }),

  livePrices: { indices: [], gainers: [], losers: [] },
  setLivePrices: (p) => set({ livePrices: p }),
}));
