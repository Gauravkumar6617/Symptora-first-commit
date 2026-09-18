import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthSession, AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  /** Stores the signed-in user plus any tokens returned by the API. */
  setSession: (session: AuthSession) => void;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'symptora-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
