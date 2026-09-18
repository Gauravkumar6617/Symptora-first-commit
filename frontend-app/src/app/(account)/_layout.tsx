import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

/**
 * Account screens shared by patients and doctors (profile editing, settings,
 * notifications). Signed-in only, but not role-specific.
 */
export default function AccountLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
