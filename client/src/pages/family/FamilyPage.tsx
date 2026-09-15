import { Baby, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { useFamilyStore } from '@/store/familyStore'

export function FamilyPage() {
  const { members, addMember, removeMember } = useFamilyStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [age, setAge] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name || !relation || !age) return
    addMember({
      name,
      relation,
      age: Number(age),
      lastCheck: 'No checks yet',
      avatarUrl: avatarUrl ?? undefined,
    })
    setName('')
    setRelation('')
    setAge('')
    setAvatarUrl(null)
    setShowForm(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Family profiles</h1>
          <p className="mt-2 text-sm text-ink/60">
            Link parents, kids, or anyone you manage healthcare for. Their
            checks and appointments live under your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-raised"
        >
          {showForm ? 'Cancel' : '+ Link family member'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card-raised mt-6 grid gap-4 p-6 sm:grid-cols-3"
        >
          <div className="sm:col-span-3">
            <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Full name"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">
              Relation
            </label>
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Father, Daughter"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">Age</label>
            <input
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Age"
            />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn-raised">
              Save family member
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="card-raised p-5">
            <div className="flex items-center gap-3">
              <span className="icon-badge h-11 w-11 overflow-hidden">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : member.age < 16 ? (
                  <Baby className="h-5 w-5 text-primary-600" />
                ) : (
                  <UserRound className="h-5 w-5 text-primary-600" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {member.name}
                </p>
                <p className="text-xs text-ink/50">
                  {member.relation} · {member.age} yrs
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-ink/60">
              {member.lastCheck}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/appointments"
                className="flex-1 rounded-lg border border-ink/15 px-3 py-1.5 text-center text-xs font-semibold text-ink hover:bg-ink/5"
              >
                Book for them
              </Link>
              <button
                type="button"
                onClick={() => removeMember(member.id)}
                className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
