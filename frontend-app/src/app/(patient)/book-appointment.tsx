import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { fullName, relationshipLabel } from '@/lib/format';
import { useBookAppointment, useClinicDoctors, useDoctorAvailability } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import type { DoctorAvailability, TimeSlot } from '@/types';

const steps = ['Doctor', 'Slot', 'Confirm'] as const;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface OpenSlot {
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
  label: string;
}

/** Availability is a recurring weekly day + AM/PM slot; turn that into the
 * next few actual bookable calendar dates. */
function upcomingSlots(availability: DoctorAvailability[], daysAhead = 21): OpenSlot[] {
  const slots: OpenSlot[] = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const weekday = WEEKDAYS[date.getDay()];
    for (const slot of ['am', 'pm'] as const) {
      if (availability.some((a) => a.days === weekday && a.slot === slot)) {
        slots.push({
          date: date.toISOString().slice(0, 10),
          slot,
          label: `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${slot.toUpperCase()}`,
        });
      }
    }
  }
  return slots;
}

export default function BookAppointmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const members = useFamilyStore((state) => state.members);
  const { data: doctors, isLoading: loadingDoctors } = useClinicDoctors();
  const bookAppointment = useBookAppointment();

  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const selectedDoctor = doctors?.find((d) => d.id === doctorId);
  const { data: availability = [], isFetching: loadingSlots } = useDoctorAvailability(doctorId);
  const openSlots = useMemo(() => upcomingSlots(availability), [availability]);
  const [selectedSlot, setSelectedSlot] = useState<OpenSlot | null>(null);
  const [bookingFor, setBookingFor] = useState('self');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function pickDoctor(id: string) {
    setDoctorId(id);
    setSelectedSlot(null);
    setStep(1);
  }

  async function confirm() {
    if (!selectedDoctor || !selectedSlot || !user) return;
    const member = bookingFor !== 'self' ? members.find((m) => m.id === bookingFor) : null;
    setError('');
    try {
      await bookAppointment.mutateAsync({
        doctor_profile_id: selectedDoctor.id,
        clinic_id: selectedDoctor.clinicId,
        family_member_id: member?.id ?? null,
        patient_name: member?.name ?? fullName(user),
        patient_email: member?.email ?? user.email,
        patient_phone: member?.number ?? user.number,
        reason: reason.trim(),
        appointment_date: selectedSlot.date,
        slot: selectedSlot.slot,
      });
      successFeedback();
      Alert.alert('Appointment booked', "You'll find it under Appointments.", [
        { text: 'Done', onPress: () => router.replace('/(patient)/(tabs)/appointments') },
      ]);
    } catch (err) {
      errorFeedback();
      setError(err instanceof ApiError ? err.message : 'Could not book this appointment.');
    }
  }

  const bookingForOptions = [
    { value: 'self', label: 'Myself' },
    ...members.map((m) => ({ value: m.id, label: `${m.name} (${relationshipLabel(m.relation)})` })),
  ];

  return (
    <Screen
      header={
        <StackHeader
          title="Book an appointment"
          subtitle={steps[step]}
          fallbackHref="/(patient)/(tabs)/appointments"
        />
      }>
      <ProgressSteps steps={steps} current={step} />

      {step === 0 ? (
        <View style={styles.block}>
          <Text style={[styles.heading, { color: theme.text }]}>Pick a doctor</Text>
          {loadingDoctors ? (
            <SkeletonList count={3} />
          ) : !doctors || doctors.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No doctors available"
              description="Check back soon — clinics add doctors regularly."
            />
          ) : (
            doctors.map((doctor) => (
              <Card key={doctor.id} onPress={() => pickDoctor(doctor.id)} style={styles.option}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{doctor.name}</Text>
                  <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>
                    {doctor.specialization} · {doctor.clinicName}
                  </Text>
                  {doctor.fee != null ? (
                    <Text style={[styles.optionMeta, { color: theme.textMuted }]}>₹{doctor.fee}</Text>
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}

      {step === 1 && selectedDoctor ? (
        <View style={styles.block}>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>BOOKING WITH</Text>
            <Text style={[styles.summaryName, { color: theme.text }]}>{selectedDoctor.name}</Text>
            <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>
              {selectedDoctor.specialization} · {selectedDoctor.clinicName}
            </Text>
          </Card>

          <Text style={[styles.heading, { color: theme.text }]}>Pick a time</Text>
          {loadingSlots ? (
            <SkeletonList count={2} />
          ) : openSlots.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No open slots"
              description="This doctor has no availability in the next 3 weeks."
            />
          ) : (
            <View style={styles.slotGrid}>
              {openSlots.map((slot) => (
                <Chip
                  key={`${slot.date}-${slot.slot}`}
                  label={slot.label}
                  selected={selectedSlot?.date === slot.date && selectedSlot?.slot === slot.slot}
                  onPress={() => setSelectedSlot(slot)}
                />
              ))}
            </View>
          )}

          <Button label="Continue" onPress={() => setStep(2)} disabled={!selectedSlot} size="lg" />
          <Button label="Back" variant="ghost" size="sm" icon="chevron-back" onPress={() => setStep(0)} />
        </View>
      ) : null}

      {step === 2 && selectedDoctor && selectedSlot ? (
        <View style={styles.block}>
          {members.length > 0 ? (
            <SelectField
              label="Booking for"
              value={bookingFor}
              options={bookingForOptions}
              onChange={setBookingFor}
            />
          ) : null}

          <TextField
            label="Reason for visit"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Recurring headaches for the past week"
            multiline
            style={styles.multiline}
          />

          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryName, { color: theme.text }]}>
              {selectedDoctor.name} · {selectedDoctor.clinicName}
            </Text>
            <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>{selectedSlot.label}</Text>
            {selectedDoctor.fee != null ? (
              <Text style={[styles.optionMeta, { color: theme.textSecondary }]}>Fee: ₹{selectedDoctor.fee}</Text>
            ) : null}
          </Card>

          {error ? <AlertBanner tone="error" message={error} /> : null}

          <Button
            label={bookAppointment.isPending ? 'Booking…' : 'Confirm appointment'}
            onPress={confirm}
            loading={bookAppointment.isPending}
            disabled={reason.trim().length < 3}
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
  optionTitle: {
    ...Typography.smallStrong,
  },
  optionMeta: {
    ...Typography.caption,
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
});
