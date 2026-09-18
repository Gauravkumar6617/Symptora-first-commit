import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StatTileProps {
  value: string;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'teal' | 'danger';
  /** Renders on a gradient header instead of a card. */
  onGradient?: boolean;
}

export function StatTile({ value, label, tone = 'primary', onGradient }: StatTileProps) {
  const theme = useTheme();
  const color = onGradient ? '#FFFFFF' : theme[tone];

  if (onGradient) {
    return (
      <View style={[styles.tile, styles.glass]}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={[styles.label, { color: 'rgba(255,255,255,0.85)' }]}>{label}</Text>
      </View>
    );
  }

  return (
    <Card style={styles.tile}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </Card>
  );
}

/** 2×2 / 4-up grid wrapper for StatTiles. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingHorizontal: Spacing.two,
  },
  value: {
    ...Typography.heading,
    fontWeight: '800',
  },
  label: {
    ...Typography.caption,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
});
