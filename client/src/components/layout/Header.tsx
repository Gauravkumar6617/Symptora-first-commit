import { Menu, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import symptoraLogo from '@/assets/symptora-logo.png'
import { APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? 'text-primary' : 'text-ink/70'
  }`

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/telemedicine', label: 'Telemedicine' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/family', label: 'Family' },
  { to: '/clinics', label: 'Clinics' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-surface/95 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_2px_6px_rgba(30,41,59,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <img src={symptoraLogo} alt={APP_NAME} className="h-8 w-auto sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navLinkClass}
              end={item.end}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
              >
                <span className="icon-badge h-8 w-8 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-4 w-4 text-primary-600" />
                  )}
                </span>
                {user?.name}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Log in
              </Link>
              <Link to="/signup" className="btn-raised px-4 py-2 text-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg border border-ink/15 p-2 xl:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink/10 bg-white px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.end}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="btn-raised px-4 py-2 text-sm"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
