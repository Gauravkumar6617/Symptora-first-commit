import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { Spacing, Typography } from '@/constants/theme';
import { usePatientAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'upcoming' | 'past';

export default function PatientAppointmentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: appointments, isLoading, refetch, isRefetching } = usePatientAppointments();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const { upcoming, past } = useMemo(() => {
    const list = appointments ?? [];
    return {
      upcoming: list.filter((item) => item.status === 'scheduled' || item.status === 'rescheduled'),
      past: list.filter((item) => item.status === 'completed' || item.status === 'cancelled'),
    };
  }, [appointments]);

  const visible = filter === 'upcoming' ? upcoming : past;

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
            onAction={filter === 'upcoming' ? () => router.push('/(patient)/telemedicine') : undefined}
          />
        ) : (
          visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              primaryLabel={appointment.doctorName}
              onPress={() => router.push('/(patient)/telemedicine')}
              footer={
                appointment.status === 'scheduled' && appointment.mode === 'video' ? (
                  <Button
                    label="Join video consult"
                    icon="videocam"
                    size="sm"
                    onPress={() => router.push('/(patient)/telemedicine')}
                  />
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
            onPress={() => router.push('/(patient)/telemedicine')}
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
  note: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
