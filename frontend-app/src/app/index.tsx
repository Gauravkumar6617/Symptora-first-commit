import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

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
