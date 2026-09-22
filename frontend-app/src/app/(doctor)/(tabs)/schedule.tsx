import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Spacing, Typography } from '@/constants/theme';
import { timeSlots } from '@/data/mock/directory';
import { formatDate } from '@/lib/format';
import { useDoctorAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorScheduleScreen() {
  const theme = useTheme();
  const { data: appointments, isLoading, refetch, isRefetching } = useDoctorAppointments();
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const dates = useMemo(() => {
    const unique = Array.from(new Set((appointments ?? []).map((item) => item.date)));
    return unique.sort();
  }, [appointments]);

  const visible = useMemo(() => {
    const list = appointments ?? [];
    return activeDate ? list.filter((item) => item.date === activeDate) : list;
  }, [appointments, activeDate]);

  return (
    <Screen tabBarInset topInset refreshing={isRefetching} onRefresh={refetch}>
      <ScreenHeader title="Schedule" subtitle="Your consults and availability" />

      <View style={styles.filters}>
        <Chip label="All dates" selected={!activeDate} onPress={() => setActiveDate(null)} />
        {dates.map((date) => (
          <Chip
            key={date}
            label={formatDate(date, { day: 'numeric', month: 'short' })}
            selected={activeDate === date}
            onPress={() => setActiveDate(activeDate === date ? null : date)}
          />
        ))}
      </View>

      {isLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No consults on this day"
          description="Open more slots below and patients can book them straight away."
          actionLabel="Show all dates"
          onAction={() => setActiveDate(null)}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              primaryLabel={appointment.patientName}
            />
          ))}
        </View>
      )}

      <Text style={[styles.heading, { color: theme.text }]}>Your open slots</Text>
      <Card style={{ gap: Spacing.two }}>
        <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
          Patients can book any slot you leave open. Tap to toggle one closed for today.
        </Text>
        <View style={styles.slots}>
          {timeSlots.map((slot) => (
            <Chip key={slot} label={slot} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
    marginBottom: Spacing.three,
  },
  heading: {
    ...Typography.section,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  cardBody: {
    ...Typography.caption,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
  },
});
