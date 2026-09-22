import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ApiError, fetchCurrentUser, isDemoMode } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

/**
 * Keeps the persisted session in step with the server. The stored user is
 * only a cache: on launch and whenever the app returns to the foreground it
 * is replaced by GET /users/me, so a role change made elsewhere (an admin
 * approving a doctor) shows up here without logging out. RoleGuard then
 * moves the user to the right tab group.
 */
export function useSessionSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled || isDemoMode) return;

    let inFlight = false;
    async function sync() {
      const { isAuthenticated, accessToken, updateProfile, logout } = useAuthStore.getState();
      if (!isAuthenticated) return;
      // A session without a token can't call anything protected.
      if (!accessToken) {
        logout();
        return;
      }
      if (inFlight) return;
      inFlight = true;
      try {
        const user = await fetchCurrentUser(accessToken);
        // Ignore the result if the user logged out or switched accounts meanwhile.
        if (useAuthStore.getState().accessToken === accessToken) updateProfile(user);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout();
        // Offline or server errors keep the cached user.
      } finally {
        inFlight = false;
      }
    }

    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [enabled]);
}
