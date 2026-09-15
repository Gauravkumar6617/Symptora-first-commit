import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="card-raised relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-8 py-14 text-center text-white sm:px-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10"
          aria-hidden
        />
        <h2 className="relative text-2xl font-bold sm:text-3xl">
          Don't wait until it's an emergency
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
          Run your first Health Check with {APP_NAME} in under two minutes —
          free, and no appointment needed to get started.
        </p>
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-[0_10px_20px_-6px_rgba(0,0,0,0.35)] hover:bg-white/90"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/telemedicine"
            className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            See how telemedicine works
          </Link>
        </div>
      </div>
    </section>
  )
}
