import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Appointment } from '@/types';

const statusTone: Record<Appointment['status'], 'success' | 'warning' | 'danger' | 'neutral' | 'primary'> = {
  scheduled: 'primary',
  rescheduled: 'warning',
  cancelled: 'danger',
  completed: 'success',
};

export function AppointmentCard({ appointment, primaryLabel }: { appointment: Appointment; primaryLabel: string }) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.name, { color: theme.text }]}>{primaryLabel}</Text>
        <Badge label={appointment.status} tone={statusTone[appointment.status] ?? 'neutral'} />
      </View>
      <Text style={[styles.meta, { color: theme.textSecondary }]}>{appointment.specialization}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{appointment.date}</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{appointment.time}</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons
            name={appointment.mode === 'video' ? 'videocam-outline' : 'location-outline'}
            size={14}
            color={theme.textSecondary}
          />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {appointment.mode === 'video' ? 'Video consult' : 'In person'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
});
