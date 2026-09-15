import { CheckCircle2, ClipboardCheck, ShieldCheck, Video } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { APP_NAME } from '@/lib/constants'

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
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialization, setSpecialization] = useState(specialties[0])
  const [licenseNumber, setLicenseNumber] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [licenseDoc, setLicenseDoc] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!fullName || !email || !phone || !licenseNumber || !experienceYears) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    // TODO: submit to a real doctor-application endpoint (creates a DoctorProfile pending review)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthSplitLayout
        title="Application received"
        subtitle="We'll review your details and get back to you"
      >
        <div className="card-raised flex flex-col items-center p-8 text-center">
          <span className="icon-badge h-14 w-14">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">Thanks, {fullName.split(' ')[0]}!</h2>
          <p className="mt-2 text-sm text-ink/60">
            Our credentialing team verifies your license and will email{' '}
            {email} within 2–3 business days with next steps.
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout
      title="Apply as a doctor"
      subtitle={`Join the ${APP_NAME} network and offer telemedicine consultations`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AvatarUpload
          value={licenseDoc}
          onChange={setLicenseDoc}
          label="Medical license / ID proof (optional)"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Jane Doe"
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="phone"
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FormField
            id="experience"
            label="Years of experience"
            type="number"
            min={0}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink">
            Anything else we should know?{' '}
            <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-raised w-full">
          Submit application
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
