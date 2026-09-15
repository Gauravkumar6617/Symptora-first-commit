import { Quote, Star } from 'lucide-react'

const testimonials = [
  {
    quote:
      "My father's chest pain check came back High risk at 11pm and we were on a video call with a doctor in under three minutes. That speed mattered.",
    name: 'Rohan Verma',
    role: 'Using Symptora for 8 months',
  },
  {
    quote:
      'I used to Google every symptom and scare myself. Now I run a Health Check first — it tells me honestly when it is nothing and when I should actually go in.',
    name: 'Ayesha Khan',
    role: 'Health Check user',
  },
  {
    quote:
      'Managing appointments for my mother from another city used to mean a dozen phone calls. Family Profiles put it all in one place I can actually see.',
    name: 'Sandeep Nair',
    role: 'Family Profiles user',
  },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-ink">Trusted by families like yours</h2>
        <p className="mt-1 text-sm text-ink/60">
          Real stories from people who used Symptora when it counted.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.name} className="card-raised flex flex-col p-6">
            <Quote className="h-6 w-6 text-primary-300" />
            <p className="mt-3 flex-1 text-sm leading-6 text-ink/75">
              "{t.quote}"
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
              <div>
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="text-xs text-ink/50">{t.role}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-warning text-warning"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
