import { CalendarDays, Stethoscope, UsersRound, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFamilyStore } from '@/store/familyStore'

const quickLinks = [
  { to: '/', icon: Stethoscope, title: 'New Health Check', description: 'Get a risk report in minutes' },
  { to: '/appointments', icon: CalendarDays, title: 'Book appointment', description: 'Pick a doctor and time slot' },
  { to: '/telemedicine', icon: Video, title: 'Start video consult', description: 'Talk to a doctor now' },
  { to: '/family', icon: UsersRound, title: 'Family profiles', description: 'Manage everyone in one place' },
]

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const members = useFamilyStore((state) => state.members)

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
