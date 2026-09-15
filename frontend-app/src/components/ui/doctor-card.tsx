import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CatalogDoctor } from '@/data/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function DoctorCard({
  doctor,
  selected,
  onPress,
}: {
  doctor: CatalogDoctor;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.card, selected ? { borderColor: theme.primary, borderWidth: 1.5 } : null]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="person" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{doctor.name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {doctor.specialty} · {doctor.experienceYears} yrs exp
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={12} color={theme.warning} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {doctor.rating} ({doctor.consults} consults)
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>₹{doctor.fee}</Text>
            {doctor.availableToday ? <Badge label="Today" tone="success" /> : <Badge label="Later" tone="neutral" />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
