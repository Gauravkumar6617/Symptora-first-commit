import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { clinics } from '@/data/clinics'
import { type Doctor, doctors, timeSlots } from '@/data/doctors'
import { APP_NAME } from '@/lib/constants'
import { useFamilyStore } from '@/store/familyStore'

const specialties = Array.from(new Set(doctors.map((d) => d.specialty)))

const visitPurposes = [
  'New consultation',
  'Follow-up visit',
  'Routine checkup',
  'Second opinion',
  'Prescription renewal',
  'Other',
]

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
          <Star className="h-5 w-5 shrink-0 fill-warning text-warning" />
          <p className="text-sm text-white/85">
            4.8 average rating across 25k+ consultations.
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
  const members = useFamilyStore((state) => state.members)
  const [specialty, setSpecialty] = useState<string>('All')
  const [clinicId, setClinicId] = useState<string>('All')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedFor, setSelectedFor] = useState<string>('self')
  const [visitPurpose, setVisitPurpose] = useState(visitPurposes[0])
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const filteredDoctors = useMemo(
    () =>
      doctors.filter(
        (doctor) =>
          (specialty === 'All' || doctor.specialty === specialty) &&
          (clinicId === 'All' || doctor.clinicId === clinicId),
      ),
    [specialty, clinicId],
  )

  function handleConfirm() {
    if (!selectedDoctor || !selectedSlot) return
    setConfirmed(true)
  }

  function resetBooking() {
    setSelectedDoctor(null)
    setSelectedSlot(null)
    setVisitPurpose(visitPurposes[0])
    setPhone('')
    setNotes('')
    setConfirmed(false)
  }

  if (confirmed && selectedDoctor && selectedSlot) {
    const bookedFor =
      selectedFor === 'self'
        ? 'you'
        : members.find((m) => m.id === selectedFor)?.name ?? 'you'
    const clinic = clinics.find((c) => c.id === selectedDoctor.clinicId)

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
              {selectedDoctor.name} · {selectedDoctor.specialty} for{' '}
              {bookedFor}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {selectedSlot} · {clinic?.name}
            </p>
            <div className="mt-4 space-y-1.5 rounded-xl border border-ink/10 bg-surface/60 p-4 text-left text-sm text-ink/70">
              <p>
                <span className="font-semibold text-ink">Purpose:</span>{' '}
                {visitPurpose}
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
            <button
              type="button"
              onClick={resetBooking}
              className="btn-raised mt-6"
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

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="flex flex-wrap gap-2">
              {['All', ...specialties].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSpecialty(item)
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

            <div className="mt-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-ink/40" />
              <select
                value={clinicId}
                onChange={(e) => {
                  setClinicId(e.target.value)
                  setSelectedDoctor(null)
                }}
                className="w-full max-w-xs rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="All">Any clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {filteredDoctors.length === 0 && (
                <p className="text-sm text-ink/50 sm:col-span-2">
                  No doctors match that specialty and clinic combination —
                  try "Any clinic".
                </p>
              )}
              {filteredDoctors.map((doctor) => {
                const clinic = clinics.find((c) => c.id === doctor.clinicId)
                const isSelected = selectedDoctor?.id === doctor.id
                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctor(doctor)
                      setSelectedSlot(null)
                    }}
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
                          {doctor.specialty} · {doctor.experienceYears} yrs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink/60">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        {doctor.rating} ({doctor.consults})
                      </span>
                      <span>₹{doctor.fee}</span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-ink/50">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {clinic?.name}
                    </p>
                    {doctor.availableToday && (
                      <span className="w-fit rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        Available today
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
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
                    {member.name} ({member.relation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Purpose of visit
              </h3>
              <select
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value)}
                className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {visitPurposes.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
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
                {selectedDoctor
                  ? `Available slots · ${selectedDoctor.name}`
                  : 'Select a doctor to see slots'}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(selectedDoctor ? timeSlots : []).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      selectedSlot === slot
                        ? 'bg-primary text-white'
                        : 'pill-well text-ink/70 hover:text-primary'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedDoctor || !selectedSlot}
              onClick={handleConfirm}
              className="btn-raised w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
