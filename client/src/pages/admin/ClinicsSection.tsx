import { Building2, ImagePlus, MapPin, Pencil, Phone, PlusCircle, Search, Trash2 } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'
import {
  type AdminClinic,
  ApiError,
  createClinic,
  deleteClinic,
  updateClinic,
  uploadClinicPicture,
} from '@/lib/api'

const inputClass =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

/** Admin list of clinics: search, add, edit, delete. */
export function ClinicsSection({
  clinics,
  token,
  onChanged,
}: {
  clinics: AdminClinic[]
  token: string | null
  /** Reload clinics (and stats) after a change. */
  onChanged: () => Promise<void>
}) {
  // null = form closed, 'new' = adding, otherwise the clinic being edited.
  const [editing, setEditing] = useState<AdminClinic | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return clinics
    return clinics.filter((c) =>
      [c.name, c.address, c.phone, c.description, ...c.doctors.map((d) => `${d.name} ${d.specialization}`)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    )
  }, [clinics, query])

  async function handleDelete(clinic: AdminClinic) {
    if (!token) return
    const doctorNote = clinic.doctors.length
      ? ` ${clinic.doctors.length} doctor${clinic.doctors.length === 1 ? ' is' : 's are'} linked and will be unlinked.`
      : ''
    if (!window.confirm(`Delete ${clinic.name}?${doctorNote} This can't be undone.`)) return
    setError('')
    setDeleting(clinic.id)
    try {
      await deleteClinic(token, clinic.id)
      if (editing !== 'new' && editing?.id === clinic.id) setEditing(null)
      await onChanged()
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that clinic.'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Clinics</h2>
          <p className="mt-0.5 text-xs text-ink/60">
            {clinics.length} total · shown on the public "Find a clinic" page
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
          className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <PlusCircle className="h-4 w-4" />
          {editing === 'new' ? 'Cancel' : 'Add clinic'}
        </button>
      </div>

      {editing && (
        <ClinicForm
          key={editing === 'new' ? 'new' : editing.id}
          clinic={editing === 'new' ? null : editing}
          token={token}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onChanged()
          }}
        />
      )}

      {clinics.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, address, phone or doctor"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {clinics.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No clinics yet. Add the first one above.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No clinics match "{query}".</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((clinic) => (
            <div key={clinic.id} className="card-raised flex flex-col overflow-hidden">
              <ClinicPicture url={clinic.picture_url} />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-sm font-semibold text-ink">{clinic.name}</p>
                {clinic.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink/60">{clinic.description}</p>
                )}
                {clinic.address && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-ink/60">
                    <MapPin className="mt-px h-3.5 w-3.5 shrink-0" /> {clinic.address}
                  </p>
                )}
                {clinic.phone && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {clinic.phone}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {clinic.doctors.length === 0 ? (
                    <span className="text-xs text-ink/40">No doctors linked yet</span>
                  ) : (
                    clinic.doctors.map((doctor) => (
                      <span
                        key={doctor.id}
                        title={doctor.specialization}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {doctor.name}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(clinic)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(clinic)}
                    disabled={deleting === clinic.id}
                    className="flex items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting === clinic.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ClinicPicture({ url }: { url: string | null }) {
  const [broken, setBroken] = useState(false)
  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} className="h-32 w-full object-cover" />
  }
  return (
    <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-primary-300 to-primary-600">
      <Building2 className="h-9 w-9 text-white/90" strokeWidth={1.75} />
    </div>
  )
}

/** Add (clinic = null) or edit form. Photo uploads straight away; its key is saved with the form. */
function ClinicForm({
  clinic,
  token,
  onCancel,
  onSaved,
}: {
  clinic: AdminClinic | null
  token: string | null
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(clinic?.name ?? '')
  const [picture, setPicture] = useState(clinic?.picture ?? '')
  const [preview, setPreview] = useState(clinic?.picture_url ?? '')
  const [address, setAddress] = useState(clinic?.address ?? '')
  const [phone, setPhone] = useState(clinic?.phone ?? '')
  const [description, setDescription] = useState(clinic?.description ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // picking the same file again still fires
    if (!file || !token) return
    setError('')
    setUploading(true)
    try {
      const uploaded = await uploadClinicPicture(token, file)
      setPicture(uploaded.picture)
      setPreview(uploaded.picture_url)
    } catch (err) {
      setError(errorMessage(err, 'Could not upload that photo.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    if (name.trim().length < 2) {
      setError('Enter the clinic name.')
      return
    }
    if (!picture.trim()) {
      setError('Upload a photo or paste an image link.')
      return
    }
    setError('')
    setSaving(true)
    const fields = {
      name: name.trim(),
      picture: picture.trim(),
      address: address.trim(),
      phone: phone.trim(),
      description: description.trim(),
    }
    try {
      if (clinic) {
        // Send only what changed; "" clears an optional field.
        const changes = Object.fromEntries(
          Object.entries(fields).filter(([key, value]) => value !== (clinic[key as keyof typeof fields] ?? '')),
        )
        if (Object.keys(changes).length > 0) await updateClinic(token, clinic.id, changes)
      } else {
        await createClinic(token, {
          ...fields,
          address: fields.address || undefined,
          phone: fields.phone || undefined,
          description: fields.description || undefined,
        })
      }
      await onSaved()
    } catch (err) {
      setError(errorMessage(err, clinic ? 'Could not save your changes.' : 'Could not create that clinic.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised mt-4 space-y-3 p-5">
      <p className="text-sm font-semibold text-ink">{clinic ? `Edit ${clinic.name}` : 'New clinic'}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-20 w-32 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-6 w-6 text-ink/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Uploading…' : preview ? 'Replace photo' : 'Upload photo'}
          </button>
          <input
            value={picture.startsWith('http') ? picture : ''}
            onChange={(e) => {
              setPicture(e.target.value)
              setPreview(e.target.value)
            }}
            placeholder="…or paste an image link (https://…)"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clinic name" maxLength={50} className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputClass} />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          className={`${inputClass} sm:col-span-2`}
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        maxLength={255}
        className={inputClass}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={saving || uploading}>
          {saving ? 'Saving…' : clinic ? 'Save changes' : 'Create clinic'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
