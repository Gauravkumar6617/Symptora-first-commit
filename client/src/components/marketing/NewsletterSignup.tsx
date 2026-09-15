import { CheckCircle2, Mail, Send } from 'lucide-react'
import { type FormEvent, useState } from 'react'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email) return
    // TODO: wire to real newsletter/subscription endpoint
    setSubmitted(true)
  }

  return (
    <div className="card-raised overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <span className="icon-badge h-14 w-14">
            <Mail className="h-6 w-6 text-primary-600" />
          </span>
          <h3 className="mt-5 text-3xl font-bold leading-tight">
            Stay ahead of your health
          </h3>
          <p className="mt-3 max-w-md text-base text-white/85">
            Monthly tips on symptoms, family care, and preventive health,
            straight from our clinical team. Unsubscribe any time.
          </p>
        </div>

        <div>
          {submitted ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-6 py-5">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <p className="text-base font-medium">
                You're subscribed. Look out for our next issue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex w-full items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 focus-within:ring-2 focus-within:ring-white/60">
                <Mail className="h-5 w-5 shrink-0 text-ink/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink/40"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 text-base font-semibold text-white shadow-[0_10px_20px_-6px_rgba(0,0,0,0.4)] hover:bg-ink/90"
              >
                Subscribe
                <Send className="h-4 w-4" />
              </button>
              <p className="text-xs text-white/60">
                No spam. One email a month, unsubscribe any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
