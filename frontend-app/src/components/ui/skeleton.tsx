import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/** Pulsing placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius = Radius.sm }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(
      withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.skeleton }, animatedStyle]}
    />
  );
}

/** Card-shaped skeletons for list loading states. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={Radius.full} />
        <View style={styles.stack}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      {Array.from({ length: Math.max(0, lines - 1) }).map((_, index) => (
        <Skeleton key={index} height={12} width={index % 2 === 0 ? '90%' : '70%'} />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 3, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <View style={{ gap: Spacing.three }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={lines} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stack: {
    flex: 1,
    gap: 6,
  },
});
