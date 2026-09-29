import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, FileText, Mail, MessageCircle, Phone, PhoneIncoming, Stethoscope, User, Video } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  type Appointment,
  type AvailabilitySlotPayload,
  ApiError,
  acceptConsultation,
  cancelAppointment,
  type DoctorApplication,
  getMyDoctorApplication,
  listMyHandledConsultations,
  listMyIssuedPrescriptions,
  listMyPatientAppointments,
  listPendingConsultations,
  type TelemedicineConsultation,
  telemedicineDoctorSocketUrl,
  updateMyDoctorProfile,
} from '@/lib/api'
import { AvailabilityGrid } from '@/components/AvailabilityGrid'
import { ChatThreadModal } from '@/components/telemedicine/ChatThreadModal'
import { PrescriptionFormModal } from '@/components/telemedicine/PrescriptionFormModal'
import { useAuthStore } from '@/store/authStore'

const inputClass =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary'

const statusBadge: Record<Appointment['status'], string> = {
  scheduled: 'bg-primary/10 text-primary',
  rescheduled: 'bg-warning/10 text-warning',
  cancelled: 'bg-ink/10 text-ink/50',
  completed: 'bg-success/10 text-success',
}

export function DoctorDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  // Only approved doctors get this page; everyone else is sent back.
  if (!user?.isDoctor) return <Navigate to="/dashboard" replace />

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Doctor dashboard</h1>
      <p className="mt-2 text-sm text-ink/60">
        Your appointments and consultation profile.
      </p>

      <InstantConsultationSection token={token} />
      <MyAppointmentsSection token={token} />
      <ConsultationHistorySection token={token} />
      <IssuedPrescriptionsSection token={token} />
      <MyProfileSection token={token} />
    </div>
  )
}

/** Live queue of instant, patient-started consultations — connects to the
 * doctor notification socket only once the doctor's application is approved;
 * staying connected is what makes them "available" for these. */
