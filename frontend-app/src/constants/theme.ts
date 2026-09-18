/**
 * Symptora design tokens.
 *
 * The palette mirrors client/tailwind.config.js so the mobile app and the web
 * app read as the same product; everything else here (typography, shadows,
 * gradients) is the mobile-side design system the screens are built from.
 */

import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Brand = {
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  primary300: '#93C5FD',
  primary400: '#60A5FA',
  primary500: '#3B82F6',
  primary600: '#2563EB',
  primary700: '#1D4ED8',
  primary800: '#1E40AF',
  primary900: '#172554',
  teal: '#0D9488',
  tealDark: '#0F766E',
  secondary: '#10B981',
  surface: '#F5F9FF',
  ink: '#1E293B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const Colors = {
  light: {
    text: Brand.ink,
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#FFFFFF',
    backgroundElement: Brand.surface,
    backgroundSelected: Brand.primary100,
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    primary: Brand.primary600,
    primaryMuted: Brand.primary50,
    onPrimary: '#FFFFFF',
    card: '#FFFFFF',
    cardMuted: Brand.surface,
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#94A3B8',
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    teal: Brand.teal,
    skeleton: '#E9EFF7',
    overlay: 'rgba(15, 23, 42, 0.45)',
    shadow: '#0F172A',
    onGradient: '#FFFFFF',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0B1220',
    backgroundElement: '#151E30',
    backgroundSelected: '#1E293B',
    border: '#1E293B',
    borderStrong: '#334155',
    primary: Brand.primary400,
    primaryMuted: '#152238',
    onPrimary: '#0B1220',
    card: '#111A2C',
    cardMuted: '#0F1829',
    tabBarBackground: '#0B1220',
    tabBarInactive: '#64748B',
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    teal: '#2DD4BF',
    skeleton: '#1B2537',
    overlay: 'rgba(2, 6, 23, 0.6)',
    shadow: '#000000',
    onGradient: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

/** Shared type scale. Spread into a Text style, then add a color. */
export const Typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  smallStrong: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.6 },
} satisfies Record<string, TextStyle>;

/** Elevation presets. shadowColor is set by the consumer from the theme. */
export const Shadow = {
  none: {},
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;

/** LinearGradient colour stops. Tuples so they satisfy the `colors` prop. */
export const Gradient = {
  brand: [Brand.primary500, Brand.primary700] as const,
  brandDeep: [Brand.primary700, Brand.primary900] as const,
  teal: [Brand.teal, Brand.primary600] as const,
  sunrise: [Brand.warning, '#FB7185'] as const,
  splashLight: ['#FFFFFF', Brand.primary50] as const,
  splashDark: ['#0B1220', '#111A2C'] as const,
  riskLow: [Brand.success, Brand.teal] as const,
  riskMedium: [Brand.warning, '#F97316'] as const,
  riskHigh: [Brand.danger, '#B91C1C'] as const,
} as const;

/** Risk level → colour + copy, matching backend enumModel.RiskLevel. */
export const RiskTone = {
  low: { color: Brand.success, gradient: Gradient.riskLow, label: 'Low risk' },
  medium: { color: Brand.warning, gradient: Gradient.riskMedium, label: 'Medium risk' },
  high: { color: Brand.danger, gradient: Gradient.riskHigh, label: 'High risk' },
} as const;

/** Adds an alpha channel to a 6-digit hex colour (e.g. tint('#2563EB', 0.12)). */
export function tint(hex: string, alpha: number) {
  const clamped = Math.max(0, Math.min(1, alpha));
  const value = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}

export const TabBarHeight = 64;
export const BottomTabInset = Platform.select({ ios: 74, android: 84, default: 84 });
export const MaxContentWidth = 800;
export const MaxFormWidth = 480;
