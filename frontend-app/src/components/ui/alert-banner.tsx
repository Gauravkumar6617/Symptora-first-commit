import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const icons: Record<AlertTone, keyof typeof Ionicons.glyphMap> = {
  error: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
  warning: 'warning',
};

export function AlertBanner({ tone = 'info', message }: { tone?: AlertTone; message: string }) {
  const theme = useTheme();
  const color =
    tone === 'error'
      ? theme.danger
      : tone === 'success'
        ? theme.success
        : tone === 'warning'
          ? theme.warning
          : theme.primary;

  return (
    <View style={[styles.banner, { backgroundColor: tint(color, 0.1), borderColor: tint(color, 0.3) }]}>
      <Ionicons name={icons[tone]} size={17} color={color} />
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  message: {
    ...Typography.small,
    flex: 1,
  },
});
