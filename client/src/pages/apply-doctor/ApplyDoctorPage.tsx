import { CheckCircle2, ClipboardCheck, Clock, ShieldCheck, Video, XCircle } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import {
  ApiError,
  applyToBecomeDoctor,
  type DoctorApplication,
  getMyDoctorApplication,
} from '@/lib/api'
import { APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'

const specialties = [
  'General Physician',
  'Pediatrician',
  'Dermatologist',
  'Gynecologist',
  'ENT Specialist',
  'Psychiatrist',
  'Dentist',
  'Other',
]

const perks = [
  {
    icon: Video,
    text: 'Consult from anywhere over secure video, on your own schedule.',
  },
  {
    icon: ShieldCheck,
    text: 'Verified patient records on a Medplum FHIR backend.',
  },
  {
    icon: ClipboardCheck,
    text: 'We handle scheduling, reminders, and payments — you focus on care.',
  },
]

export function ApplyDoctorPage() {
  const token = useAuthStore((state) => state.token)
  const [specialization, setSpecialization] = useState(specialties[0])
  const [licenseNumber, setLicenseNumber] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [application, setApplication] = useState<DoctorApplication | null>(null)

  // Someone who has already applied (or is already approved) sees their
  // status instead of the form — the backend also rejects a second /promote.
  useEffect(() => {
    if (!token) {
      setLoadingStatus(false)
      return
    }
    let cancelled = false
    getMyDoctorApplication(token)
      .then((result) => {
        if (!cancelled) setApplication(result)
      })
      .catch(() => {
        // Best-effort: if the check fails, fall back to showing the form.
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) {
      setError('You need to be logged in to apply.')
      return
    }
    if (!licenseNumber.trim()) {
      setError('Please enter your medical license number.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const result = await applyToBecomeDoctor(token, {
        specialization,
        license_number: licenseNumber.trim(),
      })
      setApplication(result)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingStatus) {
    return (
      <AuthSplitLayout title="Apply as a doctor" subtitle="Checking your application status…">
        <div className="card-raised p-8 text-center text-sm text-ink/50">Loading…</div>
      </AuthSplitLayout>
    )
  }

  if (application) {
    return <ApplicationStatusCard application={application} />
  }

  return (
    <AuthSplitLayout
      title="Apply as a doctor"
      subtitle={`Join the ${APP_NAME} network and offer telemedicine consultations`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-ink">
            Specialization
          </label>
          <select
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <FormField
          id="licenseNumber"
          label="Medical license number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="e.g. MCI-123456"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-raised w-full" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        <div className="space-y-2 border-t border-ink/10 pt-4">
          {perks.map((perk) => (
            <div key={perk.text} className="flex items-start gap-2 text-xs text-ink/60">
              <perk.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
              {perk.text}
            </div>
          ))}
        </div>
      </form>
    </AuthSplitLayout>
  )
}

function ApplicationStatusCard({ application }: { application: DoctorApplication }) {
  if (application.status === 'APPROVED') {
    return (
      <AuthSplitLayout title="You're a verified doctor" subtitle="Your application was approved">
        <div className="card-raised flex flex-col items-center p-8 text-center">
          <span className="icon-badge h-14 w-14">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">You're all set</h2>
          <p className="mt-2 text-sm text-ink/60">
            Your {application.specialization} profile is live. Head back to your dashboard to
            manage availability and consultations.
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  if (application.status === 'REJECTED') {
    return (
      <AuthSplitLayout title="Application not approved" subtitle="Here's what happened">
        <div className="card-raised flex flex-col items-center p-8 text-center">
          <span className="icon-badge h-14 w-14">
            <XCircle className="h-7 w-7 text-danger" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">
            We couldn't verify this application
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Our credentialing team wasn't able to approve your license details. Contact support
            if you think this is a mistake.
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout title="Application received" subtitle="We're reviewing your details">
      <div className="card-raised flex flex-col items-center p-8 text-center">
        <span className="icon-badge h-14 w-14">
          <Clock className="h-7 w-7 text-primary-600" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">Under review</h2>
        <p className="mt-2 text-sm text-ink/60">
          Our credentialing team is verifying your {application.specialization} license (
          {application.license_number}). We'll email you within 2–3 business days.
        </p>
      </div>
    </AuthSplitLayout>
  )
}
