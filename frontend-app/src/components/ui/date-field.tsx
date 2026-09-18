import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FieldShell } from '@/components/ui/text-field';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DateParts } from '@/lib/validation';

interface DateFieldProps {
  label?: string;
  value: DateParts;
  onChange: (value: DateParts) => void;
  error?: string;
  hint?: string;
}

/**
 * Day / month / year number inputs. Deliberately not a native date picker:
 * typing a birth year is faster than scrolling decades, and it keeps the
 * form working identically on web.
 */
export function DateField({ label, value, onChange, error, hint }: DateFieldProps) {
  const theme = useTheme();
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  function update(part: keyof DateParts, raw: string) {
    const digits = raw.replace(/\D/g, '');
    const next = { ...value, [part]: digits };
    onChange(next);

    if (part === 'day' && digits.length === 2) monthRef.current?.focus();
    if (part === 'month' && digits.length === 2) yearRef.current?.focus();
  }

  const boxStyle = [
    styles.box,
    { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.backgroundElement },
  ];

  return (
    <FieldShell label={label} error={error} hint={hint}>
      <View style={styles.row}>
        <View style={[boxStyle, styles.small]}>
          <TextInput
            value={value.day}
            onChangeText={(text) => update('day', text)}
            placeholder="DD"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            style={[styles.input, { color: theme.text }]}
            accessibilityLabel="Day"
          />
        </View>
        <Text style={[styles.separator, { color: theme.textMuted }]}>/</Text>
        <View style={[boxStyle, styles.small]}>
          <TextInput
            ref={monthRef}
            value={value.month}
            onChangeText={(text) => update('month', text)}
            placeholder="MM"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            style={[styles.input, { color: theme.text }]}
            accessibilityLabel="Month"
          />
        </View>
        <Text style={[styles.separator, { color: theme.textMuted }]}>/</Text>
        <View style={[boxStyle, styles.large]}>
          <TextInput
            ref={yearRef}
            value={value.year}
            onChangeText={(text) => update('year', text)}
            placeholder="YYYY"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            style={[styles.input, { color: theme.text }]}
            accessibilityLabel="Year"
          />
        </View>
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  box: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
  },
  small: {
    width: 68,
  },
  large: {
    flex: 1,
  },
  input: {
    ...Typography.body,
    paddingVertical: Spacing.two + 4,
    textAlign: 'center',
  },
  separator: {
    ...Typography.body,
    fontWeight: '700',
  },
});
