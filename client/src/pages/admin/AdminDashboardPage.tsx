import {
  Building2,
  CheckCircle2,
  Clock,
  PlusCircle,
  Stethoscope,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import {
  type AdminDoctor,
  type AdminStats,
  ApiError,
  approveDoctorApplication,
  type Clinic,
  createClinic,
  type DoctorApplication,
  fetchAdminDoctors,
  fetchAdminPatients,
  fetchAdminStats,
  listClinics,
  listPendingDoctorApplications,
  rejectDoctorApplication,
  type UserResponse,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pending, setPending] = useState<DoctorApplication[]>([])
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [patients, setPatients] = useState<UserResponse[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll(authToken: string) {
    const [statsRes, pendingRes, doctorsRes, patientsRes, clinicsRes] = await Promise.all([
      fetchAdminStats(authToken),
      listPendingDoctorApplications(authToken),
      fetchAdminDoctors(authToken),
      fetchAdminPatients(authToken),
      listClinics(authToken),
    ])
    setStats(statsRes)
    setPending(pendingRes)
    setDoctors(doctorsRes)
    setPatients(patientsRes)
    setClinics(clinicsRes)
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    loadAll(token)
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load the admin dashboard.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleApprove(id: string) {
    if (!token) return
    try {
      await approveDoctorApplication(token, id)
      await loadAll(token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve that application.')
    }
  }

  async function handleReject(id: string) {
    if (!token) return
    try {
      await rejectDoctorApplication(token, id)
      await loadAll(token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject that application.')
    }
  }

  if (loading) {
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
        Clinics, doctors, and patients across Symptora.
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UsersRound} label="Patients" value={stats.patients} />
          <StatCard icon={Stethoscope} label="Doctors" value={stats.doctors} />
          <StatCard icon={Building2} label="Clinics" value={stats.clinics} />
          <StatCard icon={Clock} label="Pending applications" value={stats.pending_applications} />
        </div>
      )}

      <PendingApplicationsSection
        pending={pending}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ClinicsSection
        clinics={clinics}
        token={token}
        onCreated={(clinic) => setClinics((prev) => [...prev, clinic])}
      />

      <DoctorsSection doctors={doctors} />

      <PatientsSection patients={patients} />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound
  label: string
  value: number
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

function ClinicsSection({
  clinics,
  token,
  onCreated,
}: {
  clinics: Clinic[]
  token: string | null
  onCreated: (clinic: Clinic) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [picture, setPicture] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token || !name.trim() || !picture.trim()) {
      setFormError('Name and picture URL are required.')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      const clinic = await createClinic(token, {
        name: name.trim(),
        picture: picture.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      })
      onCreated(clinic)
      setName('')
      setPicture('')
      setAddress('')
      setPhone('')
      setDescription('')
      setFormOpen(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create that clinic.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mt-10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Clinics</h2>
          <p className="mt-0.5 text-xs text-ink/60">{clinics.length} total</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <PlusCircle className="h-4 w-4" />
          {formOpen ? 'Cancel' : 'Add clinic'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="card-raised mt-4 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clinic name"
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={picture}
              onChange={(e) => setPicture(e.target.value)}
              placeholder="Picture URL"
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address (optional)"
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create clinic'}
          </button>
        </form>
      )}

      {clinics.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No clinics yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="card-raised p-4">
              <p className="text-sm font-semibold text-ink">{clinic.name}</p>
              {clinic.address && <p className="mt-1 text-xs text-ink/60">{clinic.address}</p>}
              {clinic.phone && <p className="mt-0.5 text-xs text-ink/50">{clinic.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function DoctorsSection({ doctors }: { doctors: AdminDoctor[] }) {
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
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
