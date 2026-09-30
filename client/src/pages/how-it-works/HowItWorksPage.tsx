import { BarChart3, Check, ClipboardList, MessageCircle, Pill, Video, X, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'

// Mirrors frontend-app/src/data/content.ts (howItWorks, telemedicineFeatures, comparisonRows).
const steps = [
  { icon: ClipboardList, title: 'Do a Health Check', description: 'Tell us your symptoms and vitals. It takes about two minutes.' },
  { icon: BarChart3, title: 'Get your risk report', description: 'Our triage engine scores you Low, Medium, or High risk with a clear explanation.' },
  { icon: Video, title: 'Talk to a doctor if needed', description: 'High risk auto-connects you to telemedicine. Low and Medium get self-care tips or a normal booking.' },
]
const features = [
  { icon: Video, title: 'Video consults', description: 'Face-to-face with a doctor, wherever you are.' },
  { icon: MessageCircle, title: 'Chat follow-ups', description: 'Ask quick questions after your visit.' },
  { icon: Pill, title: 'E-prescriptions', description: 'Digital prescriptions, ready at any pharmacy.' },
  { icon: Zap, title: 'Auto-escalation', description: 'High risk skips the queue automatically.' },
]
const rows = [
  ['Know your risk before you decide', true],
  ['Connect to a doctor in minutes', true],
  ['One profile for your whole family', true],
  ['Digital prescription & visit history', true],
  ['Hours in a waiting room', false],
  ['Guessing symptoms on search engines', false],
] as const

const Mark = ({ on }: { on: boolean }) =>
  on ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-slate-300" />

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">How {APP_NAME} works</h1>
      <p className="mt-2 text-slate-600">From a symptom to the right kind of care, in three steps.</p>

      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }, i) => (
          <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 font-bold text-primary">{i + 1}</span>
            <h2 className="mt-3 flex items-center gap-2 font-semibold text-ink"><Icon className="h-4 w-4 text-primary" />{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-xl font-bold text-ink">What you get in a consult</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Icon className="h-5 w-5 text-teal" />
            <h3 className="mt-2 font-semibold text-ink">{title}</h3>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold text-ink">{APP_NAME} vs. figuring it out yourself</h2>
      <table className="mt-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm">
        <thead className="bg-primary-50 text-left">
          <tr><th className="p-3">What matters</th><th className="p-3 text-center text-primary">{APP_NAME}</th><th className="p-3 text-center">Old way</th></tr>
        </thead>
        <tbody>
          {rows.map(([label, ours]) => (
            <tr key={label} className="border-t border-slate-100">
              <td className="p-3">{label}</td><td className="p-3"><Mark on={ours} /></td><td className="p-3"><Mark on={!ours} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link to="/symptom-checker" className="mt-10 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-700">
        Start a Health Check
      </Link>
    </div>
  )
}
