import { Dna, Lock, Video } from 'lucide-react'

const items = [
  { icon: Dna, label: 'Medplum FHIR backend' },
  { icon: Lock, label: 'End-to-end encrypted records' },
  { icon: Video, label: 'WebRTC video consults' },
]

export function PoweredByStrip() {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 text-xs font-medium text-ink/40 sm:px-6">
      <span className="uppercase tracking-wide">Built on trusted health infrastructure</span>
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-ink/60">
          <span className="icon-badge h-6 w-6">
            <Icon className="h-3.5 w-3.5 text-primary-600" />
          </span>
          {label}
        </span>
      ))}
    </div>
  )
}
