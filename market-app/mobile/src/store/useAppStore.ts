/**
 * Global app state using Zustand.
 * Mirrors the web app's useStore.js (non-persisted slice).
 */
import { create } from 'zustand';
import type { LivePricesPayload } from '../types/market';

interface AppState {
  // Stock selection
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;

  // News filter
  newsFilter: string;
  setNewsFilter: (f: string) => void;

  // Sector filter
  sectorFilter: string | null;
  setSectorFilter: (s: string | null) => void;

  // Exchange toggle
  exchange: 'NSE' | 'BSE';
  setExchange: (e: 'NSE' | 'BSE') => void;

  // Market status
  marketStatus: string;
  setMarketStatus: (s: string) => void;

  // Live prices from WebSocket
  livePrices: LivePricesPayload | null;
  setLivePrices: (p: LivePricesPayload) => void;

  // Impact Analyzer modal
  impactOpen: boolean;
  impactHeadline: string;
  impactSummary: string;
  impactText: string;
  impactLoading: boolean;
  setImpactOpen: (b: boolean) => void;
  setImpactHeadline: (h: string) => void;
  setImpactSummary: (s: string) => void;
  setImpactText: (t: string) => void;
  appendImpactText: (t: string) => void;
  setImpactLoading: (b: boolean) => void;
  resetImpact: () => void;

  // AI Explainer (per stock)
  explainText: string;
  explainLoading: boolean;
  explainSources: Array<{ title: string; url: string; source: string; sentiment_label: string; published_at?: string }>;
  explainConfidence: string | null;
  setExplainText: (t: string) => void;
  appendExplainText: (t: string) => void;
  setExplainLoading: (b: boolean) => void;
  setExplainSources: (s: AppState['explainSources']) => void;
  setExplainConfidence: (c: string | null) => void;
  resetExplain: () => void;

  // Screener filter
  screenerFilter: string;
  setScreenerFilter: (f: string) => void;

  // Compare symbols (analysis screen)
  compareSymbols: string[];
  addCompareSymbol: (sym: string) => void;
  removeCompareSymbol: (sym: string) => void;
  clearCompare: () => void;

  // Copilot chat
  copilotMessages: Array<{ role: string; content: string }>;
  addCopilotMessage: (msg: { role: string; content: string }) => void;
  clearCopilotHistory: () => void;
  copilotLoading: boolean;
  setCopilotLoading: (b: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Stock
  selectedSymbol: null,
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),

  // News
  newsFilter: 'all',
  setNewsFilter: (f) => set({ newsFilter: f }),

  // Sector
  sectorFilter: null,
  setSectorFilter: (s) => set({ sectorFilter: s }),

  // Exchange
  exchange: 'NSE',
  setExchange: (e) => set({ exchange: e }),

  // Market status
  marketStatus: 'closed',
  setMarketStatus: (s) => set({ marketStatus: s }),

  // Live prices
  livePrices: null,
  setLivePrices: (p) => set({ livePrices: p }),

  // Impact
  impactOpen: false,
  impactHeadline: '',
  impactSummary: '',
  impactText: '',
  impactLoading: false,
  setImpactOpen: (b) => set({ impactOpen: b }),
  setImpactHeadline: (h) => set({ impactHeadline: h }),
  setImpactSummary: (s) => set({ impactSummary: s }),
  setImpactText: (t) => set({ impactText: t }),
  appendImpactText: (t) => set((s) => ({ impactText: s.impactText + t })),
  setImpactLoading: (b) => set({ impactLoading: b }),
  resetImpact: () => set({ impactText: '', impactHeadline: '', impactSummary: '', impactLoading: false }),

  // Explain
  explainText: '',
  explainLoading: false,
  explainSources: [],
  explainConfidence: null,
  setExplainText: (t) => set({ explainText: t }),
  appendExplainText: (t) => set((s) => ({ explainText: s.explainText + t })),
  setExplainLoading: (b) => set({ explainLoading: b }),
  setExplainSources: (s) => set({ explainSources: s }),
  setExplainConfidence: (c) => set({ explainConfidence: c }),
  resetExplain: () => set({ explainText: '', explainSources: [], explainConfidence: null, explainLoading: false }),

  // Screener
  screenerFilter: 'all',
  setScreenerFilter: (f) => set({ screenerFilter: f }),

  // Compare
  compareSymbols: [],
  addCompareSymbol: (sym) =>
    set((s) => {
      if (s.compareSymbols.includes(sym) || s.compareSymbols.length >= 3) return {};
      return { compareSymbols: [...s.compareSymbols, sym] };
    }),
  removeCompareSymbol: (sym) =>
    set((s) => ({ compareSymbols: s.compareSymbols.filter((x) => x !== sym) })),
  clearCompare: () => set({ compareSymbols: [] }),

  // Copilot
  copilotMessages: [],
  addCopilotMessage: (msg) =>
    set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),
  clearCopilotHistory: () => set({ copilotMessages: [] }),
  copilotLoading: false,
  setCopilotLoading: (b) => set({ copilotLoading: b }),
}));
