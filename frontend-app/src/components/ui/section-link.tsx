import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SectionLink({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

export function SectionHeaderRow({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles2.row}>
      <Text style={[styles2.title, { color: theme.text }]}>{title}</Text>
      {actionLabel ? <SectionLink label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles2 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
});
