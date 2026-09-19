import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

/* ------------------------------------------------------------------ *
 * TEMP KEYBOARD BISECT — flip these one at a time, then `expo start -c`.
 * A bare TextInput cycles focus even on /kbd-test, so the cause is one
 * of the app-wide wrappers below (or below React entirely).
 *
 * Suspicion order: GESTURE_HANDLER first (it intercepts every touch),
 * then SPLASH_OVERLAY (absolute Reanimated view over the whole app).
 * ------------------------------------------------------------------ */
const ENABLE_GESTURE_HANDLER = false;
const ENABLE_SPLASH_OVERLAY = false;
const ENABLE_HYDRATION_GATE = false;

// The focus walks every input on the screen in order, below React, and
// survives navigation — that is native focus restoration, which is
// react-native-screens' job. false = fall back to plain Views.
const ENABLE_NATIVE_SCREENS = false;
/* ------------------------------------------------------------------ */

enableScreens(ENABLE_NATIVE_SCREENS);
enableFreeze(false);

SplashScreen.preventAutoHideAsync();
// Native splash cross-fades into the animated overlay instead of cutting.
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const hasHydrated = authHydrated && onboardingHydrated;

  // The overlay normally hides the native splash. With it off, nothing would.
  useEffect(() => {
    if (!ENABLE_SPLASH_OVERLAY) SplashScreen.hideAsync().catch(() => {});
  }, []);

  const showStack = ENABLE_HYDRATION_GATE ? hasHydrated : true;

  const tree = (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {/* Routing waits for the persisted stores so nobody sees the
              login screen flash before their session is restored. */}
          {showStack ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
                animation: 'slide_from_right',
              }}
            />
          ) : null}
          {ENABLE_SPLASH_OVERLAY ? <AnimatedSplashOverlay /> : null}
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );

  if (!ENABLE_GESTURE_HANDLER) return tree;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      {tree}
    </GestureHandlerRootView>
  );
}
