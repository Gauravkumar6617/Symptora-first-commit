import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorCard } from '@/components/ui/doctor-card';
import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { getSpecialtyBySlug } from '@/data/catalog';
import { useCatalogDoctors } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function SpecialtyDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const specialty = getSpecialtyBySlug(slug);
  const { data: doctors } = useCatalogDoctors();

  if (!specialty) {
    return <Redirect href="/(info)/specialties" />;
  }

  const matchingDoctors = doctors?.filter((doctor) => doctor.specialty === specialty.doctorSpecialty) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title={specialty.label} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <Card style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name={specialty.icon} size={28} color={theme.primary} />
          </View>
          <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{specialty.longDescription}</Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Commonly treated</Text>
        <View style={styles.chips}>
          {specialty.commonFor.map((item) => (
            <View key={item} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Available doctors</Text>
        <View style={{ gap: Spacing.three }}>
          {matchingDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onPress={() => router.push('/(patient)/telemedicine')} />
          ))}
        </View>

        <View style={{ marginTop: Spacing.four }}>
          <Button label="Book a consult" onPress={() => router.push('/(patient)/telemedicine')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  hero: {
    gap: Spacing.two,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
});
