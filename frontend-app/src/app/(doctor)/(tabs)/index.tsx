import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MyClinicsCard } from '@/components/my-clinics-card';
import { AppointmentCard } from '@/components/ui/appointment-card';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { fullName } from '@/lib/format';
import { useDoctorAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

export default function DoctorHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: appointments, isLoading } = useDoctorAppointments();

  const stats = useMemo(() => {
    const list = appointments ?? [];
    return {
      upcoming: list.filter((item) => item.status === 'scheduled').length,
      completed: list.filter((item) => item.status === 'completed').length,
      patients: new Set(list.map((item) => item.patientName)).size,
    };
  }, [appointments]);

  const todayList = appointments?.filter((item) => item.status === 'scheduled') ?? [];

  return (
    <Screen
      tabBarInset
      padded={false}
      header={
        <LinearGradient
          colors={Gradient.brandDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.headerRow}>
            <Avatar uri={user?.avatar_url} name={fullName(user)} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>Good to see you</Text>
              <Text style={styles.greeting}>Dr. {user?.last_name ?? ''}</Text>
            </View>
            <IconButton
              icon="notifications-outline"
              tone="onGradient"
              accessibilityLabel="Notifications"
              onPress={() => router.push('/(account)/notifications')}
            />
          </View>

          <Text style={styles.subline}>
            {user?.specialization ? `${user.specialization} · ` : ''}
            {stats.upcoming} consult{stats.upcoming === 1 ? '' : 's'} scheduled
          </Text>

          <View style={styles.statRow}>
            <StatTile value={String(stats.upcoming)} label="Upcoming" onGradient />
            <StatTile value={String(stats.completed)} label="Completed" onGradient />
            <StatTile value={String(stats.patients)} label="Patients" onGradient />
          </View>
        </LinearGradient>
      }>
      <View style={styles.body}>
        <SectionHeaderRow
          title="Today's consults"
          actionLabel="Full schedule"
          onAction={() => router.push('/(doctor)/(tabs)/schedule')}
        />

        {isLoading ? (
          <SkeletonList count={2} lines={3} />
        ) : todayList.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nothing scheduled"
            description="New bookings and auto-escalated High risk checks will appear here."
          />
        ) : (
          <View style={{ gap: Spacing.three }}>
            {todayList.slice(0, 3).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                primaryLabel={appointment.patientName}
                onPress={() => router.push('/(doctor)/(tabs)/schedule')}
              />
            ))}
          </View>
        )}

        <SectionHeaderRow title="Quick actions" />
        <View style={styles.grid}>
          <QuickLinkCard
            icon="calendar"
            title="My schedule"
            description="Availability and slots"
            onPress={() => router.push('/(doctor)/(tabs)/schedule')}
          />
          <QuickLinkCard
            icon="people"
            title="My patients"
            description="Visit history and notes"
            tone="teal"
            onPress={() => router.push('/(doctor)/(tabs)/patients')}
          />
          <QuickLinkCard
            icon="person-circle"
            title="My profile"
            description="Fee, languages, specialty"
            tone="warning"
            onPress={() => router.push('/(doctor)/(tabs)/profile')}
          />
          <QuickLinkCard
            icon="book"
            title="Health guides"
            description="Share reading with patients"
            tone="success"
            onPress={() => router.push('/(info)/blog')}
          />
        </View>

        <MyClinicsCard />

        <Card variant="muted" style={styles.note}>
          <Ionicons name="flash" size={17} color={theme.warning} />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            High risk Health Checks in your specialty are escalated to you automatically — they arrive at
            the top of today&apos;s list.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  welcome: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  greeting: {
    ...Typography.heading,
    color: '#FFFFFF',
  },
  subline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.88)',
    marginTop: -Spacing.two,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.five,
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
