import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing, Typography } from '@/constants/theme';
import type { CatalogDoctor } from '@/data/mock/directory';
import { useTheme } from '@/hooks/use-theme';

export function DoctorCard({
  doctor,
  selected,
  onPress,
  compact,
}: {
  doctor: CatalogDoctor;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <Card
      onPress={onPress}
      style={[styles.card, selected ? { borderColor: theme.primary, borderWidth: 1.5 } : null]}>
      <View style={styles.row}>
        <Avatar name={doctor.name.replace('Dr. ', '')} size={compact ? 40 : 48} />

        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {doctor.specialty} · {doctor.experienceYears} yrs exp
          </Text>
          {compact ? null : (
            <View style={styles.metaRow}>
              <Ionicons name="star" size={12} color={theme.warning} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {doctor.rating} ({doctor.consults} consults)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.fee, { color: theme.text }]}>₹{doctor.fee}</Text>
          {doctor.availableToday ? (
            <Badge label="Today" tone="success" />
          ) : (
            <Badge label="Later" tone="neutral" />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  name: {
    ...Typography.smallStrong,
  },
  meta: {
    ...Typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fee: {
    ...Typography.smallStrong,
    fontWeight: '800',
  },
});
