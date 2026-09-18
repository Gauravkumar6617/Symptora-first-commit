import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DoctorCard } from '@/components/ui/doctor-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { specialties, timeSlots } from '@/data/catalog';
import { successFeedback } from '@/lib/haptics';
import { useCatalogDoctors } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

const steps = ['Specialty', 'Doctor', 'Slot'] as const;
type Mode = 'video' | 'in-person';

export default function TelemedicineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: doctors, isLoading } = useCatalogDoctors();

  const [step, setStep] = useState(0);
  const [specialtySlug, setSpecialtySlug] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('video');
  const [reason, setReason] = useState('');
  const [onlyToday, setOnlyToday] = useState(false);

  const selectedSpecialty = specialties.find((item) => item.slug === specialtySlug);

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    let list = selectedSpecialty
      ? doctors.filter((doctor) => doctor.specialty === selectedSpecialty.doctorSpecialty)
      : doctors;
    if (onlyToday) list = list.filter((doctor) => doctor.availableToday);
    return list;
  }, [doctors, selectedSpecialty, onlyToday]);

  const selectedDoctor = doctors?.find((doctor) => doctor.id === doctorId);

  function handleConfirm() {
    successFeedback();
    Alert.alert(
      'Appointment requested',
      `${mode === 'video' ? 'Video consult' : 'In-person visit'} with ${selectedDoctor?.name} at ${slot}. We'll confirm shortly.`,
      [{ text: 'Done', onPress: () => router.replace('/(patient)/(tabs)/appointments') }],
    );
  }

  return (
    <Screen
      header={
        <StackHeader
          title="Book a consult"
          subtitle={steps[step]}
          fallbackHref="/(patient)/(tabs)"
        />
      }>
      <ProgressSteps steps={steps} current={step} />

      {step === 0 ? (
        <View style={styles.block}>
          <Text style={[styles.heading, { color: theme.text }]}>What do you need help with?</Text>
          <Card
            onPress={() => {
              setSpecialtySlug(null);
              setStep(1);
            }}
            style={styles.option}>
            <View style={[styles.optionIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
              <Ionicons name="apps" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Any specialty</Text>
              <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>
                Show every available doctor
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Card>

          {specialties.map((specialty) => (
            <Card
              key={specialty.slug}
              onPress={() => {
                setSpecialtySlug(specialty.slug);
                setStep(1);
              }}
              style={styles.option}>
              <View style={[styles.optionIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
                <Ionicons name={specialty.icon} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{specialty.label}</Text>
                <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>
                  {specialty.shortDescription}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Card>
          ))}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.block}>
          <Text style={[styles.heading, { color: theme.text }]}>
            {selectedSpecialty ? `${selectedSpecialty.label} doctors` : 'Available doctors'}
          </Text>
          <View style={styles.filterRow}>
            <Chip label="All" selected={!onlyToday} onPress={() => setOnlyToday(false)} />
            <Chip label="Available today" selected={onlyToday} onPress={() => setOnlyToday(true)} />
          </View>

          {isLoading ? (
            <SkeletonList count={3} />
          ) : filteredDoctors.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No doctors free right now"
              description="Try another specialty or turn off the availability filter."
              actionLabel="Show all doctors"
              onAction={() => {
                setOnlyToday(false);
                setSpecialtySlug(null);
              }}
            />
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                selected={doctorId === doctor.id}
                onPress={() => {
                  setDoctorId(doctor.id);
                  setStep(2);
                }}
              />
            ))
          )}

          <Button label="Back" variant="ghost" size="sm" icon="chevron-back" onPress={() => setStep(0)} />
        </View>
      ) : null}

      {step === 2 && selectedDoctor ? (
        <View style={styles.block}>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>CONSULTING</Text>
            <Text style={[styles.summaryName, { color: theme.text }]}>{selectedDoctor.name}</Text>
            <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>
              {selectedDoctor.specialty} · ₹{selectedDoctor.fee}
            </Text>
          </Card>

          <Text style={[styles.heading, { color: theme.text }]}>How would you like to meet?</Text>
          <SegmentedControl
            options={[
              { value: 'video', label: 'Video consult' },
              { value: 'in-person', label: 'In person' },
            ]}
            value={mode}
            onChange={setMode}
          />

          <Text style={[styles.heading, { color: theme.text }]}>Pick a time</Text>
          <View style={styles.slotGrid}>
            {timeSlots.map((item) => (
              <Chip key={item} label={item} selected={slot === item} onPress={() => setSlot(item)} />
            ))}
          </View>

          <TextField
            label="What's the concern? (optional)"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. chest tightness for two days"
            multiline
            style={styles.multiline}
          />

          <Card variant="muted" style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Fees are shown upfront. Chat follow-ups and an e-prescription are included.
            </Text>
          </Card>

          <Button
            label={slot ? `Confirm ${slot} slot` : 'Pick a slot to continue'}
            onPress={handleConfirm}
            disabled={!slot}
            size="lg"
          />
          <Button label="Back" variant="ghost" size="sm" icon="chevron-back" onPress={() => setStep(1)} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  heading: {
    ...Typography.section,
    marginTop: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    ...Typography.smallStrong,
  },
  optionMeta: {
    ...Typography.caption,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two - 2,
    marginBottom: Spacing.two,
  },
  summaryCard: {
    gap: 2,
  },
  summaryLabel: {
    ...Typography.overline,
  },
  summaryName: {
    ...Typography.section,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
