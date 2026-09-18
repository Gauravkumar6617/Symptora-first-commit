import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StackHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Where back goes when there is nothing to pop. */
  fallbackHref?: string;
  /** Hides the bottom hairline, for screens with their own chrome below. */
  borderless?: boolean;
}

export function StackHeader({
  title,
  subtitle,
  right,
  fallbackHref = '/',
  borderless,
}: StackHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.row,
        {
          paddingTop: insets.top + Spacing.two,
          backgroundColor: theme.background,
          borderBottomColor: borderless ? 'transparent' : theme.border,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace(fallbackHref as never);
        }}
        style={[styles.back, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </Pressable>

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? <View style={styles.back} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.section,
  },
  subtitle: {
    ...Typography.caption,
  },
});
