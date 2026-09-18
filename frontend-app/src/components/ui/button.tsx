import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressScale } from '@/components/ui/press-scale';
import { Gradient, Radius, Shadow, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; fontSize: number; iconSize: number }> = {
  sm: { paddingVertical: 9, fontSize: 13, iconSize: 15 },
  md: { paddingVertical: 14, fontSize: 15, iconSize: 17 },
  lg: { paddingVertical: 17, fontSize: 16, iconSize: 19 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'leading',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const metrics = sizeStyles[size];

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? theme.primary
        : variant === 'ghost'
          ? theme.textSecondary
          : theme.primary;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'leading' ? (
            <Ionicons name={icon} size={metrics.iconSize} color={textColor} />
          ) : null}
          <Text style={[styles.label, { color: textColor, fontSize: metrics.fontSize }]}>{label}</Text>
          {icon && iconPosition === 'trailing' ? (
            <Ionicons name={icon} size={metrics.iconSize} color={textColor} />
          ) : null}
        </>
      )}
    </View>
  );

  const base: StyleProp<ViewStyle> = [
    styles.base,
    { paddingVertical: metrics.paddingVertical },
  ];

  if (variant === 'primary' || variant === 'danger') {
    return (
      <PressScale onPress={onPress} disabled={isDisabled} style={style} accessibilityRole="button">
        <LinearGradient
          colors={variant === 'danger' ? Gradient.riskHigh : Gradient.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[base, Shadow.sm, { shadowColor: theme.shadow }]}>
          {content}
        </LinearGradient>
      </PressScale>
    );
  }

  const backgroundColor =
    variant === 'secondary' ? tint(theme.primary, 0.1) : variant === 'ghost' ? 'transparent' : 'transparent';

  return (
    <PressScale onPress={onPress} disabled={isDisabled} style={style} accessibilityRole="button">
      <View
        style={[
          base,
          {
            backgroundColor,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderColor: theme.primary,
          },
        ]}>
        {content}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  label: {
    ...Typography.bodyStrong,
    fontWeight: '700',
  },
});
