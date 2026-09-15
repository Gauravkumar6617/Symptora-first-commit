import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FamilyMember {
  id: string
  name: string
  relation: string
  age: number
  lastCheck?: string
  avatarUrl?: string
}

interface FamilyState {
  members: FamilyMember[]
  addMember: (member: Omit<FamilyMember, 'id'>) => void
  removeMember: (id: string) => void
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      members: [
        { name: 'Meena Kumar', relation: 'Mother', age: 58, lastCheck: 'Low risk · 2 weeks ago', id: 'seed-1' },
        { name: 'Aarav Kumar', relation: 'Son', age: 9, lastCheck: 'No checks yet', id: 'seed-2' },
      ],
      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            { ...member, id: crypto.randomUUID() },
          ],
        })),
      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        })),
    }),
    { name: 'symptora-family' },
  ),
)
