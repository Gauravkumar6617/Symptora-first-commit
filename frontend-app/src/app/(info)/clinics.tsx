import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useClinics } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function ClinicsScreen() {
  const theme = useTheme();
  const { data: clinics, isLoading } = useClinics();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Partner clinics" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        {isLoading ? null : (
          <View style={{ gap: Spacing.three }}>
            {clinics?.map((clinic) => (
              <Card key={clinic.id} style={{ gap: 6 }}>
                <View style={styles.row}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, flex: 1 }}>{clinic.name}</Text>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={13} color={theme.warning} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{clinic.rating}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{clinic.address}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {clinic.distanceKm} km · {clinic.city}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{clinic.openHours}</Text>
                </View>
                <View style={styles.chips}>
                  {clinic.services.map((service) => (
                    <View key={service} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                      <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>{service}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
