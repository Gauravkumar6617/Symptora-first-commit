import { MessageCircle, Pill, Star, UserRound, Video, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PoweredByStrip } from '@/components/marketing/PoweredByStrip'
import { ListRowSkeleton } from '@/components/ui/Skeleton'
import { doctors } from '@/data/doctors'
import { clinics } from '@/data/clinics'

const capabilities = [
  {
    icon: Video,
    title: 'Video consultations',
    description:
      'Face-to-face with a licensed doctor from your phone or laptop, no app install needed.',
  },
  {
    icon: MessageCircle,
    title: 'Chat follow-ups',
    description:
      'Message your doctor after the call for quick clarifications, at no extra cost.',
  },
  {
    icon: Pill,
    title: 'E-prescriptions',
    description:
      'Get a digital prescription instantly, sent to your profile and ready for any pharmacy.',
  },
  {
    icon: Zap,
    title: 'Auto-escalation',
    description:
      'A High risk Health Check skips the queue and connects you to the next available doctor.',
  },
]

export function TelemedicinePage() {
  const availableNow = doctors.filter((doctor) => doctor.availableToday)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-b from-primary-100 via-primary-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                Telemedicine
              </span>
              <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
                See a doctor in minutes, from wherever you are
              </h1>
              <p className="mt-4 text-base text-ink/70">
                No travel, no waiting room. Start with a Health Check or book a
                video consult directly with a specialist.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup" className="btn-raised">
                  Start a Health Check
                </Link>
                <Link
                  to="/appointments"
                  className="rounded-xl border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
                >
                  Book a consult
                </Link>
              </div>
            </div>

            <div className="card-raised p-6">
              <h3 className="text-sm font-semibold text-ink/70">
                Available for video consult now
              </h3>
              <div className="mt-4 space-y-3">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <ListRowSkeleton key={i} />
                    ))
                  : availableNow.map((doctor) => {
                      const clinic = clinics.find((c) => c.id === doctor.clinicId)
                      return (
                        <div
                          key={doctor.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="icon-badge h-11 w-11">
                              <UserRound className="h-5 w-5 text-primary-600" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {doctor.name}
                              </p>
                              <p className="text-xs text-ink/50">
                                {doctor.specialty} · {doctor.experienceYears} yrs
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                {doctor.rating} ({doctor.consults}) · ₹{doctor.fee}
                              </p>
                              <p className="text-[11px] text-ink/40">
                                {clinic?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                              Online
                            </span>
                            <Link
                              to="/appointments"
                              className="text-xs font-semibold text-primary-600 hover:underline"
                            >
                              Book →
                            </Link>
                          </div>
                        </div>
                      )
                    })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-xl font-bold text-ink">What's included</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => (
            <div key={item.title} className="card-raised p-5">
              <span className="icon-badge">
                <item.icon className="h-6 w-6 text-primary-600" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-ink/60">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <PoweredByStrip />
      </section>
    </div>
  )
}
