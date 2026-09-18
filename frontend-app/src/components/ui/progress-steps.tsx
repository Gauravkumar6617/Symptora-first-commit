import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProgressStepsProps {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  /** Compact bar instead of labelled dots. */
  compact?: boolean;
}

export function ProgressSteps({ steps, current, compact }: ProgressStepsProps) {
  const theme = useTheme();

  if (compact) {
    return (
      <View style={styles.barRow}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={[
              styles.barSegment,
              { backgroundColor: index <= current ? theme.primary : theme.border },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.dotRow}>
              {index > 0 ? (
                <View
                  style={[styles.connector, { backgroundColor: index <= current ? theme.primary : theme.border }]}
                />
              ) : (
                <View style={styles.connectorSpacer} />
              )}
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done || active ? theme.primary : theme.backgroundElement,
                    borderColor: done || active ? theme.primary : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.dotLabel,
                    { color: done || active ? theme.onPrimary : theme.textSecondary },
                  ]}>
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[styles.connector, { backgroundColor: index < current ? theme.primary : theme.border }]}
                />
              ) : (
                <View style={styles.connectorSpacer} />
              )}
            </View>
            <Text
              style={[styles.label, { color: active ? theme.text : theme.textSecondary }]}
              numberOfLines={1}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
  },
  connectorSpacer: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
  },
  barRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
  },
});
