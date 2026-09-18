import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Sits on a gradient header rather than a page background. */
  onGradient?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  onGradient,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: onGradient ? 'rgba(255,255,255,0.18)' : theme.backgroundElement,
          borderColor: onGradient ? 'transparent' : theme.border,
        },
      ]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              selectionFeedback();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected
                ? { backgroundColor: onGradient ? '#FFFFFF' : theme.card, borderColor: theme.border }
                : null,
            ]}>
            <Text
              style={[
                styles.label,
                {
                  color: selected
                    ? onGradient
                      ? theme.primary
                      : theme.text
                    : onGradient
                      ? 'rgba(255,255,255,0.85)'
                      : theme.textSecondary,
                },
              ]}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.sm + 2,
  },
  label: {
    ...Typography.smallStrong,
    fontWeight: '700',
  },
});
