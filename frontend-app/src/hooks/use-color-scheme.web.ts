import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

/**
 * Static web rendering has no colour scheme, so the first (server) paint is
 * always light and the real scheme is picked up once hydrated.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, isClient, isServer);
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
