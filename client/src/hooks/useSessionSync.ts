import { useEffect } from 'react'
import { ApiError, getCurrentUser, toAuthUser } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/**
 * Keeps the persisted session in step with the server. The stored user is
 * only a cache: on load and whenever the tab regains focus it is replaced by
 * GET /users/me, so a role change made elsewhere (an admin approving a
 * doctor, an edit made in the mobile app) shows up without logging out.
 */
export function useSessionSync() {
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    // A session without a token can't call anything protected.
    if (!token) {
      useAuthStore.getState().logout()
      return
    }

    let inFlight = false
    async function sync() {
      if (inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      try {
        const user = await getCurrentUser(token!)
        // Ignore the result if the user logged out or switched accounts meanwhile.
        if (useAuthStore.getState().token === token) {
          useAuthStore.getState().updateProfile(toAuthUser(user))
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          useAuthStore.getState().logout()
        }
        // Offline or server errors keep the cached user.
      } finally {
        inFlight = false
      }
    }

    sync()
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [token, isAuthenticated])
}
