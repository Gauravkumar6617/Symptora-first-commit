import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { StackHeader } from '@/components/ui/stack-header';
import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { getCatalogDoctorById, getClinicById, timeSlots } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const doctor = getCatalogDoctorById(id);

  if (!doctor) {
    return <Redirect href="/(patient)/telemedicine" />;
  }

  const clinic = getClinicById(doctor.clinicId);

  return (
    <Screen header={<StackHeader title="Doctor profile" fallbackHref="/(patient)/telemedicine" />}>
      <LinearGradient
        colors={Gradient.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <Avatar name={doctor.name.replace('Dr. ', '')} size={68} />
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <View style={styles.heroStats}>
          <HeroStat icon="star" value={String(doctor.rating)} label="Rating" />
          <HeroStat icon="people" value={doctor.consults} label="Consults" />
          <HeroStat icon="ribbon" value={`${doctor.experienceYears} yrs`} label="Experience" />
        </View>
      </LinearGradient>

      <Card style={styles.feeCard}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>CONSULTATION FEE</Text>
          <Text style={[styles.feeValue, { color: theme.text }]}>₹{doctor.fee}</Text>
        </View>
        {doctor.availableToday ? (
          <Badge label="Available today" tone="success" icon="checkmark-circle" />
        ) : (
          <Badge label="Next available tomorrow" tone="neutral" icon="time" />
        )}
      </Card>

      <SectionHeaderRow title="Languages" />
      <View style={styles.chips}>
        {doctor.languages.map((language) => (
          <Chip key={language} label={language} />
        ))}
      </View>

      {clinic ? (
        <>
          <SectionHeaderRow title="Practises at" />
          <Card style={{ gap: 5 }}>
            <Text style={[styles.clinicName, { color: theme.text }]}>{clinic.name}</Text>
            <Text style={[styles.clinicMeta, { color: theme.textSecondary }]}>{clinic.address}</Text>
            <View style={styles.clinicRow}>
              <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
              <Text style={[styles.clinicMeta, { color: theme.textSecondary }]}>{clinic.openHours}</Text>
            </View>
            <Button
              label="See all clinics"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(info)/clinics')}
            />
          </Card>
        </>
      ) : null}

      <SectionHeaderRow title="Today's slots" />
      <View style={styles.chips}>
        {timeSlots.slice(0, 6).map((slot) => (
          <Chip key={slot} label={slot} onPress={() => router.push('/(patient)/telemedicine')} />
        ))}
      </View>

      <Card variant="muted" style={styles.note}>
        <Ionicons name="information-circle-outline" size={17} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Video consults include chat follow-ups and an e-prescription at no extra cost.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button
          label="Book a video consult"
          icon="videocam"
          onPress={() => router.push('/(patient)/telemedicine')}
          size="lg"
        />
        <Button
          label="Book an in-person visit"
          variant="outline"
          icon="business-outline"
          onPress={() => router.push('/(patient)/telemedicine')}
        />
      </View>
    </Screen>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.9)" />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.three,
  },
  name: {
    ...Typography.heading,
    color: '#FFFFFF',
    marginTop: Spacing.two,
  },
  specialty: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.88)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  heroStat: {
    alignItems: 'center',
    gap: 1,
  },
  heroStatValue: {
    ...Typography.smallStrong,
    color: '#FFFFFF',
  },
  heroStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  feeLabel: {
    ...Typography.overline,
  },
  feeValue: {
    ...Typography.heading,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
  },
  clinicName: {
    ...Typography.smallStrong,
  },
  clinicMeta: {
    ...Typography.caption,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
});
