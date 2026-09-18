import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, RiskTone, Spacing, Typography, tint } from '@/constants/theme';
import type { RiskLevel } from '@/types';

const icons: Record<RiskLevel, keyof typeof Ionicons.glyphMap> = {
  low: 'checkmark-circle',
  medium: 'alert-circle',
  high: 'warning',
};

export function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' }) {
  const tone = RiskTone[level];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <View style={[styles.badge, { backgroundColor: tint(tone.color, 0.14) }]}>
      <Ionicons name={icons[level]} size={iconSize} color={tone.color} />
      <Text style={[styles.label, { color: tone.color, fontSize: size === 'sm' ? 11 : 12 }]}>{tone.label}</Text>
    </View>
  );
}

/** Big score ring used on the Health Check result screen. */
export function RiskScoreDial({ level, score }: { level: RiskLevel; score: number }) {
  const tone = RiskTone[level];

  return (
    <LinearGradient
      colors={tone.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.dial}>
      <Text style={styles.dialScore}>{score}</Text>
      <Text style={styles.dialLabel}>{tone.label.toUpperCase()}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  label: {
    fontWeight: '700',
  },
  dial: {
    width: 132,
    height: 132,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dialScore: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dialLabel: {
    ...Typography.overline,
    color: 'rgba(255,255,255,0.9)',
  },
});
