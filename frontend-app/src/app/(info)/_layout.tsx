import { Stack } from 'expo-router';

/**
 * Informational screens (about, FAQ, legal, catalog). Deliberately not
 * auth-guarded so they can be linked from the login screen.
 */
export default function InfoLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
