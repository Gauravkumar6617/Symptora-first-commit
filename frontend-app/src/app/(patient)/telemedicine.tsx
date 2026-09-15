import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DoctorCard } from '@/components/ui/doctor-card';
import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { specialties, timeSlots } from '@/data/catalog';
import { useCatalogDoctors } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

const steps = ['Specialty', 'Doctor', 'Slot'] as const;

export default function TelemedicineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: doctors } = useCatalogDoctors();

  const [step, setStep] = useState(0);
  const [specialtySlug, setSpecialtySlug] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<'video' | 'in-person'>('video');

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    const specialty = specialties.find((s) => s.slug === specialtySlug);
    if (!specialty) return doctors;
    return doctors.filter((doctor) => doctor.specialty === specialty.doctorSpecialty);
  }, [doctors, specialtySlug]);

  const selectedDoctor = doctors?.find((d) => d.id === doctorId);

  function handleConfirm() {
    Alert.alert(
      'Appointment requested',
      `${mode === 'video' ? 'Video consult' : 'In-person visit'} with ${selectedDoctor?.name} at ${slot}. We'll confirm shortly.`,
      [{ text: 'Done', onPress: () => router.replace('/(patient)/(tabs)/appointments') }],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Book a consult" />
      <View style={styles.stepRow}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                { backgroundColor: index <= step ? theme.primary : theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Text style={{ color: index <= step ? theme.onPrimary : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                {index + 1}
              </Text>
            </View>
            <Text style={{ color: index <= step ? theme.text : theme.textSecondary, fontSize: 11, marginTop: 4 }}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        {step === 0 && (
          <View style={{ gap: Spacing.two }}>
            <Pressable
              onPress={() => {
                setSpecialtySlug(null);
                setStep(1);
              }}
              style={[styles.specialtyOption, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Any specialty</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Show every available doctor</Text>
            </Pressable>
            {specialties.map((specialty) => (
              <Pressable
                key={specialty.slug}
                onPress={() => {
                  setSpecialtySlug(specialty.slug);
                  setStep(1);
                }}
                style={[styles.specialtyOption, { borderColor: theme.border }]}>
                <View style={[styles.specialtyIcon, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name={specialty.icon} size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{specialty.label}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{specialty.shortDescription}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: Spacing.three }}>
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                selected={doctor.id === doctorId}
                onPress={() => {
                  setDoctorId(doctor.id);
                  setStep(2);
                }}
              />
            ))}
          </View>
        )}

        {step === 2 && selectedDoctor && (
          <View style={{ gap: Spacing.four }}>
            <View>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{selectedDoctor.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{selectedDoctor.specialty}</Text>
            </View>

            <View>
              <Text style={{ color: theme.text, fontWeight: '700', marginBottom: Spacing.two }}>Consult type</Text>
              <View style={styles.modeRow}>
                {(['video', 'in-person'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setMode(option)}
                    style={[
                      styles.modeOption,
                      { borderColor: mode === option ? theme.primary : theme.border, backgroundColor: mode === option ? theme.backgroundElement : 'transparent' },
                    ]}>
                    <Ionicons
                      name={option === 'video' ? 'videocam' : 'location'}
                      size={16}
                      color={mode === option ? theme.primary : theme.textSecondary}
                    />
                    <Text style={{ color: mode === option ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      {option === 'video' ? 'Video' : 'In person'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: theme.text, fontWeight: '700', marginBottom: Spacing.two }}>Pick a time slot</Text>
              <View style={styles.slotGrid}>
                {timeSlots.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => setSlot(time)}
                    style={[
                      styles.slot,
                      { borderColor: slot === time ? theme.primary : theme.border, backgroundColor: slot === time ? theme.primary : 'transparent' },
                    ]}>
                    <Text style={{ color: slot === time ? theme.onPrimary : theme.text, fontSize: 13, fontWeight: '600' }}>{time}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button label={`Confirm for ₹${selectedDoctor.fee}`} onPress={handleConfirm} disabled={!slot} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.three,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
  },
  specialtyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  specialtyIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  slot: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
