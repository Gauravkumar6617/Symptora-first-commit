import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressScale } from '@/components/ui/press-scale';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import type { Specialty } from '@/data/specialties';
import { useTheme } from '@/hooks/use-theme';

export function SpecialtyChip({
  specialty,
  selected,
  onPress,
}: {
  specialty: Specialty;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <PressScale onPress={onPress} style={styles.pressable}>
      <View style={styles.inner}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: selected ? theme.primary : tint(theme.primary, 0.1),
              borderColor: selected ? theme.primary : 'transparent',
            },
          ]}>
          <Ionicons name={specialty.icon} size={22} color={selected ? theme.onPrimary : theme.primary} />
        </View>
        <Text
          style={[styles.label, { color: selected ? theme.primary : theme.text }]}
          numberOfLines={2}>
          {specialty.label}
        </Text>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 80,
  },
  inner: {
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 30,
    paddingHorizontal: Spacing.half,
  },
});
