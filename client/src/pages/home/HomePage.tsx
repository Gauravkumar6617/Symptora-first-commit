import {
  CalendarDays,
  Camera,
  ImagePlus,
  MessageCircle,
  Pill,
  Search,
  Stethoscope,
  UserRound,
  UsersRound,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import { FaqSection } from '@/components/marketing/FaqSection'
import { FinalCta } from '@/components/marketing/FinalCta'
import { HeroIllustration } from '@/components/marketing/HeroIllustration'
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup'
import { PoweredByStrip } from '@/components/marketing/PoweredByStrip'
import { Testimonials } from '@/components/marketing/Testimonials'
import { WhyChooseUs } from '@/components/marketing/WhyChooseUs'
import { SpecialtyThumbnail } from '@/components/specialties/SpecialtyThumbnail'
import { useBlogPosts } from '@/hooks/useBlogPosts'
import { useDirectory } from '@/hooks/useDirectory'
import { specialties } from '@/data/specialties'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const steps = [
  {
    title: 'Do a Health Check',
    description:
      'Tell us your symptoms and vitals. It takes about two minutes.',
  },
  {
    title: 'Get your risk report',
    description:
      'Our triage engine scores you Low, Medium, or High risk with a clear explanation.',
  },
  {
    title: 'Talk to a doctor if needed',
    description:
      'High risk auto-connects you to telemedicine. Low/Medium gets self-care tips or a normal booking.',
  },
]

const telemedicineFeatures = [
  { icon: Video, title: 'Video consults', description: 'Face-to-face with a doctor, no app install.' },
  { icon: MessageCircle, title: 'Chat follow-ups', description: 'Ask quick questions after your visit.' },
  { icon: Pill, title: 'E-prescriptions', description: 'Digital prescriptions, ready at any pharmacy.' },
  { icon: Zap, title: 'Auto-escalation', description: 'High risk skips the queue automatically.' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { data: blogPosts = [] } = useBlogPosts()
  const { clinics, doctors } = useDirectory()
  const [query, setQuery] = useState('')
  const [symptomPhoto, setSymptomPhoto] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    const text = query.trim()
    navigate(text ? `/symptom-checker?q=${encodeURIComponent(text)}` : '/symptom-checker')
  }

  function handlePhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSymptomPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-100 via-primary-50 to-transparent">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-200/60 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 top-40 h-56 w-56 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {APP_NAME} · {APP_TAGLINE}
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                Your symptoms, decoded.{' '}
                <span className="text-primary-600">In minutes, not worry.</span>
              </h1>
              <p className="mt-4 text-base text-ink/70 sm:text-lg">
                Quick health checks, risk-based reports, and instant doctor
                access when it's serious — for you and your whole family.
              </p>

              <form
                onSubmit={handleSearch}
                className="card-raised mt-8 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2"
              >
                <div className="pill-well flex flex-1 items-center gap-2 px-4 py-3">
                  <Search className="h-4 w-4 text-ink/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search symptoms, e.g. fever, headache..."
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
                  />
                </div>
                <button type="submit" className="btn-raised sm:px-6">
                  Start Health Check
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                <span>Popular:</span>
                {['Fever', 'Cough & cold', 'Stomach pain', 'Skin rash'].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1 hover:border-primary/40 hover:text-primary"
                    >
                      {tag}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <HeroIllustration />

              {doctors[0] && (
              <div className="card-raised absolute -left-4 top-6 flex items-center gap-2 px-3 py-2 sm:-left-8">
                <span className="icon-badge h-9 w-9">
                  <Stethoscope className="h-4 w-4 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink">{doctors[0].name}</p>
                  <p className="text-[11px] text-ink/60">{doctors[0].specialization}</p>
                </div>
              </div>
              )}

            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-md grid-cols-2 gap-4">
            {[
              { value: clinics.length, label: 'Partner clinics' },
              { value: doctors.length, label: 'Verified doctors' },
            ].map((stat) => (
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

      {/* Specialty grid */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-bold text-ink">Consult top doctors online</h2>
        <p className="mt-1 text-sm text-ink/60">
          For any health concern, connect with a specialist in minutes.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {specialties.map((item) => (
            <Link
              key={item.slug}
              to={`/specialties/${item.slug}`}
              className="card-raised flex flex-col overflow-hidden text-left"
            >
              <SpecialtyThumbnail specialty={item} className="h-28" />
              <div className="p-4">
                <span className="text-sm font-semibold text-ink">
                  {item.label}
                </span>
                <p className="mt-1 text-xs text-ink/60">
                  {item.shortDescription}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="card-raised mt-6 flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            {symptomPhoto ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                <img
                  src={symptomPhoto}
                  alt="Uploaded symptom"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSymptomPhoto(null)}
                  className="absolute right-1 top-1 rounded-full bg-ink/70 p-0.5 text-white"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="icon-badge h-16 w-16 shrink-0">
                <Camera className="h-6 w-6 text-primary-600" />
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-ink">
                Have a rash, swelling, or visible symptom?
              </p>
              <p className="mt-0.5 text-xs text-ink/60">
                Upload a photo and your doctor can review it before or during
                your consult.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              <ImagePlus className="h-4 w-4" />
              {symptomPhoto ? 'Replace photo' : 'Upload photo'}
            </button>
            <Link
              to="/symptom-checker"
              className="btn-raised whitespace-nowrap px-4 py-2.5"
            >
              Start Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-ink">How {APP_NAME} works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="card-raised p-5">
                <span className="icon-badge text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telemedicine section */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              Telemedicine
            </span>
            <h2 className="mt-3 text-2xl font-bold text-ink">
              See a doctor without leaving home
            </h2>
            <p className="mt-3 text-sm text-ink/60">
              Video consults, chat follow-ups, and e-prescriptions — all
              inside your {APP_NAME} account. High-risk Health Checks connect
              you automatically.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {telemedicineFeatures.map((feature) => (
                <div key={feature.title} className="card-raised p-4">
                  <feature.icon className="h-5 w-5 text-primary-600" />
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/telemedicine" className="btn-raised mt-6 inline-block">
              Explore telemedicine
            </Link>
          </div>

          <div className="card-raised p-6">
            <h3 className="text-sm font-semibold text-ink/70">
              Our doctors
            </h3>
            <div className="mt-4 space-y-3">
              {doctors
                .slice(0, 4)
                .map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="icon-badge h-11 w-11">
                        <UserRound className="h-5 w-5 text-primary-600" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-ink/50">
                          {doctor.specialization}{doctor.years_of_practice ? ` · ${doctor.years_of_practice} yrs` : ''}
                        </p>
                        {doctor.fee != null && (
                          <p className="mt-0.5 text-xs text-ink/50">₹{doctor.fee}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Link
                        to="/telemedicine"
                        className="text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Consult →
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Family + Appointments strip */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/family"
              className="card-raised bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white"
            >
              <UsersRound className="h-6 w-6" />
              <h3 className="mt-3 text-lg font-bold">Family profiles</h3>
              <p className="mt-2 text-sm text-white/85">
                Link parents, kids, or anyone you manage healthcare for.
                Their checks and appointments live under your account.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold underline">
                Link a family member →
              </span>
            </Link>
            <Link
              to="/appointments"
              className="card-raised bg-gradient-to-br from-secondary to-teal p-6 text-white"
            >
              <CalendarDays className="h-6 w-6" />
              <h3 className="mt-3 text-lg font-bold">Book appointments</h3>
              <p className="mt-2 text-sm text-white/85">
                Browse doctors by specialty, pick a time slot, and confirm
                instantly — for yourself or anyone in your family.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold underline">
                Book now →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <WhyChooseUs />

      {/* Clinics teaser */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">
              Partner clinics near you
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              For in-person visits, lab tests, and vaccinations.
            </p>
          </div>
          <Link to="/clinics" className="text-sm font-semibold text-primary">
            See all clinics →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clinics.slice(0, 4).map((clinic) => (
            <div key={clinic.id} className="card-raised p-5">
              <h3 className="text-sm font-semibold text-ink">{clinic.name}</h3>
              {clinic.address && <p className="mt-1 text-xs text-ink/50">{clinic.address}</p>}
              {clinic.opening_hours && (
                <p className="mt-3 text-xs text-ink/60">{clinic.opening_hours}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Blog teaser */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">From the health blog</h2>
            <Link to="/blog" className="text-sm font-semibold text-primary">
              View all articles →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="card-raised overflow-hidden"
              >
                <BlogThumbnail category={post.category} imageUrl={post.cover_image_url} className="h-32" />
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    {post.category}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-ink">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs text-ink/60">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      <FinalCta />

      {/* Newsletter */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <NewsletterSignup />
      </section>

      <PoweredByStrip />
    </div>
  )
}
