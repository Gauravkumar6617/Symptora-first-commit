import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  /** Adds a back chevron on the left. */
  back?: boolean;
  /** Where back goes when there is no history (deep links, refreshes). */
  fallbackHref?: string;
  right?: ReactNode;
  /** Extra content below the title — chips, search, segmented control. */
  children?: ReactNode;
  colors?: readonly [string, string, ...string[]];
  align?: 'left' | 'center';
}

/** Brand gradient page header used across info, auth, and detail screens. */
export function GradientHeader({
  title,
  subtitle,
  back,
  fallbackHref = '/',
  right,
  children,
  colors = Gradient.brand,
  align = 'left',
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrapper, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.topRow}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(fallbackHref as never);
            }}
            style={styles.iconSlot}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.iconSlot} />
        )}
        <View style={{ flex: 1 }} />
        {right ?? <View style={styles.iconSlot} />}
      </View>

      <View style={align === 'center' ? styles.centered : undefined}>
        <Text style={[styles.title, align === 'center' && styles.textCenter]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, align === 'center' && styles.textCenter]}>{subtitle}</Text>
        ) : null}
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconSlot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  centered: {
    alignItems: 'center',
  },
  title: {
    ...Typography.title,
    color: '#FFFFFF',
  },
  subtitle: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
  textCenter: {
    textAlign: 'center',
  },
  children: {
    marginTop: Spacing.three,
  },
});
