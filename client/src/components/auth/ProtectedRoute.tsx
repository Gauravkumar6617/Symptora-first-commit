import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, toAuthUser } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const { isAuthenticated, token: currentToken, login } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  // The mobile app opens calls here in an in-app browser that shares no
  // session with it, so it passes its token as ?token=. Sign in with it
  // (it wins over any other account logged in in this browser), then drop
  // it from the URL.
  const handoff = new URLSearchParams(location.search).get('token')
  const [adopting, setAdopting] = useState(Boolean(handoff && handoff !== currentToken))

  useEffect(() => {
    if (!handoff) return
    const clean = () => {
      const params = new URLSearchParams(location.search)
      params.delete('token')
      const search = params.toString()
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
    }
    if (handoff === currentToken) {
      clean()
      return
    }
    getCurrentUser(handoff)
      .then((user) => login(toAuthUser(user), handoff))
      .catch(() => {}) // expired/invalid: falls through to the login page
      .finally(() => {
        setAdopting(false)
        clean()
      })
  }, [handoff, currentToken, location.pathname, location.search, login, navigate])

  if (adopting) return <p className="p-8 text-center text-sm text-ink/60">Signing you in…</p>

  if (!isAuthenticated) {
    // Remember where they were going so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
