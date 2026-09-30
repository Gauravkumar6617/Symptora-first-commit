import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock, FileText, MessageCircle, Stethoscope, UsersRound, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type Appointment,
  ApiError,
  cancelAppointment,
  cancelConsultation,
  type DoctorApplication,
  getMyDoctorApplication,
  listChecks,
  listMyAppointments,
  listMyConsultations,
  listMyPrescriptions,
  type SymptomCheck,
  type TelemedicineConsultation,
} from '@/lib/api'
import { ChatFromLink, ChatThreadModal } from '@/components/telemedicine/ChatThreadModal'
import { PrescriptionPdfButton } from '@/components/telemedicine/PrescriptionPdfButton'
import { useAuthStore } from '@/store/authStore'
import { relationLabel, useFamilyStore } from '@/store/familyStore'
import { MyClinicsCard } from './MyClinicsCard'

const quickLinks = [
  { to: '/symptom-checker', icon: Stethoscope, title: 'Symptom checker', description: 'See what your symptoms may mean' },
  { to: '/appointments', icon: CalendarDays, title: 'Book appointment', description: 'Pick a doctor and time slot' },
  { to: '/telemedicine', icon: Video, title: 'Start video consult', description: 'Talk to a doctor now' },
  { to: '/family', icon: UsersRound, title: 'Family profiles', description: 'Manage everyone in one place' },
]

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const members = useFamilyStore((state) => state.members)
  const loadMembers = useFamilyStore((state) => state.loadMembers)

  const enabled = Boolean(token)
  const { data: checks = null } = useQuery({
    queryKey: ['my-checks'],
    queryFn: () => listChecks(token!),
    enabled,
  })
  // undefined = still loading, null = never applied, otherwise pending/approved/rejected.
  const { data: application } = useQuery({
    queryKey: ['my-doctor-application'],
    queryFn: () => getMyDoctorApplication(token!),
    enabled,
  })

  useEffect(() => {
    // Offline: the persisted list stays on screen.
    loadMembers().catch(() => {})
  }, [loadMembers])

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
      {application?.status === 'approved' && <MyClinicsCard />}

      <MyAppointmentsSection token={token} />

      <MyConsultationsSection token={token} />

      <MyPrescriptionsSection token={token} />
      <ChatFromLink />

      <RecentChecks checks={checks} />

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
                {relationLabel(member.relation)} · {member.age} yrs
              </p>
              <p className="mt-2 text-xs text-ink/60">
                {member.hasAccount ? 'Has their own login' : 'Managed by you'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const appointmentStatusBadge: Record<Appointment['status'], string> = {
  scheduled: 'bg-primary/10 text-primary',
  rescheduled: 'bg-warning/10 text-warning',
  cancelled: 'bg-ink/10 text-ink/50',
  completed: 'bg-success/10 text-success',
}

/** Your own upcoming and past bookings, with a cancel action while they're
 * still live. */
function MyAppointmentsSection({ token }: { token: string | null }) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)

  const { data: appointments = [] } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => listMyAppointments(token!),
    enabled: Boolean(token),
  })

  async function handleCancel(id: string) {
    if (!token) return
    if (!window.confirm('Cancel this appointment?')) return
    setError('')
    setCancelling(id)
    try {
      await cancelAppointment(token, id)
      await queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel that appointment.')
    } finally {
      setCancelling(null)
    }
  }

  if (appointments.length === 0) return null

  const sorted = [...appointments].sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">My appointments</h2>
        <Link to="/appointments" className="text-sm font-semibold text-primary">
          Book another →
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 space-y-3">
        {sorted.map((a) => (
          <div key={a.id} className="card-raised flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {a.doctor_name ?? 'Doctor'}
                {a.doctor_specialization ? ` · ${a.doctor_specialization}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-ink/60">
                {new Date(a.appointment_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                · {a.slot.toUpperCase()} · {a.clinic_name}
              </p>
              <p className="mt-1 text-xs text-ink/50">{a.reason}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${appointmentStatusBadge[a.status]}`}
              >
                {a.status}
              </span>
              {(a.status === 'scheduled' || a.status === 'rescheduled') && (
                <Link
                  to={`/call/appointment/${a.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Video className="h-3.5 w-3.5" /> Video call
                </Link>
              )}
              <button
                type="button"
                onClick={() => setChatId(a.id)}
                className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-primary"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Messages
              </button>
              {(a.status === 'scheduled' || a.status === 'rescheduled') && (
                <button
                  type="button"
                  onClick={() => handleCancel(a.id)}
                  disabled={cancelling === a.id}
                  className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
                >
                  {cancelling === a.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {chatId && token && user && (
        <ChatThreadModal
          kind="appointment"
          id={chatId}
          token={token}
          currentUserId={user.id}
          onClose={() => setChatId(null)}
        />
      )}
    </div>
  )
}

const consultationStatusBadge: Record<TelemedicineConsultation['status'], string> = {
  pending: 'bg-warning/10 text-warning',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-ink/10 text-ink/50',
}

/** Instant video consultations you've started, most recent first. */
function MyConsultationsSection({ token }: { token: string | null }) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)

  const { data: consultations = [] } = useQuery({
    queryKey: ['my-consultations'],
    queryFn: () => listMyConsultations(token!),
    enabled: Boolean(token),
    refetchInterval: 15000, // picks up "completed" once both sides leave the call
  })

  async function handleCancel(id: string) {
    if (!token) return
    setCancelling(id)
    try {
      await cancelConsultation(token, id)
      await queryClient.invalidateQueries({ queryKey: ['my-consultations'] })
    } finally {
      setCancelling(null)
    }
  }

  if (consultations.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-ink">My video consultations</h2>
      <div className="mt-4 space-y-3">
        {consultations.map((c) => (
          <div key={c.id} className="card-raised flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {c.doctor_name ?? (c.status === 'pending' ? 'Waiting for a doctor…' : 'Doctor')}
                {c.doctor_specialization ? ` · ${c.doctor_specialization}` : ''}
              </p>
              <p className="mt-1 text-xs text-ink/50">{c.reason}</p>
              <p className="mt-0.5 text-xs text-ink/40">{new Date(c.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${consultationStatusBadge[c.status]}`}
              >
                {c.status.replace('_', ' ')}
              </span>
              {c.status === 'in_progress' && (
                <Link
                  to={`/call/telemedicine/${c.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Video className="h-3.5 w-3.5" /> Rejoin
                </Link>
              )}
              {c.status === 'pending' && (
                <Link
                  to={`/telemedicine/waiting/${c.id}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {c.paid_at ? 'View' : `Pay ₹${c.amount ?? ''}`}
                </Link>
              )}
              {c.status !== 'pending' && (
                <button
                  type="button"
                  onClick={() => setChatId(c.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-primary"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Messages
                </button>
              )}
              {c.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleCancel(c.id)}
                  disabled={cancelling === c.id}
                  className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
                >
                  {cancelling === c.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {chatId && token && user && (
        <ChatThreadModal
          kind="telemedicine"
          id={chatId}
          token={token}
          currentUserId={user.id}
          onClose={() => setChatId(null)}
        />
      )}
    </div>
  )
}

/** E-prescriptions your doctors have issued, most recent first. */
function MyPrescriptionsSection({ token }: { token: string | null }) {
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: () => listMyPrescriptions(token!),
    enabled: Boolean(token),
  })

  if (prescriptions.length === 0) return null

  return (
    <div id="prescriptions" className="mt-10 scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <FileText className="h-5 w-5 text-primary-600" /> Prescriptions
      </h2>
      <div className="mt-4 space-y-3">
        {prescriptions.map((p) => (
          <div key={p.id} className="card-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {p.doctor_name ?? 'Doctor'}
                {p.doctor_specialization ? ` · ${p.doctor_specialization}` : ''}
              </p>
              <p className="text-xs text-ink/40">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {p.medications.map((med, i) => (
                <li key={i} className="text-sm text-ink/80">
                  <span className="font-semibold text-ink">{med.name}</span> — {med.dosage}, {med.frequency},{' '}
                  {med.duration}
                  {med.instructions && <span className="text-ink/50"> ({med.instructions})</span>}
                </li>
              ))}
            </ul>
            {p.notes && <p className="mt-2 text-xs italic text-ink/50">{p.notes}</p>}
            <div className="mt-3 flex items-center justify-between gap-3">
              <PrescriptionPdfButton token={token} id={p.id} />
              {p.synced_to_medplum && (
                <p className="text-[11px] font-medium text-success">Synced to your Medplum record</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const urgencyBadge: Record<SymptomCheck['urgency'], string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger',
}

/** Latest checks you ran, ran for family, or family ran about you (shared both ways). */
function RecentChecks({ checks }: { checks: SymptomCheck[] | null }) {
  if (checks === null) return null
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Recent health checks</h2>
        <Link to="/symptom-checker" className="text-sm font-semibold text-primary">
          New check →
        </Link>
      </div>
      {checks.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">
          No checks yet. Run the symptom checker for yourself or a family member and it will show up here.
        </p>
      ) : (
        <ul className="card-raised mt-4 divide-y divide-ink/10">
          {checks.slice(0, 6).map((check) => (
            <li key={check.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${urgencyBadge[check.urgency]}`}>
                {check.urgency}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {check.predictions[0]?.label ?? 'Symptom check'}
                  <span className="font-normal text-ink/50">
                    {' '}· for {check.about_me ? 'you' : check.subject_name}
                  </span>
                </p>
                <p className="truncate text-xs text-ink/50">
                  {check.symptoms.map((s) => s.label).join(', ')}
                  {!check.is_mine && ` · run by ${check.run_by_name}`}
                </p>
              </div>
              <span className="text-xs text-ink/40">{new Date(check.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
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

  if (application.status === 'pending') {
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

  if (application.status === 'approved') {
    return (
      <Link
        to="/doctor/dashboard"
        className="card-raised mt-10 flex items-center gap-4 p-5 transition-colors hover:border-primary/40"
      >
        <span className="icon-badge">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">You're a verified doctor</h3>
          <p className="mt-1 text-xs text-ink/60">
            Your {application.specialization} profile is live on Symptora — open your doctor
            dashboard for appointments and profile settings.
          </p>
        </div>
      </Link>
    )
  }

  return null
}
