import { Baby, CheckCircle2, Mail, Pencil, UserRound, UsersRound } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ApiError,
  answerFamilyLink,
  FAMILY_RELATIONSHIPS,
  listFamilyLinks,
  type FamilyRelationship,
  GENDERS,
  listChecks,
  type SymptomCheck,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { type FamilyMember, relationLabel, useFamilyStore } from '@/store/familyStore'

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

const urgencyText: Record<SymptomCheck['urgency'], string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-danger',
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary'

export function FamilyPage() {
  const token = useAuthStore((state) => state.token)
  const { members, loadMembers, addMember, updateMember, removeMember, inviteMember } = useFamilyStore()
  const [showForm, setShowForm] = useState(false)
  /** null = the form adds a new member; otherwise the member being edited. */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState<FamilyRelationship | ''>('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [checks, setChecks] = useState<SymptomCheck[]>([])

  useEffect(() => {
    loadMembers().catch((err) =>
      setError(errorMessage(err, 'Could not load your family profiles.')),
    )
  }, [loadMembers])

  useEffect(() => {
    if (!token) return
    listChecks(token)
      .then(setChecks)
      .catch(() => {}) // the cards still work without history
  }, [token])

  /** Newest check per family member (the list comes newest first). */
  const latestCheck = useMemo(() => {
    const latest = new Map<string, SymptomCheck>()
    for (const check of checks) {
      if (check.family_member_id && !latest.has(check.family_member_id)) {
        latest.set(check.family_member_id, check)
      }
    }
    return latest
  }, [checks])

  async function handleInvite(id: string) {
    setError('')
    setNotice('')
    setInviting(id)
    try {
      setNotice(await inviteMember(id))
    } catch (err) {
      setError(errorMessage(err, 'Could not send the invite. Please try again.'))
    } finally {
      setInviting(null)
    }
  }

  function resetForm() {
    setName('')
    setRelation('')
    setAge('')
    setGender('')
    setEmail('')
    setNumber('')
    setAvatarUrl(null)
    setEditingId(null)
  }

  function startEdit(member: FamilyMember) {
    setError('')
    setNotice('')
    setEditingId(member.id)
    setName(member.name)
    setRelation(member.relation)
    setAge(String(member.age))
    setGender(member.gender ?? '')
    setEmail(member.email ?? '')
    setNumber(member.number ?? '')
    setAvatarUrl(member.avatarUrl ?? null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    if (number && !/^\+?\d{7,15}$/.test(number.replace(/[\s-]/g, ''))) {
      setError('Enter a valid phone number, or leave it empty.')
      return
    }

    setSaving(true)
    try {
      const details = {
        name: name.trim(),
        relation,
        age: parsedAge,
        gender: gender || undefined,
        email: email.trim() || undefined,
        number: number.replace(/[\s-]/g, '') || undefined,
        // Already-stored photos are small data URLs; only shrink new uploads.
        avatarUrl: avatarUrl ? (avatarUrl.length > 60_000 ? await shrinkPhoto(avatarUrl) : avatarUrl) : undefined,
      }
      if (editingId) await updateMember(editingId, details)
      else await addMember(details)
      resetForm()
      setShowForm(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not save this family member. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(member: FamilyMember) {
    const ok = window.confirm(
      `Remove ${member.name}? Their profile and the health checks you ran for them will be deleted. ` +
        'This cannot be undone.',
    )
    if (!ok) return
    const id = member.id
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
            Link parents, kids, or anyone you manage healthcare for. Add their
            email and phone to invite them: once they activate their own login,
            you both see their health checks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
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
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">
              Email <span className="font-normal text-ink/40">(for their invite)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(editingId && members.find((m) => m.id === editingId)?.hasAccount)}
              title="A member with their own login keeps the email they log in with"
              className={`${inputClass} disabled:bg-surface disabled:text-ink/50`}
              placeholder="name@example.com"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-ink">
              Phone <span className="font-normal text-ink/40">(they log in with it)</span>
            </label>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputClass}
              placeholder="9876543210"
            />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn-raised" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save family member'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {notice && <p className="mt-4 text-sm text-success">{notice}</p>}

      {token && <FamilyLinksSection token={token} />}

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
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {member.hasAccount ? (
                <span className="flex items-center gap-1 font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Has their own login
                </span>
              ) : member.email ? (
                <span className="text-ink/50">Not joined yet · {member.email}</span>
              ) : (
                <span className="text-ink/40">Add an email to invite them</span>
              )}
            </div>
            {(() => {
              const last = latestCheck.get(member.id)
              return (
                <p className="mt-1.5 text-xs font-medium text-ink/60">
                  {last ? (
                    <>
                      Last check: {last.predictions[0]?.label ?? 'Symptom check'} ·{' '}
                      <span className={urgencyText[last.urgency]}>{last.urgency} urgency</span> ·{' '}
                      {new Date(last.created_at).toLocaleDateString()}
                    </>
                  ) : (
                    'No checks yet'
                  )}
                </p>
              )
            })()}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/symptom-checker?member=${member.id}`}
                className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-primary/90"
              >
                Check symptoms
              </Link>
              <Link
                to={`/appointments?member=${member.id}`}
                className="flex-1 rounded-lg border border-ink/15 px-3 py-1.5 text-center text-xs font-semibold text-ink hover:bg-ink/5"
              >
                Book for them
              </Link>
              {!member.hasAccount && member.email && (
                <button
                  type="button"
                  onClick={() => handleInvite(member.id)}
                  disabled={inviting === member.id}
                  className="flex items-center gap-1 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {inviting === member.id ? 'Sending…' : 'Invite'}
                </button>
              )}
              <button
                type="button"
                onClick={() => startEdit(member)}
                className="flex items-center gap-1 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleRemove(member)}
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

/** People who added *you* as family. Linking shares health checks both ways,
 * so it only happens when you approve it here; you can leave at any time. */
function FamilyLinksSection({ token }: { token: string }) {
  const queryClient = useQueryClient()
  const { data: links = [] } = useQuery({ queryKey: ['family-links'], queryFn: () => listFamilyLinks(token) })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function answer(id: string, accept: boolean, leaving: boolean) {
    if (leaving && !window.confirm('Stop sharing health checks with this person?')) return
    setBusy(id)
    setError('')
    try {
      await answerFamilyLink(token, id, accept)
      await queryClient.invalidateQueries({ queryKey: ['family-links'] })
    } catch (err) {
      setError(errorMessage(err, 'Could not update this link. Please try again.'))
    } finally {
      setBusy(null)
    }
  }

  if (links.length === 0) return null

  return (
    <div className="card-raised mt-6 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
        <UsersRound className="h-4 w-4 text-primary-600" /> People who added you as family
      </h2>
      <p className="mt-1 text-xs text-ink/50">
        Approving lets you both see each other's health checks. Nothing is shared until you approve.
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <ul className="mt-3 divide-y divide-ink/10">
        {links.map((link) => (
          <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-sm text-ink">
              <span className="font-semibold">{link.owner_name}</span>
              {link.relationship_to_owner && (
                <span className="text-ink/50"> · added you as {relationLabel(link.relationship_to_owner)}</span>
              )}
            </p>
            {link.status === 'pending' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === link.id}
                  onClick={() => answer(link.id, true, false)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === link.id}
                  onClick={() => answer(link.id, false, false)}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sharing health checks
                </span>
                <button
                  type="button"
                  disabled={busy === link.id}
                  onClick={() => answer(link.id, false, true)}
                  className="text-xs font-semibold text-danger hover:underline disabled:opacity-60"
                >
                  Leave
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
