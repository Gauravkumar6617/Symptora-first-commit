import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppointmentCard } from '@/components/ui/appointment-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatThreadModal } from '@/components/ui/chat-thread-modal';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { PrescriptionFormModal } from '@/components/ui/prescription-form-modal';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Spacing, Typography, tint } from '@/constants/theme';
import { telemedicineDoctorSocketUrl } from '@/lib/api';
import { openVideoCall } from '@/lib/call';
import { formatDate } from '@/lib/format';
import { successFeedback } from '@/lib/haptics';
import {
  useAcceptConsultation,
  useCancelAppointment,
  useDoctorAppointments,
  useHandledConsultations,
  useIssuedPrescriptions,
  usePendingConsultations,
} from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import type { TelemedicineConsultationRecord } from '@/types';

const consultationStatusTone = {
  pending: 'warning',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'neutral',
} as const;

export default function DoctorScheduleScreen() {
  const theme = useTheme();
  const { data: appointments, isLoading, refetch, isRefetching } = useDoctorAppointments();
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const cancelAppointment = useCancelAppointment();
  const [chatId, setChatId] = useState<string | null>(null);
  const [prescribeId, setPrescribeId] = useState<string | null>(null);

  const dates = useMemo(() => {
    const unique = Array.from(new Set((appointments ?? []).map((item) => item.date)));
    return unique.sort();
  }, [appointments]);

  const visible = useMemo(() => {
    const list = appointments ?? [];
    return activeDate ? list.filter((item) => item.date === activeDate) : list;
  }, [appointments, activeDate]);

  function confirmCancel(id: string) {
    Alert.alert('Cancel this appointment?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel appointment', style: 'destructive', onPress: () => cancelAppointment.mutate(id) },
    ]);
  }

  return (
    <Screen tabBarInset topInset refreshing={isRefetching} onRefresh={refetch}>
      <ScreenHeader title="Schedule" subtitle="Your consults and availability" />

      <InstantConsultationSection />

      <Text style={[styles.heading, { color: theme.text }]}>Booked appointments</Text>
      <View style={styles.filters}>
        <Chip label="All dates" selected={!activeDate} onPress={() => setActiveDate(null)} />
        {dates.map((date) => (
          <Chip
            key={date}
            label={formatDate(date, { day: 'numeric', month: 'short' })}
            selected={activeDate === date}
            onPress={() => setActiveDate(activeDate === date ? null : date)}
          />
        ))}
      </View>

      {isLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No consults on this day"
          description="Open more slots below and patients can book them straight away."
          actionLabel="Show all dates"
          onAction={() => setActiveDate(null)}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              primaryLabel={appointment.patientName}
              footer={
                <View style={styles.footerRow}>
                  {appointment.status === 'scheduled' || appointment.status === 'rescheduled' ? (
                    <Button
                      label="Join video call"
                      icon="videocam"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => openVideoCall('appointment', appointment.id, accessToken!)}
                    />
                  ) : null}
                  <IconButton
                    icon="chatbubble-outline"
                    accessibilityLabel="Messages"
                    onPress={() => setChatId(appointment.id)}
                  />
                  {appointment.status !== 'cancelled' ? (
                    <IconButton
                      icon="medkit-outline"
                      accessibilityLabel="Prescribe"
                      onPress={() => setPrescribeId(appointment.id)}
                    />
                  ) : null}
                  {appointment.status === 'scheduled' || appointment.status === 'rescheduled' ? (
                    <Button label="Cancel" variant="ghost" size="sm" onPress={() => confirmCancel(appointment.id)} />
                  ) : null}
                </View>
              }
            />
          ))}
        </View>
      )}

      <ConsultationHistorySection />
      <IssuedPrescriptionsSection />

      <ChatThreadModal visible={chatId != null} kind="appointment" id={chatId} onClose={() => setChatId(null)} />
      <PrescriptionFormModal
        visible={prescribeId != null}
        kind="appointment"
        id={prescribeId}
        onClose={() => setPrescribeId(null)}
        onIssued={() => setPrescribeId(null)}
      />
    </Screen>
  );
}

/** Live queue of instant, patient-started consultations — connects to the
 * doctor notification socket only once approved; staying connected is what
 * makes this doctor "available" for them. Escalated (High risk check)
 * requests surface first with an Urgent badge. */
