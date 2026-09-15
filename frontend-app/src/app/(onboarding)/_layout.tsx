import { Redirect, Stack } from 'expo-router';

import { useOnboardingStore } from '@/store/onboardingStore';

export default function OnboardingLayout() {
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);

  if (hasOnboarded) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
