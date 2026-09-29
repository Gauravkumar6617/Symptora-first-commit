import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { useIssuePrescription } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import type { Medication } from '@/types';

const emptyMedication: Medication = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

interface PrescriptionFormModalProps {
  visible: boolean;
  kind: 'appointment' | 'telemedicine';
  id: string | null;
  onClose: () => void;
  onIssued: () => void;
}

/** A doctor issues an e-prescription for the visit — synced to the
 * patient's Medplum record as FHIR MedicationRequests in the background. */
export function PrescriptionFormModal({ visible, kind, id, onClose, onIssued }: PrescriptionFormModalProps) {
  const theme = useTheme();
  const issuePrescription = useIssuePrescription();
  const [medications, setMedications] = useState<Medication[]>([{ ...emptyMedication }]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function update(index: number, changes: Partial<Medication>) {
    setMedications((current) => current.map((m, i) => (i === index ? { ...m, ...changes } : m)));
  }

  function remove(index: number) {
    setMedications((current) => current.filter((_, i) => i !== index));
  }

  function reset() {
    setMedications([{ ...emptyMedication }]);
    setNotes('');
    setError('');
  }

  const canSubmit =
    id != null && medications.every((m) => m.name.trim() && m.dosage.trim() && m.frequency.trim() && m.duration.trim());

  async function handleSubmit() {
    if (!canSubmit || !id) return;
    setError('');
    try {
      await issuePrescription.mutateAsync({
        appointment_id: kind === 'appointment' ? id : undefined,
        consultation_id: kind === 'telemedicine' ? id : undefined,
        medications: medications.map((m) => ({ ...m, instructions: m.instructions?.trim() || undefined })),
        notes: notes.trim() || undefined,
      });
      successFeedback();
      reset();
      onIssued();
    } catch {
      errorFeedback();
      setError('Could not issue the prescription. Please try again.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            Shadow.lg,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Issue prescription</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {medications.map((med, index) => (
              <View key={index} style={[styles.medicationCard, { borderColor: theme.border }]}>
                <View style={styles.medicationHeader}>
                  <Text style={[styles.medicationLabel, { color: theme.textMuted }]}>Medication {index + 1}</Text>
                  {medications.length > 1 ? (
                    <Pressable onPress={() => remove(index)} accessibilityLabel="Remove medication" hitSlop={8}>
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <TextField
                  placeholder="Name (e.g. Paracetamol)"
                  value={med.name}
                  onChangeText={(v) => update(index, { name: v })}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      placeholder="Dosage (500mg)"
                      value={med.dosage}
                      onChangeText={(v) => update(index, { dosage: v })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      placeholder="Frequency (2x/day)"
                      value={med.frequency}
                      onChangeText={(v) => update(index, { frequency: v })}
                    />
                  </View>
                </View>
                <TextField
                  placeholder="Duration (5 days)"
                  value={med.duration}
                  onChangeText={(v) => update(index, { duration: v })}
                />
                <TextField
                  placeholder="Instructions (optional, e.g. after food)"
                  value={med.instructions ?? ''}
                  onChangeText={(v) => update(index, { instructions: v })}
                />
              </View>
            ))}

            <Button
              label="Add another medication"
              icon="add"
              variant="ghost"
              size="sm"
              onPress={() => setMedications((current) => [...current, { ...emptyMedication }])}
            />

            <TextField
              label="Notes for the patient (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={styles.multiline}
            />

            {error ? <Text style={{ color: theme.danger, ...Typography.caption }}>{error}</Text> : null}

            <Button
              label={issuePrescription.isPending ? 'Issuing…' : 'Issue prescription'}
              onPress={handleSubmit}
              loading={issuePrescription.isPending}
              disabled={!canSubmit}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  title: {
    ...Typography.heading,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  medicationCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three - 4,
    gap: Spacing.two - 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicationLabel: {
    ...Typography.overline,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
