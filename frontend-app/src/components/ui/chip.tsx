import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter/tag pill. Static when no onPress is given. */
export function Chip({ label, icon, selected, onPress }: ChipProps) {
  const theme = useTheme();

  const body = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : tint(theme.primary, 0.08),
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      {icon ? (
        <Ionicons name={icon} size={13} color={selected ? theme.onPrimary : theme.primary} />
      ) : null}
      <Text style={[styles.label, { color: selected ? theme.onPrimary : theme.primary }]}>{label}</Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={() => {
        selectionFeedback();
        onPress();
      }}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
