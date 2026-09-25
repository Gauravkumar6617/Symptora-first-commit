import {
  Building2,
  CheckCircle2,
  Clock,
  Stethoscope,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  type AdminClinic,
  type AdminDoctor,
  type AdminStats,
  ApiError,
  type BlogPost,
  approveDoctorApplication,
  type DoctorApplication,
  fetchAdminDoctors,
  fetchAdminPatients,
  fetchAdminStats,
  listAdminBlogPosts,
  listAdminClinics,
  listPendingDoctorApplications,
  rejectDoctorApplication,
  type UserResponse,
} from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { BlogsSection } from './BlogsSection'
import { ClinicsSection } from './ClinicsSection'

export function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token)
  const adminName = useAuthStore((state) => state.user?.name ?? '')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pending, setPending] = useState<DoctorApplication[]>([])
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [patients, setPatients] = useState<UserResponse[]>([])
  const [clinics, setClinics] = useState<AdminClinic[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll(authToken: string) {
    const [statsRes, pendingRes, doctorsRes, patientsRes, clinicsRes, blogRes] = await Promise.all([
      fetchAdminStats(authToken),
      listPendingDoctorApplications(authToken),
      fetchAdminDoctors(authToken),
      fetchAdminPatients(authToken),
      listAdminClinics(authToken),
      listAdminBlogPosts(authToken),
    ])
    setStats(statsRes)
    setPending(pendingRes)
    setDoctors(doctorsRes)
    setPatients(patientsRes)
    setClinics(clinicsRes)
    setBlogPosts(blogRes)
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
        Clinics, doctors, patients, and blog posts across Symptora.
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
        onChanged={async () => {
          if (!token) return
          const [clinicsRes, statsRes] = await Promise.all([listAdminClinics(token), fetchAdminStats(token)])
          setClinics(clinicsRes)
          setStats(statsRes)
        }}
      />

      <BlogsSection
        posts={blogPosts}
        token={token}
        authorName={adminName}
        onChanged={async () => {
          if (!token) return
          setBlogPosts(await listAdminBlogPosts(token))
          // The public blog pages read through react-query.
          await queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
        }}
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
