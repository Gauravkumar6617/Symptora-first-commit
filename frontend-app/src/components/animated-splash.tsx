import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { APP_TAGLINE } from '@/data/content';
import { useColorScheme } from '@/hooks/use-color-scheme';

const LOGO_IN = 520;
const HOLD = 420;
const FADE_OUT = 380;

/**
 * Branded splash that continues where the native splash screen (configured in
 * app.json) stops: the same logo on the same background, then the glow, the
 * wordmark and the tagline animate in before the overlay fades away.
 */
export function AnimatedSplashOverlay() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);

  const glow = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.86);
  const taglineOpacity = useSharedValue(0);
  const taglineShift = useSharedValue(12);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    if (!started) return;

    const easing = Easing.out(Easing.cubic);

    glow.set(withTiming(1, { duration: LOGO_IN + 200, easing }));
    logoOpacity.set(withTiming(1, { duration: LOGO_IN, easing }));
    logoScale.set(withTiming(1, { duration: LOGO_IN, easing }));
    taglineOpacity.set(withDelay(220, withTiming(1, { duration: 340, easing })));
    taglineShift.set(withDelay(220, withTiming(0, { duration: 340, easing })));

    overlayOpacity.set(
      withDelay(
        LOGO_IN + HOLD,
        withTiming(0, { duration: FADE_OUT, easing: Easing.in(Easing.quad) }, (finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(setVisible, false);
          }
        }),
      ),
    );
  }, [started, glow, logoOpacity, logoScale, taglineOpacity, taglineShift, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.get() }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.get() * (isDark ? 0.45 : 0.7),
    transform: [{ scale: 0.9 + glow.get() * 0.25 }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.get(),
    transform: [{ scale: logoScale.get() }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.get(),
    transform: [{ translateY: taglineShift.get() }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, overlayStyle]}
      onLayout={() => {
        if (started) return;
        // The native splash stays up until the first frame is laid out, so the
        // handover between the two has no white flash.
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => setStarted(true));
      }}>
      <LinearGradient
        colors={isDark ? Gradient.splashDark : Gradient.splashLight}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.fill}>
        <View style={styles.center}>
          <Animated.View style={[styles.glowWrap, glowStyle]}>
            <Image
              source={require('@/assets/images/logo-glow.png')}
              style={styles.glow}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View style={logoStyle}>
            <Image
              source={require('@/assets/images/symptora-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.Text
            style={[styles.tagline, taglineStyle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {APP_TAGLINE}
          </Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  glowWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: Radius.full,
  },
  logo: {
    width: 240,
    height: 30,
  },
  tagline: {
    ...Typography.small,
    marginTop: Spacing.three,
    textAlign: 'center',
  },
});
