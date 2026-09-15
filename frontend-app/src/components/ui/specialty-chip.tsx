import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Specialty } from '@/data/catalog';

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
    <Pressable onPress={onPress} style={styles.pressable}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: selected ? theme.primary : theme.backgroundElement,
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}>
        <Ionicons name={specialty.icon} size={22} color={selected ? theme.onPrimary : theme.primary} />
      </View>
      <Text style={[styles.label, { color: selected ? theme.primary : theme.text }]} numberOfLines={1}>
        {specialty.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    width: 76,
    gap: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
