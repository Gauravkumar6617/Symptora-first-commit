import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionSync } from '@/hooks/use-session-sync';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

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
  useSessionSync(authHydrated);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {/* Routing waits for the persisted stores so nobody sees the
                login screen flash before their session is restored. */}
            {hasHydrated ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.background },
                  animation: 'slide_from_right',
                }}
              />
            ) : null}
            <AnimatedSplashOverlay />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
