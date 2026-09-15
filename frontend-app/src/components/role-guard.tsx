import { Redirect } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function RoleGuard({ role, children }: PropsWithChildren<{ role: UserRole }>) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== role) {
    return <Redirect href={user.role === 'doctor' ? '/(doctor)/(tabs)' : '/(patient)/(tabs)'} />;
  }

  return <>{children}</>;
}
