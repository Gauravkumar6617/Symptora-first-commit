import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingState {
  hasOnboarded: boolean;
  hasHydrated: boolean;
  completeOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasHydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'symptora-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
