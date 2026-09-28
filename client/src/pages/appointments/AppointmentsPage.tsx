import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Video,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  type Appointment,
  ApiError,
  bookAppointment,
  bookAppointmentByService,
  type ClinicDoctor,
  type DoctorAvailability,
  type PublicClinic,
  type Service,
  getDoctorPublicProfile,
  listClinicDirectory,
  listServices,
} from '@/lib/api'
import { APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { relationLabel, useFamilyStore } from '@/store/familyStore'

const visitPurposes = [
  'New consultation',
  'Follow-up visit',
  'Routine checkup',
  'Second opinion',
  'Prescription renewal',
  'Other',
]

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

interface OpenSlot {
  date: string // YYYY-MM-DD
  slot: 'am' | 'pm'
  label: string
}

/** Availability is a recurring weekly day + AM/PM slot; turn that into the
 * next few actual bookable calendar dates. */
function upcomingSlots(
  availability: { days: DoctorAvailability['days']; slot: DoctorAvailability['slot'] }[],
  daysAhead = 21,
): OpenSlot[] {
  const slots: OpenSlot[] = []
  const today = new Date()
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const weekday = WEEKDAY_NAMES[date.getDay()]
    for (const slot of ['am', 'pm'] as const) {
      if (availability.some((a) => a.days === weekday && a.slot === slot)) {
        slots.push({
          date: date.toISOString().slice(0, 10),
          slot,
          label: `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${slot.toUpperCase()}`,
        })
      }
    }
  }
  return slots
}

