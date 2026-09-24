import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ApiError,
  createFamilyMember,
  deleteFamilyMember,
  type FamilyMemberRecord,
  type FamilyRelationship,
  listFamilyMembers,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const NO_CHECKS = 'No checks yet'

export interface FamilyMember {
  id: string
  name: string
  relation: FamilyRelationship
  age: number
  lastCheck?: string
  avatarUrl?: string
}

export interface NewFamilyMember {
  name: string
  relation: FamilyRelationship
  age: number
  avatarUrl?: string
}

interface FamilyState {
  members: FamilyMember[]
  isLoading: boolean
  loadMembers: () => Promise<void>
  addMember: (member: NewFamilyMember) => Promise<FamilyMember>
  removeMember: (id: string) => Promise<void>
  clear: () => void
}

export function relationLabel(relation: FamilyRelationship) {
  return relation[0].toUpperCase() + relation.slice(1)
}

/** The backend stores a date of birth; the form only asks for an age. */
function ageToDateOfBirth(age: number): string {
  const today = new Date()
  const year = today.getUTCFullYear() - age
  const month = String(today.getUTCMonth() + 1).padStart(2, '0')
  const day = String(today.getUTCDate()).padStart(2, '0')
  // 29 Feb in a non-leap year rolls to 1 Mar, which is still the right age.
  return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString().slice(0, 10)
}

function ageFromDateOfBirth(dateOfBirth: string): number {
  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00Z`)
  const now = new Date()
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  return Math.max(age, 0)
}

function toFamilyMember(record: FamilyMemberRecord, lastCheck = NO_CHECKS): FamilyMember {
  return {
    id: record.id,
    name: record.full_name,
    relation: record.relationship_to_owner ?? 'other',
    age: ageFromDateOfBirth(record.date_of_birth),
    avatarUrl: record.profile ?? undefined,
    lastCheck,
  }
}

function requireToken(): string {
  const token = useAuthStore.getState().token
  if (!token) throw new ApiError('Your session has expired. Please log in again.', 401)
  return token
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      members: [],
      isLoading: false,
      loadMembers: async () => {
        const token = useAuthStore.getState().token
        if (!token) return
        set({ isLoading: true })
        try {
          const records = await listFamilyMembers(token)
          // lastCheck isn't stored server-side; keep what this browser knows.
          const known = new Map(get().members.map((m) => [m.id, m.lastCheck]))
          set({ members: records.map((r) => toFamilyMember(r, known.get(r.id))) })
        } finally {
          set({ isLoading: false })
        }
      },
      addMember: async (member) => {
        const record = await createFamilyMember(requireToken(), {
          full_name: member.name,
          relationship_to_owner: member.relation,
          date_of_birth: ageToDateOfBirth(member.age),
          profile: member.avatarUrl ?? null,
        })
        const created = toFamilyMember(record)
        set((state) => ({ members: [...state.members, created] }))
        return created
      },
      removeMember: async (id) => {
        await deleteFamilyMember(requireToken(), id)
        set((state) => ({ members: state.members.filter((m) => m.id !== id) }))
      },
      clear: () => set({ members: [] }),
    }),
    {
      // Renamed from `symptora-family` so browsers that persisted the old
      // seeded sample members start fresh.
      name: 'symptora-family-v2',
      partialize: (state) => ({ members: state.members }),
    },
  ),
)

// Logging out (or switching account) must not leave the previous account's
// family in this browser.
useAuthStore.subscribe((state, previous) => {
  if (previous.user && state.user?.id !== previous.user.id) {
    useFamilyStore.getState().clear()
  }
})
