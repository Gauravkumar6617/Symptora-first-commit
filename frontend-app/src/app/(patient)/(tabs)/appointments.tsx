import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { Spacing, Typography } from '@/constants/theme';
import { openVideoCall } from '@/lib/call';
import { useCancelAppointment, usePatientAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

type Filter = 'upcoming' | 'past';

export default function PatientAppointmentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: appointments, isLoading, refetch, isRefetching } = usePatientAppointments();
  const cancelAppointment = useCancelAppointment();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const { upcoming, past } = useMemo(() => {
    const list = appointments ?? [];
    return {
      upcoming: list.filter((item) => item.status === 'scheduled' || item.status === 'rescheduled'),
      past: list.filter((item) => item.status === 'completed' || item.status === 'cancelled'),
    };
  }, [appointments]);

  const visible = filter === 'upcoming' ? upcoming : past;

  function confirmCancel(id: string) {
    Alert.alert('Cancel this appointment?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel appointment',
        style: 'destructive',
        onPress: () => cancelAppointment.mutate(id, { onError: () => Alert.alert('Could not cancel it. Please try again.') }),
      },
    ]);
  }

  return (
    <Screen tabBarInset topInset refreshing={isRefetching} onRefresh={refetch}>
      <ScreenHeader title="Appointments" subtitle="Track visits and book new consults" />

      <SegmentedControl
        options={[
          { value: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { value: 'past', label: `Past (${past.length})` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <View style={styles.list}>
        {isLoading ? (
          <SkeletonList count={3} lines={3} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={filter === 'upcoming' ? 'calendar-outline' : 'time-outline'}
            title={filter === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            description={
              filter === 'upcoming'
                ? 'Book a video consult or an in-person visit and it will show up here.'
                : 'Completed and cancelled visits collect here for your records.'
            }
            actionLabel={filter === 'upcoming' ? 'Book a consult' : undefined}
            onAction={filter === 'upcoming' ? () => router.push('/(patient)/book-appointment') : undefined}
          />
        ) : (
          visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              primaryLabel={appointment.doctorName}
              footer={
                appointment.status === 'scheduled' || appointment.status === 'rescheduled' ? (
                  <View style={styles.footerRow}>
                    <Button
                      label="Join video call"
                      icon="videocam"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => openVideoCall('appointment', appointment.id, accessToken!)}
                    />
                    <Button
                      label="Cancel"
                      variant="ghost"
                      size="sm"
                      onPress={() => confirmCancel(appointment.id)}
                    />
                  </View>
                ) : undefined
              }
            />
          ))
        )}
      </View>

      {visible.length > 0 ? (
        <>
          <Button
            label="Book another consult"
            variant="outline"
            icon="add"
            onPress={() => router.push('/(patient)/book-appointment')}
            style={{ marginTop: Spacing.four }}
          />
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Need to cancel? Do it at least two hours before your slot so it can be released.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
