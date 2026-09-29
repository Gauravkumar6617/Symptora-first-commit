import { Building2, Clock, MapPin, Navigation, Phone, Search, Stethoscope, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClinicCardSkeleton } from '@/components/ui/Skeleton'
import { ApiError, listClinicDirectory, type PublicClinic } from '@/lib/api'

/** Public "Find a clinic": the partner clinics admins add, with their doctors. */
export function ClinicsPage() {
  const [clinics, setClinics] = useState<PublicClinic[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [detailClinic, setDetailClinic] = useState<PublicClinic | null>(null)

  useEffect(() => {
    let cancelled = false
    listClinicDirectory()
      .then((list) => {
        if (!cancelled) setClinics(list)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not load clinics.')
        setClinics([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!clinics || !needle) return clinics ?? []
    return clinics.filter((c) =>
      [c.name, c.address, c.description, ...c.doctors.flatMap((d) => [d.name, d.specialization])]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    )
  }, [clinics, query])

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Find a clinic near you</h1>
      <p className="mt-2 text-sm text-ink/60">
        Symptora-partnered clinics for in-person visits, lab tests, and
        vaccinations.
      </p>

      <div className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2.5">
        <Search className="h-4 w-4 text-ink/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by clinic, area, doctor or specialty"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {clinics === null ? (
          Array.from({ length: 4 }).map((_, i) => <ClinicCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink/60 sm:col-span-2">
            {clinics.length === 0 ? 'No partner clinics yet. Check back soon.' : `No clinics match "${query}".`}
          </p>
        ) : (
          filtered.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} onOpen={() => setDetailClinic(clinic)} />
          ))
        )}
      </div>

      {detailClinic && <ClinicDetailSheet clinic={detailClinic} onClose={() => setDetailClinic(null)} />}
    </div>
  )
}

function ClinicCard({ clinic, onOpen }: { clinic: PublicClinic; onOpen: () => void }) {
  const [broken, setBroken] = useState(false)
  const specialties = [...new Set(clinic.doctors.map((d) => d.specialization))]
  const mapsQuery = encodeURIComponent([clinic.name, clinic.address].filter(Boolean).join(' '))

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="card-raised flex cursor-pointer flex-col overflow-hidden text-left transition-shadow hover:shadow-lg"
    >
      {clinic.picture_url && !broken ? (
        <img
          src={clinic.picture_url}
          alt=""
          onError={() => setBroken(true)}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div
          className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-300 to-primary-600"
          aria-hidden
        >
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
          <Building2 className="h-9 w-9 text-white/90" strokeWidth={1.75} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-ink">{clinic.name}</h3>
        {clinic.description && <p className="mt-1 text-sm text-ink/60">{clinic.description}</p>}
        {clinic.address && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-ink/50">
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" /> {clinic.address}
          </p>
        )}

        {specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <span key={specialty} className="pill-well px-3 py-1 text-xs font-medium text-ink/70">
                {specialty}
              </span>
            ))}
          </div>
        )}
        {clinic.doctors.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-ink/60">
            <Stethoscope className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
            {clinic.doctors.map((d) => d.name).join(', ')}
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-4">
          {clinic.address && (
            <a
              href={`https://maps.google.com/?q=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
          )}
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone.replace(/\s/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              <Phone className="h-3.5 w-3.5" /> {clinic.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/** Bottom sheet (centered dialog on larger screens) with the clinic's full
 * details and its doctors, opened by tapping a clinic card. */
function ClinicDetailSheet({ clinic, onClose }: { clinic: PublicClinic; onClose: () => void }) {
  const [broken, setBroken] = useState(false)
  const specialties = [...new Set(clinic.doctors.map((d) => d.specialization))]
  const mapsQuery = encodeURIComponent([clinic.name, clinic.address].filter(Boolean).join(' '))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className="card-raised flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none p-0 sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          {clinic.picture_url && !broken ? (
            <img
              src={clinic.picture_url}
              alt=""
              onError={() => setBroken(true)}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div
              className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-300 to-primary-600"
              aria-hidden
            >
              <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
              <Building2 className="h-10 w-10 text-white/90" strokeWidth={1.75} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/55"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <h2 className="text-lg font-bold text-ink">{clinic.name}</h2>
          {clinic.description && <p className="mt-1.5 text-sm text-ink/60">{clinic.description}</p>}

          <div className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-surface/60 p-4 text-sm text-ink/70">
            {clinic.address && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {clinic.address}
              </p>
            )}
            {clinic.opening_hours && (
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" /> {clinic.opening_hours}
              </p>
            )}
            {clinic.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" /> {clinic.phone}
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {clinic.address && (
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Navigation className="h-3.5 w-3.5" /> Directions
              </a>
            )}
            {clinic.phone && (
              <a
                href={`tel:${clinic.phone.replace(/\s/g, '')}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
          </div>

          {specialties.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <span key={specialty} className="pill-well px-3 py-1 text-xs font-medium text-ink/70">
                  {specialty}
                </span>
              ))}
            </div>
          )}

          {clinic.doctors.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/40">Doctors here</h3>
              <div className="mt-2 space-y-2">
                {clinic.doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center gap-3 rounded-xl border border-ink/10 p-3">
                    {doctor.avatar_url ? (
                      <img
                        src={doctor.avatar_url}
                        alt={doctor.name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="icon-badge h-11 w-11 shrink-0">
                        <UserRound className="h-5 w-5 text-primary-600" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{doctor.name}</p>
                      <p className="text-xs text-ink/50">
                        {doctor.specialization}
                        {doctor.years_of_practice != null ? ` · ${doctor.years_of_practice} yrs exp` : ''}
                      </p>
                      {doctor.languages && (
                        <p className="text-xs text-ink/40">Speaks {doctor.languages}</p>
                      )}
                    </div>
                    {doctor.fee != null && (
                      <p className="shrink-0 text-xs font-semibold text-primary">{doctor.fee}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link to="/appointments" onClick={onClose} className="btn-raised mt-6 block w-full text-center">
            Book an appointment here
          </Link>
        </div>
      </div>
    </div>
  )
}
