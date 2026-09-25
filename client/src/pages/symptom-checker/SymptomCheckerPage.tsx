import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Info, Plus, Search, Sparkles, Stethoscope, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ApiError,
  GENDERS,
  type Gender,
  listSymptoms,
  type ParsedSymptoms,
  parseSymptoms,
  type PatientDetails,
  predictDisease,
  type PredictionResult,
  type Symptom,
  SYMPTOM_DURATIONS,
  type SymptomDuration,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ageFromDateOfBirth, useFamilyStore } from '@/store/familyStore'

/** Backend accepts at most 20 symptoms per request. */
const MAX_SELECTED = 20
const MAX_SUGGESTIONS = 16

const urgencyStyles: Record<PredictionResult['urgency'], { label: string; className: string; advice: string }> = {
  low: {
    label: 'Low urgency',
    className: 'bg-success/10 text-success',
    advice: 'Usually fine to monitor at home. Book a doctor if it gets worse or lasts.',
  },
  medium: {
    label: 'Medium urgency',
    className: 'bg-warning/10 text-warning',
    advice: 'Consider seeing a doctor in the next day or two.',
  },
  high: {
    label: 'High urgency',
    className: 'bg-danger/10 text-danger',
    advice: 'Please see a doctor soon. If symptoms are severe, seek emergency care.',
  },
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

const ME = 'me'

/** Only values the backend accepts; anything else leaves the field unset. */
function toGender(value: string | undefined): Gender | '' {
  return GENDERS.some((g) => g.value === value) ? (value as Gender) : ''
}

const chipClass = (selected: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    selected
      ? 'border-primary bg-primary text-white'
      : 'border-ink/15 text-ink hover:border-primary hover:text-primary'
  }`

export function SymptomCheckerPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const members = useFamilyStore((state) => state.members)
  const loadMembers = useFamilyStore((state) => state.loadMembers)

  // ?q= from the home search box, ?member= from a family card.
  const [searchParams] = useSearchParams()
  const memberParam = searchParams.get('member')

  // Step 1: who the check is for. Pre-filled from the profile / family member.
  const [patient, setPatient] = useState<PatientDetails | null>(null)
  const [forWhom, setForWhom] = useState(ME)
  const [age, setAge] = useState(user?.dateOfBirth ? String(ageFromDateOfBirth(user.dateOfBirth)) : '')
  const [gender, setGender] = useState<Gender | ''>(toGender(user?.gender))
  const [duration, setDuration] = useState<SymptomDuration | ''>('')

  // Step 2: symptoms.
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [loadingSymptoms, setLoadingSymptoms] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  // Free-text description -> symptoms (step 2). Pre-filled from the home page search box.
  const [description, setDescription] = useState(searchParams.get('q') ?? '')
  const [parsed, setParsed] = useState<ParsedSymptoms | null>(null)
  const [parsing, setParsing] = useState(false)
  const [durationNote, setDurationNote] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    listSymptoms(token)
      .then((list) => {
        if (!cancelled) setSymptoms(list)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load the symptom list.'))
      })
      .finally(() => {
        if (!cancelled) setLoadingSymptoms(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    loadMembers().catch(() => {}) // offline: the persisted list is used
  }, [loadMembers])


  function pickPerson(id: string) {
    setForWhom(id)
    const member = members.find((m) => m.id === id)
    const dob = id === ME ? user?.dateOfBirth : undefined
    setAge(member ? String(member.age) : dob ? String(ageFromDateOfBirth(dob)) : '')
    setGender(toGender(member ? member.gender : user?.gender))
  }

  // Opened from a family card: select that member once their profile has loaded
  // (adjusting state during render, so there is no extra effect pass).
  const [memberApplied, setMemberApplied] = useState(false)
  if (!memberApplied && memberParam && members.some((m) => m.id === memberParam)) {
    setMemberApplied(true)
    pickPerson(memberParam)
  }

  const parsedAge = Number(age)
  const ageValid = age.trim() !== '' && Number.isInteger(parsedAge) && parsedAge >= 0 && parsedAge <= 120
  const personName = forWhom === ME ? 'You' : (members.find((m) => m.id === forWhom)?.name ?? 'Them')

  const labels = useMemo(
    () => Object.fromEntries(symptoms.map((s) => [s.id, s.label])),
    [symptoms],
  )

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return symptoms
      .filter((s) => !selected.includes(s.id))
      .filter((s) => !term || s.label.toLowerCase().includes(term))
      .slice(0, MAX_SUGGESTIONS)
  }, [symptoms, search, selected])

  function toggle(id: string) {
    setResult(null) // the old result no longer matches the selection
    setSelected((current) =>
      current.includes(id)
        ? current.filter((s) => s !== id)
        : current.length < MAX_SELECTED
          ? [...current, id]
          : current,
    )
  }

  async function handleDescribe() {
    if (!token || !description.trim()) return
    setError('')
    setParsing(true)
    try {
      const found = await parseSymptoms(token, description)
      setParsed(found)
      setResult(null)
      setSelected((current) =>
        [...new Set([...current, ...found.symptoms.map((s) => s.id)])].slice(0, MAX_SELECTED),
      )
      if (found.duration && patient && found.duration !== patient.duration) {
        setPatient({ ...patient, duration: found.duration })
        const label = SYMPTOM_DURATIONS.find((d) => d.value === found.duration)?.label
        setDurationNote(`Duration updated to "${label}" from your description.`)
      } else {
        setDurationNote('')
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not read your description. Please try again.'))
    } finally {
      setParsing(false)
    }
  }

  /** Picking one meaning of a vague word adds it and closes that question. */
  function pickSuggestion(phrase: string, id: string) {
    toggle(id)
    setParsed((current) =>
      current && { ...current, suggestions: current.suggestions.filter((s) => s.phrase !== phrase) },
    )
  }

  async function handleCheck() {
    if (!token || selected.length === 0) return
    setError('')
    setChecking(true)
    try {
      setResult(
        await predictDisease(
          token,
          selected,
          patient ? { ...patient, description: description.trim() || undefined } : undefined,
          forWhom === ME ? undefined : forWhom,
        ),
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not check your symptoms. Please try again.'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Symptom checker</h1>
      <p className="mt-2 text-sm text-ink/60">
        Pick what you're feeling and we'll suggest conditions that commonly
        match. It's a starting point for talking to a doctor, not a diagnosis.
      </p>

      {!patient ? (
        <form
          className="card-raised mt-8 grid gap-6 p-6 hover:translate-y-0"
          onSubmit={(e) => {
            e.preventDefault()
            if (ageValid && gender && duration) setPatient({ age: parsedAge, gender, duration })
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Step 1 of 2 · About the patient
          </p>

          <fieldset>
            <legend className="text-sm font-medium text-ink">Who is this for?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={chipClass(forWhom === ME)} onClick={() => pickPerson(ME)}>
                Me
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={chipClass(forWhom === m.id)}
                  onClick={() => pickPerson(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="max-w-xs">
            <label htmlFor="patient-age" className="block text-sm font-medium text-ink">
              Age
            </label>
            <input
              id="patient-age"
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age in years"
              className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {age && !ageValid && (
              <p className="mt-1 text-xs text-danger">Enter an age between 0 and 120.</p>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-ink">Gender</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={chipClass(gender === g.value)}
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-ink">How long have the symptoms lasted?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOM_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={chipClass(duration === d.value)}
                  onClick={() => setDuration(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!ageValid || !gender || !duration}
              className="btn-raised gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-ink/50">
              Age and how long symptoms have lasted help decide how soon to see a doctor.
            </p>
          </div>
        </form>
      ) : (
      <>
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl bg-primary/5 px-4 py-3 text-sm text-ink">
        <UserRound className="h-4 w-4 text-primary" />
        <span className="flex-1">
          {personName} · {patient.age} yrs · {GENDERS.find((g) => g.value === patient.gender)?.label} ·{' '}
          {SYMPTOM_DURATIONS.find((d) => d.value === patient.duration)?.label}
        </span>
        <button
          type="button"
          onClick={() => {
            setResult(null)
            setPatient(null)
          }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="card-raised mt-4 p-6 hover:translate-y-0">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink/50">
          Step 2 of 2 · Pick what you're feeling
        </p>

        <label htmlFor="describe" className="block text-sm font-medium text-ink">
          Describe how you feel
        </label>
        <textarea
          id="describe"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="e.g. I have been vomiting for two days and there is blood"
          className="mt-1.5 w-full resize-y rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleDescribe}
          disabled={!description.trim() || parsing}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {parsing ? 'Reading…' : 'Find symptoms'}
        </button>

        {parsed && (
          <div className="mt-4 grid gap-3">
            {parsed.red_flags.map((flag) => (
              <p key={flag} className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {flag}
              </p>
            ))}
            {parsed.symptoms.length > 0 && (
              <p className="text-xs text-ink/70">
                Found: {parsed.symptoms.map((s) => s.label).join(', ')}. Added to your list below.
              </p>
            )}
            {durationNote && <p className="text-xs text-ink/70">{durationNote}</p>}
            {parsed.suggestions.map((s) => (
              <div key={s.phrase}>
                <p className="text-xs font-medium text-ink">Which did you mean by "{s.phrase}"?</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {s.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickSuggestion(s.phrase, o.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/5 px-3 py-1.5 text-xs font-medium text-ink hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {parsed.symptoms.length === 0 && parsed.suggestions.length === 0 && (
              <p className="text-xs text-ink/60">
                We couldn't match any symptoms in that. Try simpler words, or pick from the list below.
              </p>
            )}
          </div>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-ink/10" />
          or search the list
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        {selected.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              Selected ({selected.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  {labels[id] ?? id}
                  <X className="h-3.5 w-3.5" aria-label="Remove" />
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symptoms, e.g. fever"
            className="w-full rounded-lg border border-ink/15 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {loadingSymptoms
            ? Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="h-8 w-24 animate-pulse rounded-full bg-ink/10" />
              ))
            : suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
          {!loadingSymptoms && symptoms.length > 0 && suggestions.length === 0 && (
            <p className="text-xs text-ink/50">No matching symptoms.</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={selected.length === 0 || checking}
          className="btn-raised mt-6 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking
            ? 'Checking…'
            : selected.length
              ? `Check ${selected.length} symptom${selected.length === 1 ? '' : 's'}`
              : 'Select at least one symptom'}
        </button>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>

      {result && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${urgencyStyles[result.urgency].className}`}
            >
              {urgencyStyles[result.urgency].label}
            </span>
            <p className="text-sm text-ink/70">{urgencyStyles[result.urgency].advice}</p>
          </div>
          {result.urgency_reasons.length > 0 && (
            <ul className="mt-3 grid gap-1.5">
              {result.urgency_reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-xs text-ink">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0 text-warning" />
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-6 text-lg font-bold text-ink">Possible conditions</h2>
          <div className="mt-4 grid gap-4">
            {result.predictions.map((p, index) => (
              <div key={p.disease} className="card-raised p-5 hover:translate-y-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold ${
                      index === 0 ? 'bg-primary/10 text-primary' : 'bg-ink/5 text-ink/60'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <h3 className="flex-1 font-semibold text-ink">{p.label}</h3>
                  <span className="text-xs font-medium text-ink/50">
                    {Math.round(p.probability * 100)}% match
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={`h-full rounded-full ${index === 0 ? 'bg-primary' : 'bg-ink/40'}`}
                    style={{ width: `${Math.max(4, p.probability * 100)}%` }}
                  />
                </div>
                {p.description && <p className="mt-3 text-sm text-ink/70">{p.description}</p>}
                {p.precautions.length > 0 && (
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {p.precautions.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-ink">
                        <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-success" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/telemedicine" className="btn-raised gap-2">
              <Stethoscope className="h-4 w-4" />
              Talk to a doctor
            </Link>
            <Link
              to="/appointments"
              className="inline-flex items-center rounded-xl border border-ink/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              Book an appointment
            </Link>
          </div>

          <p className="mt-6 flex items-start gap-2 rounded-xl bg-primary/5 p-4 text-xs text-ink/70">
            <Info className="mt-px h-4 w-4 shrink-0 text-primary" />
            {result.disclaimer}
          </p>
          {result.check_id && (
            <p className="mt-3 text-xs text-ink/50">
              Saved to {forWhom === ME ? 'your' : `${personName}'s`} health history
              {forWhom !== ME && ' — they see it too once they have their own login'}.{' '}
              <Link to="/dashboard" className="font-semibold text-primary">
                View history
              </Link>
            </p>
          )}
        </section>
      )}
      </>
      )}
    </div>
  )
}
