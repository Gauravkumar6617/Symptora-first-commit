import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { APP_NAME } from '@/lib/constants'

const faqs = [
  {
    question: 'How does the Health Check decide my risk level?',
    answer:
      'You answer a short set of questions about your symptoms and vitals. Our triage logic, built with clinicians, scores you Low, Medium, or High risk and explains why — it never replaces a doctor, it tells you how urgently you need one.',
  },
  {
    question: 'What happens if my risk comes back High?',
    answer:
      `${APP_NAME} automatically opens a telemedicine request and connects you to the next available doctor, usually within a few minutes. No searching, no waiting room queue.`,
  },
  {
    question: 'Can I manage healthcare for my parents or kids?',
    answer:
      'Yes. Family Profiles let you link anyone you care for under your account — run Health Checks, book appointments, and view visit history on their behalf, all in one dashboard.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'Your records are stored on a Medplum FHIR backend with end-to-end encryption, and video consults run over WebRTC. Only you and the doctors you consult can see your data.',
  },
  {
    question: 'Do I need to pay for every consultation?',
    answer:
      'Each doctor lists their consultation fee upfront before you book — there are no hidden charges, and follow-up chat messages after a video consult are included at no extra cost.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-ink">Frequently asked questions</h2>
        <p className="mt-1 text-sm text-ink/60">
          Everything else you might want to know before you start.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question} className="card-raised overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-ink">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-primary-600 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-6 text-ink/65">
                  {faq.answer}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
