import { Check, X } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

const rows = [
  { label: 'Know your risk before you decide', us: true, old: false },
  { label: 'Connect to a doctor in minutes', us: true, old: false },
  { label: 'One profile for your whole family', us: true, old: false },
  { label: 'Digital prescription & visit history', us: true, old: false },
  { label: 'Hours in a waiting room', us: false, old: true },
  { label: 'Guessing symptoms on search engines', us: false, old: true },
]

export function WhyChooseUs() {
  return (
    <section className="border-y border-ink/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink">
            {APP_NAME} vs. figuring it out yourself
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            The old way is slow and stressful. Here's the difference.
          </p>
        </div>

        <div className="card-raised mx-auto mt-8 max-w-3xl overflow-hidden">
          <div className="grid grid-cols-3 gap-2 bg-primary-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60 sm:px-8">
            <span>What matters</span>
            <span className="text-center text-primary-700">{APP_NAME}</span>
            <span className="text-center">Old way</span>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 items-center gap-2 px-5 py-4 text-sm sm:px-8 ${
                index % 2 === 0 ? 'bg-white' : 'bg-surface/60'
              }`}
            >
              <span className="text-ink/80">{row.label}</span>
              <span className="flex justify-center">
                {row.us ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <X className="h-5 w-5 text-danger" />
                )}
              </span>
              <span className="flex justify-center">
                {row.old ? (
                  <Check className="h-5 w-5 text-ink/30" />
                ) : (
                  <X className="h-5 w-5 text-ink/30" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
