import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RiskCheck } from '@/types';

interface HealthCheckState {
  /** Newest first. */
  checks: RiskCheck[];
  addCheck: (check: RiskCheck) => void;
  clearChecks: () => void;
}

export const useHealthCheckStore = create<HealthCheckState>()(
  persist(
    (set) => ({
      checks: [],
      addCheck: (check) => set((state) => ({ checks: [check, ...state.checks] })),
      clearChecks: () => set({ checks: [] }),
    }),
    {
      // Renamed from `symptora-health-checks` so a device that already
      // persisted the old seeded sample checks starts fresh instead of
      // reloading them from storage.
      name: 'symptora-health-checks-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
