import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Shows a reveal toggle and manages secureTextEntry itself. */
  password?: boolean;
  maxLength?: number;
  /** Shows "12/24" under the field. Needs maxLength. */
  showCounter?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  password,
  style,
  showCounter,
  maxLength,
  value,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: theme.backgroundElement,
            shadowColor: focused ? theme.primary : 'transparent',
          },
          focused ? styles.focusRing : null,
        ]}>
        {icon ? (
          <Ionicons name={icon} size={17} color={error ? theme.danger : focused ? theme.primary : theme.textMuted} />
        ) : null}

        <TextInput
          value={value}
          maxLength={maxLength}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={password ? !revealed : rest.secureTextEntry}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />

        {password ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={19} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          {error ? (
            <Text style={[styles.message, { color: theme.danger }]}>{error}</Text>
          ) : hint ? (
            <Text style={[styles.message, { color: theme.textSecondary }]}>{hint}</Text>
          ) : null}
        </View>
        {showCounter && maxLength ? (
          <Text style={[styles.message, { color: theme.textMuted }]}>
            {(value ?? '').length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Shared field-label + error chrome for non-TextInput controls. */
export function FieldShell({
  label,
  error,
  hint,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
      {children}
      {error ? (
        <Text style={[styles.message, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 50,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...Typography.label,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  focusRing: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.two + 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 0,
  },
  message: {
    ...Typography.caption,
  },
});

export const FIELD_TINT = tint;
