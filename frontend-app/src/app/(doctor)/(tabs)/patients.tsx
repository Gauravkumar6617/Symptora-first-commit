import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { useDoctorAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorPatientsScreen() {
  const theme = useTheme();
  const { data: appointments, isLoading } = useDoctorAppointments();
  const [query, setQuery] = useState('');

  const patients = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; visits: number; lastVisit: string; lastMode: 'video' | 'in-person' }
    >();

    for (const appointment of appointments ?? []) {
      const existing = byName.get(appointment.patientName);
      if (existing) {
        existing.visits += 1;
        if (appointment.date > existing.lastVisit) {
          existing.lastVisit = appointment.date;
          existing.lastMode = appointment.mode;
        }
      } else {
        byName.set(appointment.patientName, {
          name: appointment.patientName,
          visits: 1,
          lastVisit: appointment.date,
          lastMode: appointment.mode,
        });
      }
    }

    const list = Array.from(byName.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
    const needle = query.trim().toLowerCase();
    return needle ? list.filter((patient) => patient.name.toLowerCase().includes(needle)) : list;
  }, [appointments, query]);

  return (
    <Screen tabBarInset topInset>
      <ScreenHeader title="Patients" subtitle="Everyone you have consulted" />

      <TextField
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        placeholder="Search a patient"
        autoCorrect={false}
      />

      <View style={styles.list}>
        {isLoading ? (
          <SkeletonList count={3} lines={1} />
        ) : patients.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={query ? 'No patient matches that' : 'No patients yet'}
            description={
              query
                ? 'Check the spelling, or clear the search to see everyone.'
                : 'Patients appear here once you have consulted them.'
            }
            actionLabel={query ? 'Clear search' : undefined}
            onAction={query ? () => setQuery('') : undefined}
          />
        ) : (
          patients.map((patient) => (
            <Card key={patient.name} style={styles.row}>
              <Avatar name={patient.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{patient.name}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {patient.visits} {patient.visits === 1 ? 'visit' : 'visits'} · last{' '}
                  {formatDate(patient.lastVisit)}
                </Text>
              </View>
              <Badge
                label={patient.lastMode === 'video' ? 'Video' : 'Clinic'}
                tone={patient.lastMode === 'video' ? 'primary' : 'teal'}
              />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  name: {
    ...Typography.smallStrong,
    fontSize: 15,
  },
  meta: {
    ...Typography.caption,
  },
});