function BookingSidePanel() {
  return (
    <div className="relative hidden shrink-0 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-10 py-12 text-white lg:flex lg:w-[380px] lg:flex-col lg:justify-between xl:w-[440px]">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-14 h-56 w-56 rounded-full bg-white/10"
        aria-hidden
      />

      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <CalendarCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-6 text-2xl font-bold leading-snug">
          Book a doctor in under a minute
        </h2>
        <p className="mt-3 text-sm text-white/80">
          Pick a specialty, choose from real-time availability, and confirm —
          for yourself or anyone in your {APP_NAME} family profile.
        </p>
      </div>

      <div className="relative space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
          <Clock className="h-5 w-5 shrink-0" />
          <p className="text-sm text-white/85">
            Most patients get a same-day slot with a partner clinic.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
          <Video className="h-5 w-5 shrink-0" />
          <p className="text-sm text-white/85">
            Confirmed bookings come with a Google Meet link for video visits.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <p className="text-sm text-white/85">
            Your booking and visit history stay private and encrypted.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AppointmentsPage() {
  const { user, token } = useAuthStore()
  const { members, loadMembers } = useFamilyStore()

  const {
    data: clinicsList = [] as PublicClinic[],
    isLoading: loadingClinics,
    isError: clinicsFailed,
  } = useQuery({ queryKey: ['clinics-directory'], queryFn: listClinicDirectory })
  const loadError = clinicsFailed ? 'Could not load clinics right now. Please try again shortly.' : null

  const { data: services = [] as Service[] } = useQuery({ queryKey: ['public-services'], queryFn: listServices })
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  /** 'doctor': pick a specific doctor. 'service': pick a clinic + service and
   * let the backend assign any doctor there who's free. */
  const [mode, setMode] = useState<'doctor' | 'service'>('doctor')

  const [specialty, setSpecialty] = useState<string>('All')
  const [clinicId, setClinicId] = useState<string>('All')
  const [selectedDoctor, setSelectedDoctor] = useState<
    (ClinicDoctor & { clinicId: string; clinicName: string }) | null
  >(null)
  const { data: availability = [] as DoctorAvailability[], isFetching: loadingAvailability } = useQuery({
    queryKey: ['doctor-availability', selectedDoctor?.id],
    queryFn: () => getDoctorPublicProfile(selectedDoctor!.id).then((profile) => profile.availability_slots),
    enabled: Boolean(selectedDoctor),
  })
  const [selectedSlot, setSelectedSlot] = useState<OpenSlot | null>(null)

  const [selectedFor, setSelectedFor] = useState<string>('self')
  const [reason, setReason] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Appointment | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    loadMembers().catch(() => {})
  }, [loadMembers])

  const doctorRows = useMemo(
    () =>
      clinicsList.flatMap((clinic) =>
        clinic.doctors.map((doctor) => ({ ...doctor, clinicId: clinic.id, clinicName: clinic.name })),
      ),
    [clinicsList],
  )
  const specialties = useMemo(
    () => Array.from(new Set(doctorRows.map((d) => d.specialization))),
    [doctorRows],
  )
  const filteredDoctors = useMemo(
    () =>
      doctorRows.filter(
        (doctor) =>
          (specialty === 'All' || doctor.specialization === specialty) &&
          (clinicId === 'All' || doctor.clinicId === clinicId),
      ),
    [doctorRows, specialty, clinicId],
  )
  const serviceModeClinic = useMemo(
    () => clinicsList.find((c) => c.id === clinicId) ?? null,
    [clinicsList, clinicId],
  )
  const openSlots = useMemo(
    () => (mode === 'service' ? upcomingSlots(serviceModeClinic?.availability_slots ?? []) : upcomingSlots(availability)),
    [mode, availability, serviceModeClinic],
  )
  const displayFee = mode === 'doctor' ? (selectedDoctor?.fee ?? null) : (selectedService?.fee ?? null)

  function pickService(service: Service | null) {
    setSelectedService(service)
    setSelectedDoctor(null)
    if (service) {
      setSpecialty(service.specialization)
      setReason((current) => current || service.name)
    } else {
      setSpecialty('All')
    }
  }

  function pickDoctor(doctor: ClinicDoctor & { clinicId: string; clinicName: string }) {
    setSelectedDoctor(doctor)
    setSelectedSlot(null)
  }

  function canBook() {
    if (!selectedSlot || reason.trim().length < 3) return false
    if (mode === 'doctor') return Boolean(selectedDoctor)
    return Boolean(selectedService && serviceModeClinic)
  }

  /** "Confirm appointment" opens the review dialog; the actual booking only
   * happens once the patient confirms there too. */
  function handleConfirmClick() {
    if (!canBook()) return
    setConfirming(true)
  }

  async function submitBooking() {
    if (!token || !canBook()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const bookedMember = selectedFor !== 'self' ? members.find((m) => m.id === selectedFor) : null
      const shared = {
        family_member_id: bookedMember?.id ?? null,
        patient_name: bookedMember?.name ?? user?.name ?? '',
        patient_email: bookedMember?.email ?? user?.email ?? '',
        patient_phone: phone || user?.phone || '',
        reason: reason.trim(),
        notes: notes || undefined,
        appointment_date: selectedSlot!.date,
        slot: selectedSlot!.slot,
      }
      const appointment =
        mode === 'doctor'
          ? await bookAppointment(token, {
              doctor_profile_id: selectedDoctor!.id,
              clinic_id: selectedDoctor!.clinicId,
              ...shared,
            })
          : await bookAppointmentByService(token, {
              clinic_id: serviceModeClinic!.id,
              service_id: selectedService!.id,
              ...shared,
            })
      setConfirming(false)
      setConfirmed(appointment)
    } catch (err) {
      setConfirming(false)
      setSubmitError(err instanceof ApiError ? err.message : 'Could not book the appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetBooking() {
    setSelectedDoctor(null)
    setSelectedSlot(null)
    setSelectedService(null)
    setSpecialty('All')
    setReason('')
    setNotes('')
    setSubmitError(null)
    setConfirming(false)
    setConfirmed(null)
  }

  if (confirmed) {
    const bookedFor =
      selectedFor === 'self' ? 'you' : (members.find((m) => m.id === selectedFor)?.name ?? 'you')
    const when = new Date(confirmed.appointment_date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

    return (
      <div className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row">
        <BookingSidePanel />
        <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
          <div className="card-raised max-w-md p-8 text-center">
            <span className="icon-badge mx-auto h-14 w-14">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              Appointment confirmed
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              {confirmed.doctor_name ?? 'A doctor'}
              {confirmed.doctor_specialization ? ` · ${confirmed.doctor_specialization}` : ''} for {bookedFor}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {when} · {confirmed.slot.toUpperCase()} · {confirmed.clinic_name}
            </p>
            <div className="mt-4 space-y-1.5 rounded-xl border border-ink/10 bg-surface/60 p-4 text-left text-sm text-ink/70">
              <p>
                <span className="font-semibold text-ink">Purpose:</span>{' '}
                {confirmed.reason}
              </p>
              {phone && (
                <p>
                  <span className="font-semibold text-ink">Contact:</span>{' '}
                  {phone}
                </p>
              )}
              {notes && (
                <p>
                  <span className="font-semibold text-ink">Notes:</span>{' '}
                  {notes}
                </p>
              )}
            </div>
            {confirmed.meet_link ? (
              <a
                href={confirmed.meet_link}
                target="_blank"
                rel="noreferrer"
                className="btn-raised mt-6 inline-flex items-center gap-2"
              >
                <Video className="h-4 w-4" /> Join Google Meet
              </a>
            ) : (
              <p className="mt-4 text-xs text-ink/40">
                A video link will be shared before your visit.
              </p>
            )}
            <button
              type="button"
              onClick={resetBooking}
              className="mt-3 block w-full rounded-xl border border-ink/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              Book another appointment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row">
      <BookingSidePanel />

      <div className="flex-1 px-4 py-10 sm:px-8 lg:px-10">
        <h1 className="text-3xl font-bold text-ink">Book an appointment</h1>
        <p className="mt-2 text-sm text-ink/60">
          Pick a specialty, choose a doctor, and lock in a time slot.
        </p>

        <div className="mt-4 inline-flex rounded-lg border border-ink/15 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('doctor')
              setSelectedSlot(null)
            }}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === 'doctor' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Choose a doctor
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('service')
              setSelectedDoctor(null)
              setSelectedSlot(null)
            }}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === 'service' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Any doctor for a service
          </button>
        </div>

        {loadError && (
          <p className="mt-6 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {loadError}
          </p>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {services.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                  What do you need?
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => pickService(null)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedService === null
                        ? 'bg-primary text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]'
                        : 'border border-ink/15 bg-white text-ink/70 hover:border-primary/40'
                    }`}
                  >
                    Any service
                  </button>
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      title={svc.description ?? undefined}
                      onClick={() => pickService(svc)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        selectedService?.id === svc.id
                          ? 'bg-primary text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]'
                          : 'border border-ink/15 bg-white text-ink/70 hover:border-primary/40'
                      }`}
                    >
                      {svc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode === 'doctor' && (
              <div className="flex flex-wrap gap-2">
                {['All', ...specialties].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSpecialty(item)
                      setSelectedService(null)
                      setSelectedDoctor(null)
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      specialty === item
                        ? 'bg-primary text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]'
                        : 'border border-ink/15 bg-white text-ink/70 hover:border-primary/40'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-ink/40" />
              <select
                value={clinicId}
                onChange={(e) => {
                  setClinicId(e.target.value)
                  setSelectedDoctor(null)
                  setSelectedSlot(null)
                }}
                className="w-full max-w-xs rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="All">{mode === 'service' ? 'Pick a clinic' : 'Any clinic'}</option>
                {clinicsList.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'service' ? (
              <div className="mt-6">
                {!serviceModeClinic || !selectedService ? (
                  <p className="text-sm text-ink/50">
                    Pick a clinic above and a service below to see open slots — we'll assign any
                    doctor there who offers it and is free.
                  </p>
                ) : (
                  <div className="card-raised flex items-center gap-3 p-4">
                    <span className="icon-badge h-11 w-11">
                      <UserRound className="h-5 w-5 text-primary-600" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {selectedService.name} · {serviceModeClinic.name}
                      </p>
                      <p className="text-xs text-ink/50">Any available doctor will be assigned</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {loadingClinics && (
                <p className="text-sm text-ink/50 sm:col-span-2">Loading doctors…</p>
              )}
              {!loadingClinics && filteredDoctors.length === 0 && (
                <p className="text-sm text-ink/50 sm:col-span-2">
                  No doctors match that specialty and clinic combination —
                  try "Any clinic".
                </p>
              )}
              {filteredDoctors.map((doctor) => {
                const isSelected = selectedDoctor?.id === doctor.id
                return (
                  <button
                    key={`${doctor.clinicId}-${doctor.id}`}
                    type="button"
                    onClick={() => pickDoctor(doctor)}
                    className={`card-raised flex flex-col gap-2 p-4 text-left ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
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
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-ink/50">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {doctor.clinicName}
                    </p>
                  </button>
                )
              })}
            </div>
            )}
          </div>

          <div className="card-raised h-fit space-y-5 p-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">Booking for</h3>
              <select
                value={selectedFor}
                onChange={(e) => setSelectedFor(e.target.value)}
                className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="self">Myself</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({relationLabel(member.relation)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Reason for visit <span className="font-normal text-danger">*</span>
              </h3>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Recurring headaches for the past week"
                maxLength={255}
                required
                className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {visitPurposes.map((purpose) => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setReason(purpose)}
                    className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs text-ink/60 hover:border-primary/40 hover:text-primary"
                  >
                    {purpose}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Contact number
              </h3>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2 focus-within:border-primary">
                <Phone className="h-4 w-4 shrink-0 text-ink/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="For appointment reminders"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Notes for the doctor{' '}
                <span className="font-normal text-ink/40">(optional)</span>
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Briefly describe your symptoms or reason for visit"
                className="mt-2 w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-primary"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                {mode === 'doctor'
                  ? selectedDoctor
                    ? `Available slots · ${selectedDoctor.name}`
                    : 'Select a doctor to see slots'
                  : serviceModeClinic && selectedService
                    ? `Available slots · ${serviceModeClinic.name}`
                    : 'Pick a clinic and service to see slots'}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {mode === 'doctor' && loadingAvailability && (
                  <p className="col-span-2 text-xs text-ink/40">Checking availability…</p>
                )}
                {mode === 'doctor' && !loadingAvailability && selectedDoctor && openSlots.length === 0 && (
                  <p className="col-span-2 text-xs text-ink/40">
                    No open slots in the next 3 weeks.
                  </p>
                )}
                {mode === 'service' && serviceModeClinic && selectedService && openSlots.length === 0 && (
                  <p className="col-span-2 text-xs text-ink/40">
                    No open slots in the next 3 weeks.
                  </p>
                )}
                {!loadingAvailability &&
                  openSlots.map((slot) => (
                    <button
                      key={`${slot.date}-${slot.slot}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        selectedSlot?.date === slot.date && selectedSlot?.slot === slot.slot
                          ? 'bg-primary text-white'
                          : 'pill-well text-ink/70 hover:text-primary'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
              </div>
            </div>

            {displayFee != null && (
              <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
                Consultation fee: {displayFee}
              </p>
            )}

            {submitError && (
              <p className="text-sm text-danger">{submitError}</p>
            )}

            <button
              type="button"
              disabled={!canBook() || submitting}
              onClick={handleConfirmClick}
              className="btn-raised w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Booking…' : 'Confirm appointment'}
            </button>
          </div>
        </div>
      </div>

      {confirming && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card-raised w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-ink">Confirm your appointment</h2>
            <div className="mt-4 space-y-1.5 rounded-xl border border-ink/10 bg-surface/60 p-4 text-sm text-ink/70">
              <p>
                <span className="font-semibold text-ink">
                  {mode === 'doctor'
                    ? `${selectedDoctor!.name} · ${selectedDoctor!.clinicName}`
                    : `${serviceModeClinic!.name} · any available doctor`}
                </span>
              </p>
              <p>{selectedSlot.label}</p>
              <p>
                <span className="font-semibold text-ink">Reason:</span> {reason}
              </p>
              {displayFee != null && (
                <p>
                  <span className="font-semibold text-ink">Fee:</span> {displayFee}
                </p>
              )}
            </div>
            {submitError && <p className="mt-3 text-sm text-danger">{submitError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={submitBooking}
                disabled={submitting}
                className="btn-raised flex-1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
