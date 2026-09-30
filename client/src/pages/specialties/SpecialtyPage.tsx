import { Check, UserRound } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SpecialtyThumbnail } from '@/components/specialties/SpecialtyThumbnail'
import { useDirectory } from '@/hooks/useDirectory'
import { getSpecialtyBySlug, specialties } from '@/data/specialties'

export function SpecialtyPage() {
  const { slug } = useParams<{ slug: string }>()
  const { doctors } = useDirectory()
  const specialty = slug ? getSpecialtyBySlug(slug) : undefined

  if (!specialty) {
    return <Navigate to="/" replace />
  }

  const specialtyDoctors = doctors.filter(
    (doctor) => doctor.specialization === specialty.doctorSpecialty,
  )
  const otherSpecialties = specialties.filter((s) => s.slug !== specialty.slug)

  return (
    <div>
      <section className="relative overflow-hidden">
        <SpecialtyThumbnail specialty={specialty} className="h-56 sm:h-64" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
            <Link
              to="/"
              className="text-xs font-medium text-white/80 hover:text-white"
            >
              ← Back to home
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {specialty.label}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {specialty.shortDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-ink">About this specialty</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {specialty.longDescription}
            </p>

            <h3 className="mt-6 text-sm font-semibold text-ink">
              Commonly seen for
            </h3>
            <ul className="mt-3 space-y-2">
              {specialty.commonFor.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-ink/70"
                >
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold text-ink">
              Available doctors
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {specialtyDoctors.length === 0 && (
                <p className="text-sm text-ink/50">
                  No doctors listed yet for this specialty — check back soon.
                </p>
              )}
              {specialtyDoctors.map((doctor) => {
                return (
                  <div key={doctor.id} className="card-raised p-4">
                    <div className="flex items-center gap-3">
                      <span className="icon-badge h-11 w-11">
                        <UserRound className="h-5 w-5 text-primary-600" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-ink/50">
                          {doctor.years_of_practice ? `${doctor.years_of_practice} yrs · ` : ''}{doctor.clinicName}
                        </p>
                      </div>
                    </div>
                    {doctor.fee != null && (
                      <p className="mt-3 text-xs text-ink/60">₹{doctor.fee}</p>
                    )}
                    <Link
                      to="/appointments"
                      className="btn-raised mt-4 block w-full text-center"
                    >
                      Book with {doctor.name}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-raised bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
              <h3 className="text-base font-bold">Not sure this is the right fit?</h3>
              <p className="mt-2 text-sm text-white/85">
                Run a Health Check first and we'll point you to the right
                specialist based on your symptoms.
              </p>
              <Link
                to="/symptom-checker"
                className="mt-4 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-white/90"
              >
                Start Health Check
              </Link>
            </div>

            <div className="card-raised p-5">
              <h3 className="text-sm font-semibold text-ink">
                Explore other specialties
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {otherSpecialties.slice(0, 6).map((item) => (
                  <Link
                    key={item.slug}
                    to={`/specialties/${item.slug}`}
                    className="pill-well px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-primary-600"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
