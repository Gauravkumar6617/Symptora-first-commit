import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FieldShell, fieldStyles } from '@/components/ui/text-field';
import { Radius, Shadow, Spacing, Typography, tint } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Sheet heading; defaults to the field label. */
  title?: string;
}

/** Tap-to-open option list — a picker without a native dependency. */
export function SelectField<T extends string>({
  label,
  placeholder = 'Select',
  value,
  options,
  onChange,
  error,
  hint,
  icon,
  title,
}: SelectFieldProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <FieldShell label={label} error={error} hint={hint}>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
        <View
          style={[
            fieldStyles.control,
            {
              borderColor: error ? theme.danger : theme.border,
              backgroundColor: theme.backgroundElement,
            },
          ]}>
          {icon ? <Ionicons name={icon} size={17} color={theme.textMuted} /> : null}
          <Text
            style={[
              styles.value,
              { color: selected ? theme.text : theme.textMuted },
            ]}
            numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={17} color={theme.textSecondary} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              Shadow.lg,
              { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
            ]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{title ?? label ?? 'Select'}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.two }}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      selectionFeedback();
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: isSelected ? tint(theme.primary, 0.1) : 'transparent' },
                    ]}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}>
                      {option.label}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  value: {
    flex: 1,
    ...Typography.body,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sheetTitle: {
    ...Typography.heading,
  },
  list: {
    marginBottom: Spacing.four,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  optionLabel: {
    ...Typography.body,
    fontWeight: '500',
  },
});
