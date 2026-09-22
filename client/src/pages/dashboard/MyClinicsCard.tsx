import { Building2, PlusCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  assignDoctorToClinic,
  type Clinic,
  type DoctorClinic,
  getMyClinics,
  listClinics,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/** Shown on the dashboard once a doctor's application is approved — lets
 * them join clinics they work at (backed by /doctor/clinics/{id}/assign). */
export function MyClinicsCard() {
  const token = useAuthStore((state) => state.token)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [myClinics, setMyClinics] = useState<DoctorClinic[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([listClinics(token), getMyClinics(token)])
      .then(([allClinics, mine]) => {
        if (cancelled) return
        setClinics(allClinics)
        setMyClinics(mine)
      })
      .catch(() => {
        // Best-effort: leave the lists empty if either call fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const joinedClinicIds = useMemo(
    () => new Set(myClinics.map((link) => link.clinic_id)),
    [myClinics],
  )
  const clinicsById = useMemo(
    () => new Map(clinics.map((clinic) => [clinic.id, clinic])),
    [clinics],
  )
  const joinableClinics = useMemo(
    () => clinics.filter((clinic) => !joinedClinicIds.has(clinic.id)),
    [clinics, joinedClinicIds],
  )

  useEffect(() => {
    if (!selectedClinicId && joinableClinics.length > 0) {
      setSelectedClinicId(joinableClinics[0].id)
    }
  }, [joinableClinics, selectedClinicId])

  async function handleJoin() {
    if (!token || !selectedClinicId) return
    setError('')
    setJoining(true)
    try {
      const link = await assignDoctorToClinic(token, selectedClinicId)
      setMyClinics((prev) => [...prev, link])
      setSelectedClinicId('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not join that clinic.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return null

  return (
    <div className="card-raised mt-10 p-5">
      <div className="flex items-center gap-3">
        <span className="icon-badge">
          <Building2 className="h-6 w-6 text-primary-600" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">My clinics</h3>
          <p className="mt-0.5 text-xs text-ink/60">
            Clinics you currently practice at.
          </p>
        </div>
      </div>

      {myClinics.length > 0 && (
        <ul className="mt-4 space-y-2">
          {myClinics.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-sm text-ink"
            >
              {clinicsById.get(link.clinic_id)?.name ?? 'Clinic'}
            </li>
          ))}
        </ul>
      )}

      {joinableClinics.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {joinableClinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !selectedClinicId}
            className="btn-raised flex items-center justify-center gap-1.5 px-4 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            {joining ? 'Joining…' : 'Join clinic'}
          </button>
        </div>
      ) : (
        clinics.length > 0 &&
        myClinics.length === clinics.length && (
          <p className="mt-4 text-xs text-ink/50">
            You're linked to every listed clinic.
          </p>
        )
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
