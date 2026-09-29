import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography, tint } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { errorFeedback } from '@/lib/haptics';
import { relationshipLabel } from '@/lib/format';
import { useStartConsultation } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useFamilyStore } from '@/store/familyStore';

/** Instant, patient-started video consultation — no doctor or clinic picked
 * in advance; whichever approved doctor accepts first joins the call. For a
 * scheduled visit with a specific doctor, see book-appointment.tsx instead. */
export default function TelemedicineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const members = useFamilyStore((state) => state.members);
  const startConsultation = useStartConsultation();

  const [startFor, setStartFor] = useState('self');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const forOptions = [
    { value: 'self', label: 'Myself' },
    ...members.map((m) => ({ value: m.id, label: `${m.name} (${relationshipLabel(m.relation)})` })),
  ];

  async function handleStart() {
    setError('');
    try {
      const member = startFor !== 'self' ? members.find((m) => m.id === startFor) : null;
      const consultation = await startConsultation.mutateAsync({
        family_member_id: member?.id ?? null,
        reason: reason.trim(),
      });
      router.replace({ pathname: '/(patient)/telemedicine-waiting/[id]', params: { id: consultation.id } });
    } catch (err) {
      errorFeedback();
      setError(err instanceof ApiError ? err.message : 'Could not start the consultation.');
    }
  }

  return (
    <Screen header={<StackHeader title="Start instant consult" fallbackHref="/(patient)/(tabs)" />} keyboardAware>
      <Card variant="muted" style={styles.intro}>
        <View style={[styles.introIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
          <Ionicons name="videocam" size={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.introTitle, { color: theme.text }]}>See the next available doctor</Text>
          <Text style={[styles.introBody, { color: theme.textSecondary }]}>
            We notify every doctor online right now. The first one to accept starts a video call with you
            in minutes.
          </Text>
        </View>
      </Card>

      <Card style={{ gap: Spacing.three }}>
        {members.length > 0 ? (
          <SelectField label="For" value={startFor} options={forOptions} onChange={setStartFor} />
        ) : null}

        <TextField
          label="What's going on?"
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. High fever and chills since this morning"
          multiline
          style={styles.multiline}
        />

        {error ? <AlertBanner tone="error" message={error} /> : null}

        <Button
          label={startConsultation.isPending ? 'Connecting…' : 'Start instant consultation'}
          icon="videocam"
          size="lg"
          loading={startConsultation.isPending}
          disabled={reason.trim().length < 3}
          onPress={handleStart}
        />
      </Card>

      <Button
        label="Book a scheduled visit instead"
        variant="ghost"
        icon="calendar-outline"
        onPress={() => router.push('/(patient)/book-appointment')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    ...Typography.smallStrong,
  },
  introBody: {
    ...Typography.caption,
    marginTop: 2,
    lineHeight: 18,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
});
