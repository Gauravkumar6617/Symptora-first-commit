import type { AvailabilitySlotPayload, DayOfWeek, TimeSlot } from '@/lib/api'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

/** Per-day AM/PM availability picker, shared by the clinic and doctor edit forms. */
export function AvailabilityGrid({
  slots,
  onChange,
}: {
  slots: AvailabilitySlotPayload[]
  onChange: (slots: AvailabilitySlotPayload[]) => void
}) {
  function toggle(day: DayOfWeek, slot: TimeSlot) {
    const has = slots.some((s) => s.days === day && s.slot === slot)
    onChange(
      has ? slots.filter((s) => !(s.days === day && s.slot === slot)) : [...slots, { days: day, slot }],
    )
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Availability (per day)</p>
      <div className="mt-2 overflow-x-auto rounded-lg border border-ink/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-3 py-2">Day</th>
              <th className="px-3 py-2">AM</th>
              <th className="px-3 py-2">PM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {DAYS.map((day) => (
              <tr key={day.value}>
                <td className="px-3 py-2 text-ink/80">{day.label}</td>
                {(['am', 'pm'] as TimeSlot[]).map((slot) => (
                  <td key={slot} className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={slots.some((s) => s.days === day.value && s.slot === slot)}
                      onChange={() => toggle(day.value, slot)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
