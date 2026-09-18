import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Gradient, Radius, tint } from '@/constants/theme';
import { initials } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  /** Renders the brand gradient behind the initials. */
  gradient?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Avatar({ uri, name, size = 48, gradient = false, icon }: AvatarProps) {
  const theme = useTheme();
  const radius = size / 2;
  const fontSize = Math.round(size * 0.36);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  const label = name ? initials(name) : null;

  const content = label ? (
    <Text
      style={[
        styles.label,
        { fontSize, color: gradient ? '#FFFFFF' : theme.primary },
      ]}>
      {label}
    </Text>
  ) : (
    <Ionicons
      name={icon ?? 'person'}
      size={Math.round(size * 0.48)}
      color={gradient ? '#FFFFFF' : theme.primary}
    />
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={Gradient.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrapper, { width: size, height: size, borderRadius: radius }]}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tint(theme.primary, 0.12),
        },
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
