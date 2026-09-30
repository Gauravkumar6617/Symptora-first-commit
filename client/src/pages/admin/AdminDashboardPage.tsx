import {
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Mail,
  Stethoscope,
  TrendingUp,
  UsersRound,
  Video,
  XCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import {
  type AdminDoctor,
  type AvailabilitySlotPayload,
  ApiError,
  approveDoctorApplication,
  type DoctorApplication,
  fetchAdminDoctors,
  fetchAdminPatients,
  fetchAdminStats,
  listAdminBlogPosts,
  listAdminClinics,
  listAdminServices,
  listPendingDoctorApplications,
  rejectDoctorApplication,
  updateDoctorAdmin,
  type UserResponse,
} from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { AvailabilityGrid } from '@/components/AvailabilityGrid'
import { BlogsSection } from './BlogsSection'
import { ClinicsSection } from './ClinicsSection'
import { ServicesSection } from './ServicesSection'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinics', label: 'Clinics' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'services', label: 'Services' },
  { key: 'patients', label: 'Patients' },
  { key: 'blog', label: 'Blog' },
] as const
type TabKey = (typeof TABS)[number]['key']

// Shared by admin mutations to refresh whichever query their change touches.
const QK = {
  stats: ['admin-stats'],
  pending: ['admin-pending-applications'],
  doctors: ['admin-doctors'],
  patients: ['admin-patients'],
  clinics: ['admin-clinics'],
  services: ['admin-services'],
  blog: ['admin-blog-posts'],
} as const

export function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token)
  const adminName = useAuthStore((state) => state.user?.name ?? '')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('overview')

  const enabled = Boolean(token)
  const statsQuery = useQuery({ queryKey: QK.stats, queryFn: () => fetchAdminStats(token!), enabled })
  const pendingQuery = useQuery({ queryKey: QK.pending, queryFn: () => listPendingDoctorApplications(token!), enabled })
  const doctorsQuery = useQuery({ queryKey: QK.doctors, queryFn: () => fetchAdminDoctors(token!), enabled })
  const patientsQuery = useQuery({ queryKey: QK.patients, queryFn: () => fetchAdminPatients(token!), enabled })
  const clinicsQuery = useQuery({ queryKey: QK.clinics, queryFn: () => listAdminClinics(token!), enabled })
  const servicesQuery = useQuery({ queryKey: QK.services, queryFn: () => listAdminServices(token!), enabled })
  const blogQuery = useQuery({ queryKey: QK.blog, queryFn: () => listAdminBlogPosts(token!), enabled })

  const stats = statsQuery.data ?? null
  const pending = pendingQuery.data ?? []
  const doctors = doctorsQuery.data ?? []
  const patients = patientsQuery.data ?? []
  const clinics = clinicsQuery.data ?? []
  const services = servicesQuery.data ?? []
  const blogPosts = blogQuery.data ?? []

  async function handleApprove(id: string) {
    if (!token) return
    try {
      await approveDoctorApplication(token, id)
      await queryClient.invalidateQueries({ queryKey: QK.pending })
      await queryClient.invalidateQueries({ queryKey: QK.doctors })
      await queryClient.invalidateQueries({ queryKey: QK.stats })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve that application.')
    }
  }

  async function handleReject(id: string) {
    if (!token) return
    try {
      await rejectDoctorApplication(token, id)
      await queryClient.invalidateQueries({ queryKey: QK.pending })
      await queryClient.invalidateQueries({ queryKey: QK.stats })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject that application.')
    }
  }

  if (statsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm text-ink/50">Loading admin dashboard…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Admin dashboard</h1>
      <p className="mt-2 text-sm text-ink/60">
        Clinics, doctors, patients, and blog posts across Symptora.
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UsersRound} label="Patients" value={stats.patients} />
          <StatCard icon={Stethoscope} label="Doctors" value={stats.doctors} />
          <StatCard icon={Building2} label="Clinics" value={stats.clinics} />
          <StatCard icon={Clock} label="Pending applications" value={stats.pending_applications} />
          <StatCard icon={IndianRupee} label="Total earnings (telemedicine)" value={rupees(stats.total_earnings)} />
          <StatCard icon={TrendingUp} label="Earnings this month" value={rupees(stats.month_earnings)} />
          <StatCard icon={Video} label="Paid consultations" value={stats.paid_consultations} />
          <StatCard icon={Mail} label="Newsletter subscribers" value={stats.newsletter_subscribers} />
        </div>
      )}

      {tab === 'clinics' && (
        <ClinicsSection
          clinics={clinics}
          doctors={doctors}
          token={token}
          onChanged={async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: QK.clinics }),
              queryClient.invalidateQueries({ queryKey: QK.stats }),
              queryClient.invalidateQueries({ queryKey: QK.doctors }),
            ])
          }}
        />
      )}

      {tab === 'doctors' && (
        <>
          <PendingApplicationsSection
            pending={pending}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          <DoctorsSection
            doctors={doctors}
            token={token}
            onChanged={async () => {
              await queryClient.invalidateQueries({ queryKey: QK.doctors })
            }}
          />
        </>
      )}

      {tab === 'services' && (
        <ServicesSection
          services={services}
          token={token}
          onChanged={async () => {
            await queryClient.invalidateQueries({ queryKey: QK.services })
          }}
        />
      )}

      {tab === 'patients' && <PatientsSection patients={patients} />}

      {tab === 'blog' && (
        <BlogsSection
          posts={blogPosts}
          token={token}
          authorName={adminName}
          onChanged={async () => {
            await queryClient.invalidateQueries({ queryKey: QK.blog })
            // The public blog pages read through react-query too.
            await queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
          }}
        />
      )}
    </div>
  )
}

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound
  label: string
  value: number | string
}) {
  return (
    <div className="card-raised p-5">
      <span className="icon-badge">
        <Icon className="h-6 w-6 text-primary-600" />
      </span>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink/60">{label}</p>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink/60">{subtitle}</p>}
      </div>
    </div>
  )
}

