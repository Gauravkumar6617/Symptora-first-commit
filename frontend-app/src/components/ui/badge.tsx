import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'teal';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Solid badges sit on top of gradients; soft badges sit on cards. */
  solid?: boolean;
}

export function Badge({ label, tone = 'neutral', icon, solid }: BadgeProps) {
  const theme = useTheme();

  const toneColor =
    tone === 'success'
      ? theme.success
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : tone === 'primary'
            ? theme.primary
            : tone === 'teal'
              ? theme.teal
              : theme.textSecondary;

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: solid ? toneColor : tint(toneColor, 0.12) },
      ]}>
      {icon ? <Ionicons name={icon} size={11} color={solid ? '#FFFFFF' : toneColor} /> : null}
      <Text style={[styles.label, { color: solid ? '#FFFFFF' : toneColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.overline,
    textTransform: 'capitalize',
  },
});
