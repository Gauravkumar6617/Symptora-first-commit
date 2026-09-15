import { Building2, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { clinics } from '@/data/clinics'
import { ClinicCardSkeleton } from '@/components/ui/Skeleton'

const cities = Array.from(new Set(clinics.map((c) => c.city)))

export function ClinicsPage() {
  const [city, setCity] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(
    () => (city === 'All' ? clinics : clinics.filter((c) => c.city === city)),
    [city],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Find a clinic near you</h1>
      <p className="mt-2 text-sm text-ink/60">
        Symptora-partnered clinics for in-person visits, lab tests, and
        vaccinations.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {['All', ...cities].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCity(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              city === item
                ? 'bg-primary text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]'
                : 'border border-ink/15 bg-white text-ink/70 hover:border-primary/40'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ClinicCardSkeleton key={i} />
            ))
          : filtered.map((clinic) => (
              <div key={clinic.id} className="card-raised overflow-hidden">
                <div
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-300 to-primary-600"
                  aria-hidden
                >
                  <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
                  <Building2 className="h-9 w-9 text-white/90" strokeWidth={1.75} />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-ink">
                        {clinic.name}
                      </h3>
                      <p className="mt-1 text-xs text-ink/50">
                        {clinic.address}, {clinic.city}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      {clinic.distanceKm} km
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {clinic.services.map((service) => (
                      <span
                        key={service}
                        className="pill-well px-3 py-1 text-xs font-medium text-ink/70"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {clinic.rating}
                    </span>
                    <span>{clinic.openHours}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
