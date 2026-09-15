import { Dna, Lock, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import symptoraLogo from '@/assets/symptora-logo.png'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <img src={symptoraLogo} alt={APP_NAME} className="h-7 w-auto" />
            <p className="mt-2 max-w-xs text-sm text-ink/60">{APP_TAGLINE}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link to="/" className="hover:text-primary">
                  Health Check
                </Link>
              </li>
              <li>
                <Link to="/telemedicine" className="hover:text-primary">
                  Telemedicine
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-primary">
                  Appointments
                </Link>
              </li>
              <li>
                <Link to="/family" className="hover:text-primary">
                  Family Profiles
                </Link>
              </li>
              <li>
                <Link to="/clinics" className="hover:text-primary">
                  Clinics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link to="/about" className="hover:text-primary">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="/apply-doctor" className="hover:text-primary">
                  Apply as a doctor
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-primary">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Trust</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li className="flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary-600" />
                Medplum FHIR backend
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-600" />
                End-to-end encrypted records
              </li>
              <li className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary-600" />
                WebRTC video consults
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
