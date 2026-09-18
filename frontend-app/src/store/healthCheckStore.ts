import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockRiskChecks } from '@/data/mockData';
import type { RiskCheck } from '@/types';

interface HealthCheckState {
  /** Newest first. Seeded with sample history so the UI is never empty. */
  checks: RiskCheck[];
  addCheck: (check: RiskCheck) => void;
  clearChecks: () => void;
}

export const useHealthCheckStore = create<HealthCheckState>()(
  persist(
    (set) => ({
      checks: mockRiskChecks,
      addCheck: (check) => set((state) => ({ checks: [check, ...state.checks] })),
      clearChecks: () => set({ checks: [] }),
    }),
    {
      name: 'symptora-health-checks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
