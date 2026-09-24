import { Baby, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { ApiError, FAMILY_RELATIONSHIPS, type FamilyRelationship } from '@/lib/api'
import { relationLabel, useFamilyStore } from '@/store/familyStore'

/** Photos are stored inline with the member, so keep them small. */
async function shrinkPhoto(dataUrl: string, size = 256): Promise<string> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const scale = Math.min(1, size / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function FamilyPage() {
  const { members, loadMembers, addMember, removeMember } = useFamilyStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState<FamilyRelationship | ''>('')
  const [age, setAge] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMembers().catch((err) =>
      setError(errorMessage(err, 'Could not load your family profiles.')),
    )
  }, [loadMembers])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const parsedAge = Number(age)
    if (!name.trim() || !relation || !age) {
      setError('Enter a name, relation and age.')
      return
    }
    if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      setError('Enter an age between 0 and 120.')
      return
    }

    setSaving(true)
    try {
      await addMember({
        name: name.trim(),
        relation,
        age: parsedAge,
        avatarUrl: avatarUrl ? await shrinkPhoto(avatarUrl) : undefined,
      })
      setName('')
      setRelation('')
      setAge('')
      setAvatarUrl(null)
      setShowForm(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not save this family member. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    setError('')
    try {
      await removeMember(id)
    } catch (err) {
      setError(errorMessage(err, 'Could not remove this family member.'))
    }
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
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value as FamilyRelationship)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="" disabled>
                Select relation
              </option>
              {FAMILY_RELATIONSHIPS.map((value) => (
                <option key={value} value={value}>
                  {relationLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">Age</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Age"
            />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn-raised" disabled={saving}>
              {saving ? 'Saving…' : 'Save family member'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

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
                  {relationLabel(member.relation)} · {member.age} yrs
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
                onClick={() => handleRemove(member.id)}
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
