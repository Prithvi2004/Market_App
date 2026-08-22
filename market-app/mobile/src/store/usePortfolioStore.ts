/**
 * Portfolio store persisted via AsyncStorage.
 * Mirrors the web app's usePortfolioStore with localStorage → AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Holding } from '../types/portfolio';

interface PortfolioState {
  holdings: Holding[];
  addHolding: (h: Omit<Holding, 'added_at'>) => void;
  removeHolding: (symbol: string) => void;
  updateHolding: (symbol: string, updates: Partial<Holding>) => void;
  clearHoldings: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],

      addHolding: (h) =>
        set((s) => ({
          holdings: [
            ...s.holdings.filter((x) => x.symbol !== h.symbol),
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
    {
      name: 'market-portfolio',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
