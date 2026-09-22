import { CalendarDays, CheckCircle2, Clock, Stethoscope, UsersRound, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type DoctorApplication, getMyDoctorApplication } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useFamilyStore } from '@/store/familyStore'
import { MyClinicsCard } from './MyClinicsCard'

const quickLinks = [
  { to: '/', icon: Stethoscope, title: 'New Health Check', description: 'Get a risk report in minutes' },
  { to: '/appointments', icon: CalendarDays, title: 'Book appointment', description: 'Pick a doctor and time slot' },
  { to: '/telemedicine', icon: Video, title: 'Start video consult', description: 'Talk to a doctor now' },
  { to: '/family', icon: UsersRound, title: 'Family profiles', description: 'Manage everyone in one place' },
]

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const members = useFamilyStore((state) => state.members)
  const [application, setApplication] = useState<DoctorApplication | null | undefined>(undefined)

  // Drives the "apply as a doctor" card below: undefined = still loading,
  // null = never applied, otherwise their pending/approved/rejected status.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    getMyDoctorApplication(token)
      .then((result) => {
        if (!cancelled) setApplication(result)
      })
      .catch(() => {
        if (!cancelled) setApplication(null)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">
        Welcome, {user?.name ?? 'there'}
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        Your health checks, appointments, and family profiles all in one
        place.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.to + link.title} to={link.to} className="card-raised p-5">
            <span className="icon-badge">
              <link.icon className="h-6 w-6 text-primary-600" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-ink">
              {link.title}
            </h3>
            <p className="mt-1 text-xs text-ink/60">{link.description}</p>
          </Link>
        ))}
      </div>

      {application !== undefined && <DoctorApplicationCard application={application} />}
      {application?.status === 'APPROVED' && <MyClinicsCard />}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Family</h2>
          <Link to="/family" className="text-sm font-semibold text-primary">
            Manage →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div key={member.id} className="card-raised p-4">
              <p className="text-sm font-semibold text-ink">{member.name}</p>
              <p className="text-xs text-ink/50">
                {member.relation} · {member.age} yrs
              </p>
              <p className="mt-2 text-xs text-ink/60">{member.lastCheck}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DoctorApplicationCard({ application }: { application: DoctorApplication | null }) {
  if (!application) {
    return (
      <Link
        to="/apply-doctor"
        className="card-raised mt-10 flex items-center gap-4 p-5 transition-colors hover:border-primary/40"
      >
        <span className="icon-badge">
          <Stethoscope className="h-6 w-6 text-primary-600" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Are you a doctor?</h3>
          <p className="mt-1 text-xs text-ink/60">
            Apply to join the Symptora network and offer telemedicine consultations.
          </p>
        </div>
      </Link>
    )
  }

  if (application.status === 'PENDING') {
    return (
      <div className="card-raised mt-10 flex items-center gap-4 p-5">
        <span className="icon-badge">
          <Clock className="h-6 w-6 text-primary-600" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Doctor application under review</h3>
          <p className="mt-1 text-xs text-ink/60">
            Our credentialing team is verifying your {application.specialization} license.
            We'll email you within 2–3 business days.
          </p>
        </div>
      </div>
    )
  }

  if (application.status === 'APPROVED') {
    return (
      <div className="card-raised mt-10 flex items-center gap-4 p-5">
        <span className="icon-badge">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">You're a verified doctor</h3>
          <p className="mt-1 text-xs text-ink/60">
            Your {application.specialization} profile is live on Symptora.
          </p>
        </div>
      </div>
    )
  }

  return null
}
