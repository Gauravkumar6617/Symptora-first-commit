import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { APP_NAME } from '@/data/content';
import { ageFromDob, formatDate, fullName, titleCase } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useHealthCheckStore } from '@/store/healthCheckStore';

/** Shared profile tab for both the patient and doctor tab groups. */
export function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const checks = useHealthCheckStore((state) => state.checks);

  const isDoctor = user?.role === 'doctor';
  const age = ageFromDob(user?.date_of_birth);

  function handleLogout() {
    Alert.alert('Log out?', 'You will need your password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <Screen
      tabBarInset
      padded={false}
      header={
        <LinearGradient
          colors={Gradient.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.four }]}>
          <Avatar uri={user?.avatar_url} name={fullName(user)} size={78} />
          <Text style={styles.name}>{fullName(user) || 'Your profile'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <Badge label={isDoctor ? 'Doctor' : 'Patient'} tone="primary" solid />
            {user?.specialization ? <Badge label={user.specialization} tone="teal" solid /> : null}
            {user?.is_active ? <Badge label="Verified" tone="success" solid icon="checkmark-circle" /> : null}
          </View>
          <Button
            label="Edit profile"
            variant="secondary"
            size="sm"
            icon="pencil"
            style={styles.editButton}
            onPress={() => router.push('/(account)/edit-profile')}
          />
        </LinearGradient>
      }>
      <View style={styles.body}>
        <Card style={styles.detailsCard}>
          <DetailRow label="Phone" value={user?.number ?? 'Not set'} />
          <DetailRow
            label="Date of birth"
            value={user?.date_of_birth ? `${formatDate(user.date_of_birth)}${age != null ? ` · ${age} yrs` : ''}` : 'Not set'}
          />
          <DetailRow label="Gender" value={user?.gender ? titleCase(user.gender) : 'Not set'} />
          <DetailRow label="Address" value={user?.address || 'Not set'} last />
        </Card>

        {isDoctor ? null : (
          <>
            <SectionHeaderRow title="Your care" />
            <View style={{ gap: Spacing.two }}>
              <ListRow
                icon="pulse-outline"
                label="Health Check history"
                description={`${checks.length} saved ${checks.length === 1 ? 'report' : 'reports'}`}
                onPress={() => router.push('/(patient)/health-checks')}
              />
              <ListRow
                icon="calendar-outline"
                label="Appointments"
                onPress={() => router.push('/(patient)/(tabs)/appointments')}
              />
              <ListRow
                icon="people-outline"
                label="Family profiles"
                onPress={() => router.push('/(patient)/(tabs)/family')}
              />
              <ListRow
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push('/(account)/notifications')}
              />
            </View>
          </>
        )}

        <SectionHeaderRow title="Explore" />
        <View style={{ gap: Spacing.two }}>
          <ListRow
            icon="medkit-outline"
            label="Specialties"
            onPress={() => router.push('/(info)/specialties')}
          />
          <ListRow
            icon="business-outline"
            label="Partner clinics"
            onPress={() => router.push('/(info)/clinics')}
          />
          <ListRow
            icon="book-outline"
            label="Health guides"
            onPress={() => router.push('/(info)/blog')}
          />
          <ListRow
            icon="git-branch-outline"
            label="How Symptora works"
            onPress={() => router.push('/(info)/how-it-works')}
          />
        </View>

        <SectionHeaderRow title="Account" />
        <View style={{ gap: Spacing.two }}>
          <ListRow
            icon="settings-outline"
            label="Settings"
            description="Notifications, appearance, data"
            onPress={() => router.push('/(account)/settings')}
          />
          {isDoctor ? null : (
            <ListRow
              icon="briefcase-outline"
              label="Apply as a doctor"
              description="Consult patients on Symptora"
              onPress={() => router.push('/(patient)/apply-doctor')}
            />
          )}
        </View>

        <SectionHeaderRow title="Support" />
        <View style={{ gap: Spacing.two }}>
          <ListRow
            icon="help-circle-outline"
            label="FAQ"
            onPress={() => router.push('/(info)/faq')}
          />
          <ListRow
            icon="information-circle-outline"
            label={`About ${APP_NAME}`}
            onPress={() => router.push('/(info)/about')}
          />
          <ListRow
            icon="mail-outline"
            label="Contact us"
            onPress={() => router.push('/(info)/contact')}
          />
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
        </View>

        <Button
          label="Log out"
          variant="outline"
          icon="log-out-outline"
          onPress={handleLogout}
          style={{ marginTop: Spacing.five }}
        />

        <Text style={[styles.version, { color: theme.textMuted }]}>{APP_NAME} for mobile · v1.0.0</Text>
      </View>
    </Screen>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.detailRow,
        last ? null : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    gap: 4,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  name: {
    ...Typography.heading,
    color: '#FFFFFF',
    marginTop: Spacing.two,
  },
  email: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.88)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  editButton: {
    marginTop: Spacing.three,
    minWidth: 170,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  detailsCard: {
    paddingVertical: Spacing.one,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  detailLabel: {
    ...Typography.caption,
  },
  detailValue: {
    ...Typography.smallStrong,
    flex: 1,
    textAlign: 'right',
  },
  version: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
