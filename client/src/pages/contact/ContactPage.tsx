import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { FormField } from '@/components/auth/FormField'
import { APP_NAME } from '@/lib/constants'

const channels = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@symptora.health',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 80 4567 8900',
  },
  {
    icon: MapPin,
    label: 'Head office',
    value: '4th Block, Koramangala, Bengaluru',
  },
]

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name || !email || !message) return
    // TODO: wire to a real support/contact endpoint
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Contact us</h1>
        <p className="mt-2 text-sm text-ink/60">
          Questions about {APP_NAME}, a booking, or a partnership — send us a
          message and we'll get back within one business day.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {channels.map((channel) => (
            <div key={channel.label} className="card-raised flex items-start gap-3 p-4">
              <span className="icon-badge h-11 w-11 shrink-0">
                <channel.icon className="h-5 w-5 text-primary-600" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  {channel.label}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {channel.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="card-raised p-6 lg:col-span-2 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="icon-badge h-14 w-14">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-ink">
                Message sent
              </h2>
              <p className="mt-2 max-w-sm text-sm text-ink/60">
                Thanks for reaching out — our team will get back to you at{' '}
                {email} shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="name"
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <FormField
                id="subject"
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
              />
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="mt-1.5 w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Tell us more..."
                />
              </div>
              <button type="submit" className="btn-raised">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
