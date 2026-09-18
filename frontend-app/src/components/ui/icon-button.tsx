import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/ui/press-scale';
import { Radius, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  tone?: 'default' | 'onGradient' | 'primary';
  accessibilityLabel: string;
  badgeCount?: number;
}

export function IconButton({
  icon,
  onPress,
  size = 38,
  tone = 'default',
  accessibilityLabel,
  badgeCount,
}: IconButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    tone === 'onGradient'
      ? 'rgba(255,255,255,0.18)'
      : tone === 'primary'
        ? tint(theme.primary, 0.12)
        : theme.backgroundElement;
  const iconColor = tone === 'onGradient' ? '#FFFFFF' : tone === 'primary' ? theme.primary : theme.text;

  return (
    <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.button, { width: size, height: size, backgroundColor }]}>
        <Ionicons name={icon} size={Math.round(size * 0.5)} color={iconColor} />
        {badgeCount ? (
          <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.background }]} />
        ) : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
});
