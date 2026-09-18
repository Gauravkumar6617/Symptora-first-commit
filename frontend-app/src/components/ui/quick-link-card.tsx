import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface QuickLinkCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
  tone?: 'primary' | 'teal' | 'warning' | 'success' | 'danger';
}

export function QuickLinkCard({ icon, title, description, onPress, tone = 'primary' }: QuickLinkCardProps) {
  const theme = useTheme();
  const accent = theme[tone];

  return (
    <View style={styles.slot}>
      <Card onPress={onPress} style={styles.card}>
        <View style={[styles.iconBadge, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  card: {
    gap: 3,
    minHeight: 124,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two - 2,
  },
  title: {
    ...Typography.smallStrong,
  },
  description: {
    ...Typography.caption,
  },
});
