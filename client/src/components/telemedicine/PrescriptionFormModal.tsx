import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { ApiError, issuePrescription, type Medication } from '@/lib/api'

const emptyMedication: Medication = { name: '', dosage: '', frequency: '', duration: '', instructions: '' }

interface PrescriptionFormModalProps {
  kind: 'appointment' | 'telemedicine'
  id: string
  token: string
  onClose: () => void
  onIssued: () => void
}

/** A doctor issues an e-prescription for the visit — synced to the
 * patient's Medplum record as FHIR MedicationRequests in the background. */
export function PrescriptionFormModal({ kind, id, token, onClose, onIssued }: PrescriptionFormModalProps) {
  const [medications, setMedications] = useState<Medication[]>([{ ...emptyMedication }])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateMedication(index: number, changes: Partial<Medication>) {
    setMedications((current) => current.map((m, i) => (i === index ? { ...m, ...changes } : m)))
  }

  function removeMedication(index: number) {
    setMedications((current) => current.filter((_, i) => i !== index))
  }

  const canSubmit = medications.every((m) => m.name.trim() && m.dosage.trim() && m.frequency.trim() && m.duration.trim())

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await issuePrescription(token, {
        appointment_id: kind === 'appointment' ? id : null,
        consultation_id: kind === 'telemedicine' ? id : null,
        medications: medications.map((m) => ({ ...m, instructions: m.instructions?.trim() || undefined })),
        notes: notes.trim() || undefined,
      })
      onIssued()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not issue the prescription.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Issue prescription</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="rounded-xl border border-ink/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Medication {index + 1}</p>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    aria-label="Remove medication"
                    className="text-ink/40 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={med.name}
                  onChange={(e) => updateMedication(index, { name: e.target.value })}
                  placeholder="Name (e.g. Paracetamol)"
                  className="col-span-2 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                  placeholder="Dosage (500mg)"
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                  placeholder="Frequency (2x/day)"
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={med.duration}
                  onChange={(e) => updateMedication(index, { duration: e.target.value })}
                  placeholder="Duration (5 days)"
                  className="col-span-2 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={med.instructions ?? ''}
                  onChange={(e) => updateMedication(index, { instructions: e.target.value })}
                  placeholder="Instructions (optional, e.g. after food)"
                  className="col-span-2 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setMedications((current) => [...current, { ...emptyMedication }])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add another medication
          </button>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes for the patient (optional)"
            className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-primary"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="btn-raised w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Issuing…' : 'Issue prescription'}
          </button>
        </div>
      </div>
    </div>
  )
}
