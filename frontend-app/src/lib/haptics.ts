import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

/**
 * Haptics are a nice-to-have: they are skipped on web, when the user turns
 * them off in Settings, and any failure is swallowed so a missing Taptic
 * Engine can never break an interaction.
 */
function enabled() {
  return Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled;
}

export function tapFeedback(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (!enabled()) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function selectionFeedback() {
  if (!enabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function successFeedback() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warningFeedback() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function errorFeedback() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
