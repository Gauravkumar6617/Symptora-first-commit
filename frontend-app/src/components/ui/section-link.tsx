import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SectionLink({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.link} accessibilityRole="button">
      <Text style={[styles.linkLabel, { color: theme.primary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={13} color={theme.primary} />
    </Pressable>
  );
}

export function SectionHeaderRow({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? <SectionLink label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkLabel: {
    ...Typography.smallStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  title: {
    ...Typography.section,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
});
