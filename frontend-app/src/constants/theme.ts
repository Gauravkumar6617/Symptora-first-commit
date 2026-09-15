/**
 * Symptora brand palette, mirrored from client/tailwind.config.js so the
 * mobile app and web app read as the same product.
 */

import '@/global.css';

import { Platform } from 'react-native';

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
  teal: '#0D9488',
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
    background: '#FFFFFF',
    backgroundElement: Brand.surface,
    backgroundSelected: Brand.primary100,
    border: '#E2E8F0',
    primary: Brand.primary600,
    onPrimary: '#FFFFFF',
    card: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#94A3B8',
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    teal: Brand.teal,
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0B1220',
    backgroundElement: '#151E30',
    backgroundSelected: '#1E293B',
    border: '#1E293B',
    primary: Brand.primary400,
    onPrimary: '#0B1220',
    card: '#111A2C',
    tabBarBackground: '#0B1220',
    tabBarInactive: '#64748B',
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    teal: Brand.teal,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
