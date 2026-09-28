import { Pencil, PlusCircle, Stethoscope, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  ApiError,
  createService,
  deleteService,
  type Service,
  updateService,
} from '@/lib/api'

const inputClass =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

/** Admin list of bookable services (e.g. "Regular Health Checkup"), each
 * tagged to the specialty patients get filtered to when booking. */
export function ServicesSection({
  services,
  token,
  onChanged,
}: {
  services: Service[]
  token: string | null
  onChanged: () => Promise<void>
}) {
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(service: Service) {
    if (!token) return
    if (!window.confirm(`Delete "${service.name}"? This can't be undone.`)) return
    setError('')
    setDeleting(service.id)
    try {
      await deleteService(token, service.id)
      if (editing !== 'new' && editing?.id === service.id) setEditing(null)
      await onChanged()
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that service.'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Services</h2>
          <p className="mt-0.5 text-xs text-ink/60">
            {services.length} total · what patients pick when booking (e.g. "Regular Health Checkup")
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
          className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <PlusCircle className="h-4 w-4" />
          {editing === 'new' ? 'Cancel' : 'Add service'}
        </button>
      </div>

      {editing && (
        <ServiceForm
          key={editing === 'new' ? 'new' : editing.id}
          service={editing === 'new' ? null : editing}
          token={token}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onChanged()
          }}
        />
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {services.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No services yet. Add the first one above.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div key={svc.id} className="card-raised flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <span className="icon-badge h-9 w-9 shrink-0">
                  <Stethoscope className="h-4 w-4 text-primary-600" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{svc.name}</p>
                  <p className="text-xs text-ink/50">{svc.specialization}</p>
                </div>
              </div>
              {svc.description && <p className="line-clamp-2 text-xs text-ink/60">{svc.description}</p>}
              {svc.fee != null && <p className="text-xs font-semibold text-ink/70">Fee: {svc.fee}</p>}
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(svc)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(svc)}
                  disabled={deleting === svc.id}
                  className="flex items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting === svc.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ServiceForm({
  service,
  token,
  onCancel,
  onSaved,
}: {
  service: Service | null
  token: string | null
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(service?.name ?? '')
  const [specialization, setSpecialization] = useState(service?.specialization ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [fee, setFee] = useState(service?.fee?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    if (name.trim().length < 2) {
      setError('Enter the service name.')
      return
    }
    if (specialization.trim().length < 2) {
      setError('Enter the specialty this service should filter to (must match a doctor specialty).')
      return
    }
    setError('')
    setSaving(true)
    const fields = {
      name: name.trim(),
      specialization: specialization.trim(),
      description: description.trim(),
    }
    const feeValue = fee.trim() ? Number(fee) : null
    try {
      if (service) {
        const changes: Record<string, unknown> = Object.fromEntries(
          Object.entries(fields).filter(([key, value]) => value !== (service[key as keyof typeof fields] ?? '')),
        )
        if (feeValue !== service.fee) changes.fee = feeValue
        if (Object.keys(changes).length > 0) await updateService(token, service.id, changes)
      } else {
        await createService(token, { ...fields, description: fields.description || undefined, fee: feeValue })
      }
      await onSaved()
    } catch (err) {
      setError(errorMessage(err, service ? 'Could not save your changes.' : 'Could not create that service.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised mt-4 space-y-3 p-5">
      <p className="text-sm font-semibold text-ink">{service ? `Edit ${service.name}` : 'New service'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name (e.g. Regular Health Checkup)" maxLength={80} className={inputClass} />
        <input
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Specialty (e.g. General Physician)"
          maxLength={80}
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          step="0.01"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Fee (optional)"
          className={inputClass}
        />
      </div>
      <textarea
        value={description ?? ''}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        maxLength={255}
        className={inputClass}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={saving}>
          {saving ? 'Saving…' : service ? 'Save changes' : 'Create service'}
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
