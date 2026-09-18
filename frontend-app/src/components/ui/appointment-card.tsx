import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { Appointment } from '@/types';

const statusTone: Record<Appointment['status'], BadgeTone> = {
  scheduled: 'primary',
  rescheduled: 'warning',
  cancelled: 'danger',
  completed: 'success',
};

interface AppointmentCardProps {
  appointment: Appointment;
  /** The name shown as the card title (doctor for patients, patient for doctors). */
  primaryLabel: string;
  onPress?: () => void;
  /** Adds a Join call / Details footer for upcoming video consults. */
  footer?: React.ReactNode;
}

export function AppointmentCard({ appointment, primaryLabel, onPress, footer }: AppointmentCardProps) {
  const theme = useTheme();
  const isVideo = appointment.mode === 'video';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.modeBadge, { backgroundColor: tint(isVideo ? theme.primary : theme.teal, 0.12) }]}>
          <Ionicons
            name={isVideo ? 'videocam' : 'business'}
            size={18}
            color={isVideo ? theme.primary : theme.teal}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {primaryLabel}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {appointment.specialization}
          </Text>
        </View>

        <Badge label={appointment.status} tone={statusTone[appointment.status] ?? 'neutral'} />
      </View>

      {appointment.reason ? (
        <Text style={[styles.reason, { color: theme.textSecondary }]} numberOfLines={2}>
          {appointment.reason}
        </Text>
      ) : null}

      <View style={styles.detailsRow}>
        <Detail icon="calendar-outline" text={formatDate(appointment.date)} />
        <Detail icon="time-outline" text={appointment.time} />
        <Detail
          icon={isVideo ? 'videocam-outline' : 'location-outline'}
          text={isVideo ? 'Video consult' : (appointment.clinic ?? 'In person')}
        />
      </View>

      {footer}
    </Card>
  );
}

function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={13} color={theme.textSecondary} />
      <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  modeBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...Typography.smallStrong,
  },
  meta: {
    ...Typography.caption,
  },
  reason: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  detailText: {
    ...Typography.caption,
  },
});
