import { Stack } from 'expo-router';

import { RoleGuard } from '@/components/role-guard';

export default function DoctorRootLayout() {
  return (
    <RoleGuard role="doctor">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </RoleGuard>
  );
}