function InstantConsultationSection({ token }: { token: string | null }) {
  const navigate = useNavigate()
  const { data: profile } = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => getMyDoctorApplication(token!),
    enabled: Boolean(token),
  })
  const approved = profile?.status === 'approved'

  const [pending, setPending] = useState<TelemedicineConsultation[]>([])
  const [accepting, setAccepting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token || !approved) return
    let cancelled = false

    listPendingConsultations(token)
      .then((list) => !cancelled && setPending(list))
      .catch(() => {})

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    const ws = new WebSocket(telemedicineDoctorSocketUrl(token))
    wsRef.current = ws
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'new-consultation') {
        const consultation = message.consultation as TelemedicineConsultation
        setPending((current) => [...current.filter((c) => c.id !== consultation.id), consultation])
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New instant consultation request', {
            body: consultation.reason,
          })
        }
      }
      if (message.type === 'removed') {
        setPending((current) => current.filter((c) => c.id !== message.id))
      }
    }

    return () => {
      cancelled = true
      ws.close()
    }
  }, [token, approved])

  async function handleAccept(id: string) {
    if (!token) return
    setError('')
    setAccepting(id)
    try {
      await acceptConsultation(token, id)
      navigate(`/call/telemedicine/${id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept — it may already be taken.')
      setPending((current) => current.filter((c) => c.id !== id))
      setAccepting(null)
    }
  }

  if (!approved || pending.length === 0) return null

  const sorted = [...pending].sort((a, b) =>
    a.trigger === b.trigger ? 0 : a.trigger === 'auto_escalation' ? -1 : 1,
  )

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <PhoneIncoming className="h-5 w-5 text-primary-600" /> Instant consultation requests
      </h2>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 space-y-3">
        {sorted.map((c) => (
          <div
            key={c.id}
            className={`card-raised flex flex-wrap items-center justify-between gap-3 p-4 ${
              c.trigger === 'auto_escalation' ? 'border border-danger/40' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <User className="h-3.5 w-3.5 shrink-0" /> {c.patient_name ?? 'Patient'}
                {c.trigger === 'auto_escalation' && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">
                    Urgent
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-ink/70">{c.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAccept(c.id)}
              disabled={accepting === c.id}
              className="btn-raised inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Video className="h-4 w-4" /> {accepting === c.id ? 'Connecting…' : 'Accept'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const consultationStatusBadge: Record<TelemedicineConsultation['status'], string> = {
  pending: 'bg-warning/10 text-warning',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-ink/10 text-ink/50',
}

/** Instant consultations this doctor has accepted, most recent first. */
function ConsultationHistorySection({ token }: { token: string | null }) {
  const user = useAuthStore((state) => state.user)
  const { data: consultations = [] } = useQuery({
    queryKey: ['my-handled-consultations'],
    queryFn: () => listMyHandledConsultations(token!),
    enabled: Boolean(token),
  })
  const [chatId, setChatId] = useState<string | null>(null)
  const [prescribeId, setPrescribeId] = useState<string | null>(null)

  if (consultations.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-ink">Consultation history</h2>
      <div className="mt-4 space-y-3">
        {consultations.map((c) => (
          <div key={c.id} className="card-raised flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <User className="h-3.5 w-3.5 shrink-0" /> {c.patient_name ?? 'Patient'}
              </p>
              <p className="mt-1 text-xs text-ink/70">{c.reason}</p>
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
              <button
                type="button"
                onClick={() => setChatId(c.id)}
                className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-primary"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Messages
              </button>
              {(c.status === 'in_progress' || c.status === 'completed') && (
                <button
                  type="button"
                  onClick={() => setPrescribeId(c.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-primary"
                >
                  <Stethoscope className="h-3.5 w-3.5" /> Prescribe
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
      {prescribeId && token && (
        <PrescriptionFormModal
          kind="telemedicine"
          id={prescribeId}
          token={token}
          onClose={() => setPrescribeId(null)}
          onIssued={() => setPrescribeId(null)}
        />
      )}
    </div>
  )
}

function MyAppointmentsSection({ token }: { token: string | null }) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [prescribeId, setPrescribeId] = useState<string | null>(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-patient-appointments'],
    queryFn: () => listMyPatientAppointments(token!),
    enabled: Boolean(token),
  })

  async function handleCancel(id: string) {
    if (!token) return
    if (!window.confirm('Cancel this appointment?')) return
    setError('')
    setCancelling(id)
    try {
      await cancelAppointment(token, id)
      await queryClient.invalidateQueries({ queryKey: ['my-patient-appointments'] })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel that appointment.')
    } finally {
      setCancelling(null)
    }
  }

  const sorted = [...appointments].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-ink">Appointments</h2>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {isLoading ? (
        <p className="mt-4 text-sm text-ink/50">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No appointments booked with you yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((a) => (
            <div key={a.id} className="card-raised flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <User className="h-3.5 w-3.5 shrink-0" /> {a.patient_name}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(a.appointment_date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {a.slot.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {a.patient_phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {a.patient_email}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink/70">
                  <span className="font-semibold text-ink">Reason:</span> {a.reason}
                  {a.notes && <span className="text-ink/50"> · {a.notes}</span>}
                </p>
                {a.fee != null && <p className="mt-1 text-xs text-ink/50">Fee: {a.fee}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[a.status]}`}>
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
                {a.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setPrescribeId(a.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-primary"
                  >
                    <Stethoscope className="h-3.5 w-3.5" /> Prescribe
                  </button>
                )}
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
      )}

      {chatId && token && user && (
        <ChatThreadModal
          kind="appointment"
          id={chatId}
          token={token}
          currentUserId={user.id}
          onClose={() => setChatId(null)}
        />
      )}
      {prescribeId && token && (
        <PrescriptionFormModal
          kind="appointment"
          id={prescribeId}
          token={token}
          onClose={() => setPrescribeId(null)}
          onIssued={() => setPrescribeId(null)}
        />
      )}
    </div>
  )
}

/** Prescriptions this doctor has issued, most recent first. */
function IssuedPrescriptionsSection({ token }: { token: string | null }) {
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['my-issued-prescriptions'],
    queryFn: () => listMyIssuedPrescriptions(token!),
    enabled: Boolean(token),
  })

  if (prescriptions.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <FileText className="h-5 w-5 text-primary-600" /> Prescriptions issued
      </h2>
      <div className="mt-4 space-y-3">
        {prescriptions.map((p) => (
          <div key={p.id} className="card-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <User className="h-3.5 w-3.5 shrink-0" /> {p.patient_name ?? 'Patient'}
              </p>
              <p className="text-xs text-ink/40">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {p.medications.map((med, i) => (
                <li key={i} className="text-sm text-ink/80">
                  <span className="font-semibold text-ink">{med.name}</span> — {med.dosage}, {med.frequency},{' '}
                  {med.duration}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyProfileSection({ token }: { token: string | null }) {
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => getMyDoctorApplication(token!),
    enabled: Boolean(token),
  })

  if (isLoading || !profile) {
    return (
      <div className="mt-10">
        <h2 className="text-lg font-bold text-ink">My profile</h2>
        <p className="mt-4 text-sm text-ink/50">Loading…</p>
      </div>
    )
  }

  return <ProfileForm key={profile.id} token={token} profile={profile} onSaved={async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] })
  }} />
}

function ProfileForm({
  token,
  profile,
  onSaved,
}: {
  token: string | null
  profile: DoctorApplication
  onSaved: () => Promise<void>
}) {
  const [contactPersonName, setContactPersonName] = useState(profile.contact_person_name ?? '')
  const [contactEmail, setContactEmail] = useState(profile.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(profile.contact_phone ?? '')
  const [maxPerDay, setMaxPerDay] = useState(profile.max_appointments_per_day?.toString() ?? '')
  const [fee, setFee] = useState(profile.fee?.toString() ?? '')
  const [yearsOfPractice, setYearsOfPractice] = useState(profile.years_of_practice?.toString() ?? '')
  const [languages, setLanguages] = useState(profile.languages ?? '')
  const [availability, setAvailability] = useState<AvailabilitySlotPayload[]>(
    profile.availability_slots.map((s) => ({ days: s.days, slot: s.slot })),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await updateMyDoctorProfile(token, {
        contact_person_name: contactPersonName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        max_appointments_per_day: maxPerDay.trim() ? Number(maxPerDay) : null,
        fee: fee.trim() ? Number(fee) : null,
        years_of_practice: yearsOfPractice.trim() ? Number(yearsOfPractice) : null,
        languages: languages.trim(),
        availability_slots: availability,
      })
      setSaved(true)
      await onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-3">
      <h2 className="text-lg font-bold text-ink">My profile</h2>
      <p className="text-xs text-ink/50">
        {profile.specialization} · License {profile.license_number} — contact admin to change these.
      </p>
      <div className="card-raised space-y-3 p-5">
        <AvailabilityGrid slots={availability} onChange={setAvailability} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
            placeholder="Contact person name"
            maxLength={100}
            className={inputClass}
          />
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Contact email"
            maxLength={120}
            className={inputClass}
          />
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Contact phone"
            maxLength={30}
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-ink/60">
            Max appointments per day
            <input
              type="number"
              min={1}
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(e.target.value)}
              placeholder="No limit"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs font-medium text-ink/60">
            Consultation fee
            <input
              type="number"
              min={0}
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="No fee set"
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-ink/60">
            Years of practice
            <input
              type="number"
              min={0}
              value={yearsOfPractice}
              onChange={(e) => setYearsOfPractice(e.target.value)}
              placeholder="e.g. 8"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs font-medium text-ink/60">
            Languages
            <input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g. English, Hindi"
              maxLength={255}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && !error && <p className="text-sm text-success">Saved.</p>}
        <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
