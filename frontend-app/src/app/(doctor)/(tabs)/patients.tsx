import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useDoctorAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorPatientsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: appointments, isLoading } = useDoctorAppointments();

  const patients = useMemo(() => {
    const map = new Map<string, { name: string; visits: number; lastVisit: string }>();
    appointments?.forEach((appointment) => {
      const existing = map.get(appointment.patientName);
      if (existing) {
        existing.visits += 1;
      } else {
        map.set(appointment.patientName, { name: appointment.patientName, visits: 1, lastVisit: appointment.date });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ScreenHeader title="Patients" subtitle="Everyone you've seen recently" />

      {isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {patients.map((patient) => (
            <Card key={patient.name} style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="person" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{patient.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {patient.visits} visit{patient.visits > 1 ? 's' : ''} · last on {patient.lastVisit}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
});
