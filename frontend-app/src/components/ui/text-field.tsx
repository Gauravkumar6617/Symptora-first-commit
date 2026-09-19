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
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
  const [revealed, setRevealed] = useState(false);

  // Focus is a shared value, not React state. Re-rendering this component on
  // focus was making the native input lose focus immediately; driving the ring
  // on the UI thread means focusing causes no React render at all.
  const focus = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.danger
      : interpolateColor(focus.get(), [0, 1], [theme.border, theme.primary]),
    shadowColor: theme.primary,
    shadowOpacity: focus.get() * 0.18,
    shadowRadius: focus.get() * 6,
  }));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}

      <Animated.View
        style={[styles.inputRow, { backgroundColor: theme.backgroundElement }, ringStyle]}>
        {icon ? (
          <Ionicons name={icon} size={17} color={error ? theme.danger : theme.textMuted} />
        ) : null}

        <TextInput
          placeholderTextColor={theme.textMuted}
          {...rest}
          value={value}
          maxLength={maxLength}
          secureTextEntry={password ? !revealed : rest.secureTextEntry}
          onFocus={(event) => {
            focus.set(withTiming(1, { duration: 120 }));
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            focus.set(withTiming(0, { duration: 120 }));
            rest.onBlur?.(event);
          }}
          style={[styles.input, { color: theme.text }, style]}
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
      </Animated.View>

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
    // Always present so focusing never introduces a new style key.
    shadowOffset: { width: 0, height: 0 },
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
