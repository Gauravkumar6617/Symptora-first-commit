import { ShieldCheck, Star, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { HeroIllustration } from '@/components/marketing/HeroIllustration'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

interface AuthSplitLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Image / brand side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10"
          aria-hidden
        />

        <div className="relative flex items-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15">
            <Stethoscope className="h-5 w-5" />
          </span>
          {APP_NAME}
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <HeroIllustration />
        </div>

        <div className="relative space-y-5">
          <p className="text-2xl font-bold leading-snug">{APP_TAGLINE}</p>
          <div className="flex items-center gap-4 border-t border-white/20 pt-5">
            <div className="flex items-center gap-2 text-sm text-white/85">
              <Star className="h-4 w-4 fill-warning text-warning" />
              4.8 rating · 25k+ health checks
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <ShieldCheck className="h-4 w-4" />
              Medplum FHIR secured
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
