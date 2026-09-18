import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { StackHeader } from '@/components/ui/stack-header';
import { MaxFormWidth, Spacing, Typography } from '@/constants/theme';
import { APP_NAME } from '@/data/content';
import { API_BASE_URL, isDemoMode } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useHealthCheckStore } from '@/store/healthCheckStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettingsStore();
  const clearChecks = useHealthCheckStore((state) => state.clearChecks);
  const logout = useAuthStore((state) => state.logout);

  function confirmClearHistory() {
    Alert.alert(
      'Clear Health Check history?',
      'Your saved risk reports will be removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearChecks() },
      ],
    );
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This asks our team to delete your account and clinical records within 30 days. You will be signed out now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request deletion',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  return (
    <Screen
      header={<StackHeader title="Settings" fallbackHref="/" />}
      maxWidth={MaxFormWidth}>
      <SectionHeaderRow title="Notifications" />
      <View style={{ gap: Spacing.two }}>
        <ListRow
          icon="calendar-outline"
          label="Appointment reminders"
          description="An hour before every consult"
          switchValue={settings.appointmentReminders}
          onToggle={() => settings.toggle('appointmentReminders')}
        />
        <ListRow
          icon="pulse-outline"
          label="Health Check nudges"
          description="Monthly check-in for you and your family"
          switchValue={settings.healthCheckNudges}
          onToggle={() => settings.toggle('healthCheckNudges')}
        />
        <ListRow
          icon="megaphone-outline"
          label="Product updates"
          description={`New ${APP_NAME} features and guides`}
          switchValue={settings.productUpdates}
          onToggle={() => settings.toggle('productUpdates')}
        />
      </View>

      <SectionHeaderRow title="App" />
      <View style={{ gap: Spacing.two }}>
        <ListRow
          icon="phone-portrait-outline"
          label="Haptic feedback"
          description="Subtle vibration on taps and results"
          switchValue={settings.hapticsEnabled}
          onToggle={() => settings.toggle('hapticsEnabled')}
        />
        <ListRow
          icon="contrast-outline"
          label="Appearance"
          description="Follows your device light/dark setting"
          value="System"
        />
      </View>

      <SectionHeaderRow title="Data & privacy" />
      <View style={{ gap: Spacing.two }}>
        <ListRow
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => router.push('/(info)/legal/privacy')}
        />
        <ListRow
          icon="document-text-outline"
          label="Terms of service"
          onPress={() => router.push('/(info)/legal/terms')}
        />
        <ListRow
          icon="trash-outline"
          label="Clear Health Check history"
          description="Removes saved risk reports from this device"
          onPress={confirmClearHistory}
        />
        <ListRow
          icon="close-circle-outline"
          label="Delete account"
          description="Requests deletion of your records"
          tone="danger"
          onPress={confirmDeleteAccount}
        />
      </View>

      <Card variant="muted" style={styles.about}>
        <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
          {APP_NAME} for mobile · v1.0.0
        </Text>
        <Text style={[styles.aboutLabel, { color: theme.textMuted }]}>
          {isDemoMode ? 'Running on local demo data' : `Connected to ${API_BASE_URL}`}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  about: {
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.five,
  },
  aboutLabel: {
    ...Typography.caption,
  },
});