function PendingApplicationsSection({
  pending,
  onApprove,
  onReject,
}: {
  pending: DoctorApplication[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  return (
    <>
      <SectionHeader
        title="Pending doctor applications"
        subtitle={`${pending.length} awaiting review`}
      />
      {pending.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">Nothing to review right now.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((application) => (
            <div
              key={application.id}
              className="card-raised flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{application.specialization}</p>
                <p className="mt-0.5 text-xs text-ink/60">
                  License {application.license_number} · user {application.user_id}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(application.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success hover:bg-success/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(application.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger/20"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function DoctorsSection({
  doctors,
  token,
  onChanged,
}: {
  doctors: AdminDoctor[]
  token: string | null
  onChanged: () => Promise<void>
}) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <>
      <SectionHeader title="Doctors" subtitle={`${doctors.length} approved`} />
      {doctors.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No approved doctors yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Clinics</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </p>
                    <p className="text-xs text-ink/50">{doctor.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{doctor.specialization}</td>
                  <td className="px-4 py-3 text-ink/80">{doctor.license_number}</td>
                  <td className="px-4 py-3 text-ink/80">
                    {doctor.clinics.length === 0
                      ? '—'
                      : doctor.clinics.map((c) => c.name).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(editing === doctor.id ? null : doctor.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {editing === doctor.id ? 'Close' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <DoctorEditForm
          key={editing}
          doctor={doctors.find((d) => d.id === editing)!}
          token={token}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onChanged()
          }}
        />
      )}
    </>
  )
}

const inputClass =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary'

/** Edit a doctor's contact info and weekly availability. */
function DoctorEditForm({
  doctor,
  token,
  onCancel,
  onSaved,
}: {
  doctor: AdminDoctor
  token: string | null
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [contactPersonName, setContactPersonName] = useState(doctor.contact_person_name ?? '')
  const [contactEmail, setContactEmail] = useState(doctor.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(doctor.contact_phone ?? '')
  const [maxPerDay, setMaxPerDay] = useState(doctor.max_appointments_per_day?.toString() ?? '')
  const [fee, setFee] = useState(doctor.fee?.toString() ?? '')
  const [yearsOfPractice, setYearsOfPractice] = useState(doctor.years_of_practice?.toString() ?? '')
  const [languages, setLanguages] = useState(doctor.languages ?? '')
  const [displayOrder, setDisplayOrder] = useState(doctor.display_order.toString())
  const [availability, setAvailability] = useState<AvailabilitySlotPayload[]>(
    doctor.availability_slots.map((s) => ({ days: s.days, slot: s.slot })),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError('')
    setSaving(true)
    try {
      await updateDoctorAdmin(token, doctor.id, {
        contact_person_name: contactPersonName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        max_appointments_per_day: maxPerDay.trim() ? Number(maxPerDay) : null,
        fee: fee.trim() ? Number(fee) : null,
        years_of_practice: yearsOfPractice.trim() ? Number(yearsOfPractice) : null,
        languages: languages.trim(),
        display_order: displayOrder.trim() ? Number(displayOrder) : 0,
        availability_slots: availability,
      })
      await onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised mt-4 space-y-3 p-5">
      <p className="text-sm font-semibold text-ink">
        Edit Dr. {doctor.first_name} {doctor.last_name}
      </p>
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
      <div>
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
        <label className="mt-3 block text-xs font-medium text-ink/60">
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
      <div className="grid gap-3 sm:grid-cols-3">
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
        <label className="text-xs font-medium text-ink/60">
          Display order
          <input
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
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

function PatientsSection({ patients }: { patients: UserResponse[] }) {
  return (
    <>
      <SectionHeader title="Patients" subtitle={`${patients.length} accounts`} />
      {patients.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No patients yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {patient.first_name} {patient.last_name}
                  </td>
                  <td className="px-4 py-3 text-ink/80">{patient.email}</td>
                  <td className="px-4 py-3 text-ink/80">{patient.number}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        patient.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-ink/10 text-ink/60'
                      }`}
                    >
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