function InstantConsultationSection() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const approved = user?.doctor_status === 'approved';
  const { data: initial } = usePendingConsultations(approved);
  const acceptConsultation = useAcceptConsultation();

  // The queue is the initial REST fetch, adjusted by live socket events —
  // derived on render instead of mirrored into its own state.
  const [added, setAdded] = useState<TelemedicineConsultationRecord[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  const pending = useMemo(() => {
    const base = (initial ?? []).filter((c) => !removedIds.has(c.id));
    const extra = added.filter((c) => !removedIds.has(c.id) && !base.some((b) => b.id === c.id));
    const merged = [...base, ...extra];
    return merged.sort((a, b) =>
      a.trigger === b.trigger ? 0 : a.trigger === 'auto_escalation' ? -1 : 1,
    );
  }, [initial, added, removedIds]);

  useEffect(() => {
    if (!approved || !accessToken) return;
    const ws = new WebSocket(telemedicineDoctorSocketUrl(accessToken));
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'new-consultation') {
        successFeedback();
        const consultation = message.consultation as TelemedicineConsultationRecord;
        setAdded((current) => [...current.filter((c) => c.id !== consultation.id), consultation]);
      }
      if (message.type === 'removed') {
        setRemovedIds((current) => new Set(current).add(message.id));
      }
    };
    return () => ws.close();
  }, [approved, accessToken]);

  function handleAccept(id: string) {
    acceptConsultation.mutate(id, {
      onSuccess: () => {
        setRemovedIds((current) => new Set(current).add(id));
        void openVideoCall('telemedicine', id, accessToken!);
      },
      onError: () => {
        setRemovedIds((current) => new Set(current).add(id));
        Alert.alert('Could not accept', 'It may already be taken by another doctor.');
      },
    });
  }

  if (!approved || pending.length === 0) return null;

  return (
    <View style={{ marginBottom: Spacing.four }}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="phone-portrait-outline" size={18} color={theme.primary} />
        <Text style={[styles.heading, { color: theme.text, marginTop: 0 }]}>
          Instant consultation requests
        </Text>
      </View>
      <View style={{ gap: Spacing.three }}>
        {pending.map((c) => (
          <Card
            key={c.id}
            style={[
              styles.requestCard,
              c.trigger === 'auto_escalation' ? { borderWidth: 1.5, borderColor: theme.danger } : undefined,
            ]}>
            <View style={{ flex: 1 }}>
              <View style={styles.requestHeaderRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{c.patient_name ?? 'Patient'}</Text>
                {c.trigger === 'auto_escalation' ? <Badge label="Urgent" tone="danger" /> : null}
              </View>
              <Text style={[styles.optionMeta, { color: theme.textSecondary }]} numberOfLines={2}>
                {c.reason}
              </Text>
            </View>
            <Button
              label="Accept"
              icon="videocam"
              size="sm"
              loading={acceptConsultation.isPending}
              onPress={() => handleAccept(c.id)}
            />
          </Card>
        ))}
      </View>
    </View>
  );
}

/** Instant consultations this doctor has accepted, most recent first. */
function ConsultationHistorySection() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: consultations } = useHandledConsultations();
  const [chatId, setChatId] = useState<string | null>(null);
  const [prescribeId, setPrescribeId] = useState<string | null>(null);

  if (!consultations || consultations.length === 0) return null;

  return (
    <View style={{ marginTop: Spacing.five }}>
      <Text style={[styles.heading, { color: theme.text }]}>Consultation history</Text>
      <View style={{ gap: Spacing.three }}>
        {consultations.map((c) => (
          <Card key={c.id} style={styles.historyCard}>
            <View style={styles.historyRow}>
              <View style={[styles.optionIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
                <Ionicons name="person" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{c.patient_name ?? 'Patient'}</Text>
                <Text style={[styles.optionMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                  {c.reason}
                </Text>
              </View>
              <Badge label={c.status.replace('_', ' ')} tone={consultationStatusTone[c.status]} />
            </View>
            <View style={styles.footerRow}>
              {c.status === 'in_progress' ? (
                <Button
                  label="Rejoin call"
                  icon="videocam"
                  size="sm"
                  variant="outline"
                  onPress={() => openVideoCall('telemedicine', c.id, accessToken!)}
                />
              ) : null}
              <IconButton icon="chatbubble-outline" accessibilityLabel="Messages" onPress={() => setChatId(c.id)} />
              {c.status === 'in_progress' || c.status === 'completed' ? (
                <IconButton
                  icon="medkit-outline"
                  accessibilityLabel="Prescribe"
                  onPress={() => setPrescribeId(c.id)}
                />
              ) : null}
            </View>
          </Card>
        ))}
      </View>

      <ChatThreadModal visible={chatId != null} kind="telemedicine" id={chatId} onClose={() => setChatId(null)} />
      <PrescriptionFormModal
        visible={prescribeId != null}
        kind="telemedicine"
        id={prescribeId}
        onClose={() => setPrescribeId(null)}
        onIssued={() => setPrescribeId(null)}
      />
    </View>
  );
}

/** Prescriptions this doctor has issued, most recent first. */
function IssuedPrescriptionsSection() {
  const theme = useTheme();
  const { data: prescriptions } = useIssuedPrescriptions();

  if (!prescriptions || prescriptions.length === 0) return null;

  return (
    <View style={{ marginTop: Spacing.five }}>
      <Text style={[styles.heading, { color: theme.text }]}>Prescriptions issued</Text>
      <View style={{ gap: Spacing.three }}>
        {prescriptions.map((p) => (
          <Card key={p.id} style={{ gap: 4 }}>
            <View style={styles.historyRow}>
              <Ionicons name="person" size={15} color={theme.textSecondary} />
              <Text style={[styles.optionTitle, { color: theme.text }]}>{p.patient_name ?? 'Patient'}</Text>
            </View>
            {p.medications.map((med, i) => (
              <Text key={i} style={[styles.optionMeta, { color: theme.text }]}>
                {med.name} — {med.dosage}, {med.frequency}, {med.duration}
              </Text>
            ))}
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
    marginBottom: Spacing.three,
  },
  heading: {
    ...Typography.section,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two - 4,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two - 4,
  },
  historyCard: {
    gap: Spacing.two,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    ...Typography.smallStrong,
  },
  optionMeta: {
    ...Typography.caption,
  },
});
