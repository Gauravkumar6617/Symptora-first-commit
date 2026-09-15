import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useDoctorAppointments } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorScheduleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: appointments, isLoading } = useDoctorAppointments();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ScreenHeader title="Schedule" subtitle="All appointments across your clinic" />

      {isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : appointments && appointments.length > 0 ? (
        <View style={{ gap: Spacing.three }}>
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} primaryLabel={appointment.patientName} />
          ))}
        </View>
      ) : (
        <Text style={{ color: theme.textSecondary }}>Nothing scheduled.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
  },
});
