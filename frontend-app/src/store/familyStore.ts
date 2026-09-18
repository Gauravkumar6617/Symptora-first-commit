import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockFamilyMembers } from '@/data/mockData';
import type { FamilyMember } from '@/types';

interface FamilyState {
  members: FamilyMember[];
  addMember: (member: Omit<FamilyMember, 'id' | 'lastCheck'>) => void;
  removeMember: (id: string) => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      members: mockFamilyMembers,
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
      name: 'symptora-family',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
