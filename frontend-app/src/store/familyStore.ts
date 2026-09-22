import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FamilyMember } from '@/types';

interface FamilyState {
  members: FamilyMember[];
  addMember: (member: Omit<FamilyMember, 'id' | 'lastCheck'>) => void;
  removeMember: (id: string) => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      members: [],
      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            { ...member, id: `fm-${Date.now()}`, lastCheck: 'No checks yet' },
          ],
        })),
      removeMember: (id) => set((state) => ({ members: state.members.filter((m) => m.id !== id) })),
    }),
    {
      // Renamed from `symptora-family` so a device that already persisted
      // the old seeded sample family members starts fresh instead of
      // reloading them from storage.
      name: 'symptora-family-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
