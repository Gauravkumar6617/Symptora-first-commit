import { StyleSheet, View, type ViewProps } from 'react-native';

import { PressScale } from '@/components/ui/press-scale';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardVariant = 'elevated' | 'flat' | 'muted' | 'outline';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  /** Renders the card inside a PressScale when provided. */
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ style, variant = 'elevated', onPress, padded = true, ...rest }: CardProps) {
  const theme = useTheme();

  const surface = [
    styles.base,
    padded ? styles.padded : null,
    {
      backgroundColor: variant === 'muted' ? theme.cardMuted : theme.card,
      borderColor: theme.border,
      borderWidth: variant === 'flat' ? 0 : 1,
      shadowColor: theme.shadow,
    },
    variant === 'elevated' ? Shadow.sm : null,
    style,
  ];

  if (onPress) {
    return (
      <PressScale onPress={onPress}>
        <View style={surface} {...rest} />
      </PressScale>
    );
  }

  return <View style={surface} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
  },
  padded: {
    padding: Spacing.three,
  },
});
