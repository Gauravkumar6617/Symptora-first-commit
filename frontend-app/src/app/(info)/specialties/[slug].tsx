import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DoctorCard } from '@/components/ui/doctor-card';
import { EmptyState } from '@/components/ui/empty-state';
import { GradientHeader } from '@/components/ui/gradient-header';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { SkeletonList } from '@/components/ui/skeleton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getSpecialtyBySlug } from '@/data/catalog';
import { useCatalogDoctors } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function SpecialtyDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const specialty = getSpecialtyBySlug(slug);
  const { data: doctors, isLoading } = useCatalogDoctors();

  if (!specialty) {
    return <Redirect href="/(info)/specialties" />;
  }

  const matchingDoctors =
    doctors?.filter((doctor) => doctor.specialty === specialty.doctorSpecialty) ?? [];

  return (
    <Screen
      header={
        <GradientHeader
          title={specialty.label}
          subtitle={specialty.shortDescription}
          back
          fallbackHref="/(info)/specialties"
          right={
            <View style={styles.headerIcon}>
              <Ionicons name={specialty.icon} size={20} color="#FFFFFF" />
            </View>
          }
        />
      }>
      <Card style={{ gap: Spacing.two }}>
        <Text style={[styles.body, { color: theme.text }]}>{specialty.longDescription}</Text>
      </Card>

      <SectionHeaderRow title="Commonly treated" />
      <View style={styles.chips}>
        {specialty.commonFor.map((item) => (
          <Chip key={item} label={item} />
        ))}
      </View>

      <SectionHeaderRow
        title="Available doctors"
        subtitle={`${matchingDoctors.length} ${specialty.doctorSpecialty} profiles`}
      />
      {isLoading ? (
        <SkeletonList count={2} />
      ) : matchingDoctors.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No doctors listed yet"
          description="We're onboarding specialists in this area. Book a general physician in the meantime."
          actionLabel="Book a consult"
          onAction={() => router.push('/(patient)/telemedicine')}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {matchingDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onPress={() => router.push(`/(patient)/doctors/${doctor.id}`)}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          label="Book a consult"
          icon="calendar-outline"
          onPress={() => router.push('/(patient)/telemedicine')}
        />
        <Button
          label="Run a Health Check first"
          variant="outline"
          onPress={() => router.push('/(patient)/health-check')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...Typography.body,
    lineHeight: 23,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
});
