import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  children?: React.ReactNode;
  error?: string;
  /** Renders a circle instead of a square, for single-choice lists. */
  radio?: boolean;
}

export function Checkbox({ checked, onChange, label, children, error, radio }: CheckboxProps) {
  const theme = useTheme();

  return (
    <View>
      <Pressable
        style={styles.row}
        accessibilityRole={radio ? 'radio' : 'checkbox'}
        accessibilityState={{ checked }}
        onPress={() => {
          selectionFeedback();
          onChange(!checked);
        }}>
        <View
          style={[
            styles.box,
            radio ? styles.radio : null,
            {
              borderColor: error ? theme.danger : checked ? theme.primary : theme.borderStrong,
              backgroundColor: checked ? theme.primary : 'transparent',
            },
          ]}>
          {checked ? (
            <Ionicons name={radio ? 'ellipse' : 'checkmark'} size={radio ? 8 : 14} color={theme.onPrimary} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          {children ?? <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
        </View>
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.small,
  },
  error: {
    ...Typography.caption,
    marginTop: 4,
    marginLeft: 34,
  },
});
