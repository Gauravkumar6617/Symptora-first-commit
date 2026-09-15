import { HeartPulse, ShieldCheck, Sparkles, Target, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroIllustration } from '@/components/marketing/HeroIllustration'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const values = [
  {
    icon: Target,
    title: 'Clarity over panic',
    description:
      'We turn "I don\'t feel well" into a clear next step — self-care, a routine visit, or a doctor right now.',
  },
  {
    icon: Users,
    title: 'Built for the whole family',
    description:
      'Parents, kids, grandparents — one account should be able to look after everyone, not just one person.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by default',
    description:
      'Health records are sensitive. Everything is encrypted and stored on a Medplum FHIR backend built for healthcare data.',
  },
  {
    icon: Sparkles,
    title: 'Speed when it matters',
    description:
      'A High risk result should never sit in a queue — auto-escalation connects you to a doctor in minutes.',
  },
]

const stats = [
  { value: '25k+', label: 'Health checks run' },
  { value: '40+', label: 'Partner clinics' },
  { value: '120+', label: 'Verified doctors' },
  { value: '4.8/5', label: 'Average rating' },
]

export function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-100 via-primary-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                About {APP_NAME}
              </span>
              <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
                Healthcare shouldn't start with a guessing game
              </h1>
              <p className="mt-4 text-base text-ink/70">
                {APP_NAME} was built to close the gap between "something feels
                off" and "I'm talking to a doctor" — with a quick risk
                assessment, family profiles, and telemedicine that connects
                you automatically when it's serious. {APP_TAGLINE}
              </p>
            </div>
            <div className="mx-auto w-full max-w-md">
              <HeroIllustration />
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-raised px-4 py-5 text-center">
                <p className="text-xl font-bold text-primary-700 sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-ink/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-ink">Our story</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              We kept seeing the same pattern: people either ignored serious
              symptoms because they didn't want to "make a fuss," or panicked
              over minor issues and ended up in an ER waiting room for hours.
              Neither outcome is good for patients or for a healthcare system
              already stretched thin. {APP_NAME} exists to close that gap — a
              single place to check symptoms, understand the risk, and get
              matched to the right kind of care immediately, for you and the
              people you look after.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="card-raised p-5">
                <span className="icon-badge">
                  <value.icon className="h-6 w-6 text-primary-600" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-ink/60">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="card-raised flex flex-col items-center gap-4 bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-bold">Are you a practicing doctor?</h2>
            <p className="mt-2 text-sm text-white/85">
              Join {APP_NAME} and offer telemedicine consultations to
              patients who need you most.
            </p>
          </div>
          <Link
            to="/apply-doctor"
            className="whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-white/90"
          >
            Apply as a doctor
          </Link>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <HeartPulse className="mx-auto h-8 w-8 text-primary-600" />
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink/60">
            Have questions about {APP_NAME}, partnerships, or press? We'd
            love to hear from you.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-block rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  )
}
