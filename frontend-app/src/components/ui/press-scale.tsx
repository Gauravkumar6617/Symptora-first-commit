import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { tapFeedback } from '@/lib/haptics';

interface PressScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held. */
  scaleTo?: number;
  haptic?: boolean;
}

/** A Pressable that scales down while held — the app's standard tap feel. */
export function PressScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  disabled,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        scale.set(withTiming(scaleTo, { duration: 90 }));
        if (haptic) tapFeedback();
        onPressIn?.(event);
      }}
      onPressOut={() => {
        scale.set(withTiming(1, { duration: 130 }));
      }}
      style={style}
      {...rest}>
      <Animated.View style={[animatedStyle, { opacity: disabled ? 0.55 : 1 }]}>{children}</Animated.View>
    </Pressable>
  );
}
