import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { Card } from '@/components/ui/card';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
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
    const scheduled = appointments?.filter((a) => a.status === 'scheduled').length ?? 0;
    const completed = appointments?.filter((a) => a.status === 'completed').length ?? 0;
    const patients = new Set(appointments?.map((a) => a.patientName)).size;
    return { scheduled, completed, patients };
  }, [appointments]);

  const today = appointments?.filter((a) => a.status === 'scheduled').slice(0, 3);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ScreenHeader
        title={`Welcome, ${user?.name ?? 'Doctor'}`}
        subtitle={user?.specialization ? `${user.specialization} · Today's overview` : "Today's overview"}
      />

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.scheduled}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Upcoming</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.success }]}>{stats.completed}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.teal }]}>{stats.patients}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Patients</Text>
        </Card>
      </View>

      <View style={styles.grid}>
        <QuickLinkCard
          icon="calendar"
          title="View schedule"
          description="See your full day"
          onPress={() => router.push('/(doctor)/(tabs)/schedule')}
        />
        <QuickLinkCard
          icon="people"
          title="My patients"
          description="Browse patient history"
          onPress={() => router.push('/(doctor)/(tabs)/patients')}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Up next</Text>
      {isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : today && today.length > 0 ? (
        <View style={{ gap: Spacing.three }}>
          {today.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} primaryLabel={appointment.patientName} />
          ))}
        </View>
      ) : (
        <Text style={{ color: theme.textSecondary }}>No upcoming appointments.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
});
