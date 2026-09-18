import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { Gradient, Spacing, Typography } from '@/constants/theme';
import { APP_TAGLINE } from '@/data/content';
import { useColorScheme } from '@/hooks/use-color-scheme';

const VISIBLE_MS = 700;

/**
 * Web build of the splash overlay. There is no native splash screen to hand
 * over from, so it simply fades itself out on a timer with the same visuals.
 */
export function AnimatedSplashOverlay() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [visible, setVisible] = useState(true);
  const opacity = useAnimatedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <LinearGradient
        colors={isDark ? Gradient.splashDark : Gradient.splashLight}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.fill}>
        <View style={styles.center}>
          <Image
            source={require('@/assets/images/symptora-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }]}>{APP_TAGLINE}</Text>
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
