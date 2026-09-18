import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  /** Renders a Switch on the right instead of a chevron. */
  switchValue?: boolean;
  onToggle?: (value: boolean) => void;
}

/** One row of a settings/menu list. */
export function ListRow({
  icon,
  label,
  description,
  value,
  onPress,
  tone = 'default',
  switchValue,
  onToggle,
}: ListRowProps) {
  const theme = useTheme();
  const accent = tone === 'danger' ? theme.danger : theme.primary;
  const isSwitch = typeof switchValue === 'boolean';

  return (
    <Card onPress={isSwitch ? undefined : onPress} style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons name={icon} size={17} color={accent} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: tone === 'danger' ? theme.danger : theme.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ true: theme.primary, false: theme.border }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <>
          {value ? <Text style={[styles.value, { color: theme.textSecondary }]}>{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textMuted} /> : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.smallStrong,
  },
  description: {
    ...Typography.caption,
    marginTop: 1,
  },
  value: {
    ...Typography.caption,
  },
});
