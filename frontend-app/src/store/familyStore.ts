import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  ageToDateOfBirth,
  createFamilyMember,
  deleteFamilyMember,
  fetchFamilyMembers,
  isDemoMode,
  toFamilyMember,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { FamilyMember } from '@/types';

const NO_CHECKS = 'No checks yet';

/** The API is used whenever it's configured and someone is signed in. */
function apiToken(): string | null {
  if (isDemoMode) return null;
  return useAuthStore.getState().accessToken;
}

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;
  /** Pulls the signed-in account's members from the API (no-op in demo mode). */
  loadMembers: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id' | 'lastCheck'>) => Promise<FamilyMember>;
  removeMember: (id: string) => Promise<void>;
  clear: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      members: [],
      isLoading: false,
      loadMembers: async () => {
        const token = apiToken();
        if (!token) return;
        set({ isLoading: true });
        try {
          const records = await fetchFamilyMembers(token);
          // lastCheck isn't stored server-side; keep what this device knows.
          const known = new Map(get().members.map((m) => [m.id, m.lastCheck]));
          set({
            members: records.map((record) => ({
              ...toFamilyMember(record),
              lastCheck: known.get(record.id) ?? NO_CHECKS,
            })),
          });
        } finally {
          set({ isLoading: false });
        }
      },
      addMember: async (member) => {
        const token = apiToken();
        const created: FamilyMember = token
          ? {
              ...toFamilyMember(
                await createFamilyMember(token, {
                  full_name: member.name,
                  relationship_to_owner: member.relation,
                  date_of_birth: ageToDateOfBirth(member.age),
                  gender: member.gender ?? null,
                }),
              ),
              lastCheck: NO_CHECKS,
            }
          : { ...member, id: `fm-${Date.now()}`, lastCheck: NO_CHECKS };
        set((state) => ({ members: [...state.members, created] }));
        return created;
      },
      removeMember: async (id) => {
        const token = apiToken();
        if (token) await deleteFamilyMember(token, id);
        set((state) => ({ members: state.members.filter((m) => m.id !== id) }));
      },
      clear: () => set({ members: [] }),
    }),
    {
      // Renamed from `symptora-family` so a device that already persisted
      // the old seeded sample family members starts fresh instead of
      // reloading them from storage.
      name: 'symptora-family-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ members: state.members }),
    },
  ),
);

// Signing out (or switching account) must not leave the previous account's
// family on this device. null -> user is sign-in or auth rehydrating on
// launch, which must keep what's stored.
useAuthStore.subscribe((state, previous) => {
  if (previous.user && state.user?.id !== previous.user.id) useFamilyStore.getState().clear();
});
