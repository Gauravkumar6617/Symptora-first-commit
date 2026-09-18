import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

/**
 * Entry route: sends people to onboarding, auth, or their role's tabs. The
 * persisted stores are already hydrated by the time this renders (see
 * app/_layout.tsx), so there is no intermediate flash.
 */
export default function RootIndex() {
  const { isAuthenticated, user } = useAuthStore();
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={user.role === 'doctor' ? '/(doctor)/(tabs)' : '/(patient)/(tabs)'} />;
}
