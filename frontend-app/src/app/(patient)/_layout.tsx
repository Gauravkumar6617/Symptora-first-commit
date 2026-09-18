import { Stack } from 'expo-router';

import { RoleGuard } from '@/components/role-guard';

export default function PatientRootLayout() {
  return (
    <RoleGuard role="patient">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </RoleGuard>
  );
}
