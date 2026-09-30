import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { Spacing, Typography, tint } from '@/constants/theme';
import { getConsultation, payForConsultation, telemedicinePatientSocketUrl } from '@/lib/api';
import { openVideoCall } from '@/lib/call';
import { useCancelConsultation } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

/** Waits for a doctor to accept the instant consultation just started (push
 * over a socket, with a REST poll as a fallback), then hands off to the
 * video call in the in-app browser. */
export default function TelemedicineWaitingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const cancelConsultation = useCancelConsultation();
  const [status, setStatus] = useState<'payment' | 'waiting' | 'cancelled' | 'error'>('waiting');
  const [amount, setAmount] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handedOff = useRef(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;

    async function handOff() {
      if (handedOff.current) return;
      handedOff.current = true;
      await openVideoCall('telemedicine', id, accessToken!);
      if (!cancelled) router.replace('/(patient)/(tabs)/appointments');
    }

    getConsultation(accessToken, id)
      .then((consultation) => {
        if (cancelled) return;
        if (consultation.status === 'in_progress') void handOff();
        else if (consultation.status !== 'pending') setStatus('cancelled');
        else if (!consultation.paid_at) {
          setAmount(consultation.amount);
          setStatus('payment');
        }
      })
      .catch(() => {});

    const ws = new WebSocket(telemedicinePatientSocketUrl(id, accessToken));
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'accepted') void handOff();
      if (message.type === 'cancelled') setStatus('cancelled');
    };

    // Fallback in case the push is ever missed — the socket is the fast path.
    const poll = setInterval(() => {
      getConsultation(accessToken, id)
        .then((consultation) => {
          if (cancelled) return;
          if (consultation.status === 'in_progress') void handOff();
          else if (consultation.status !== 'pending') setStatus('cancelled');
        })
        .catch(() => {});
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      ws.close();
    };
  }, [accessToken, id, router]);

  async function handlePay() {
    if (!accessToken || !id) return;
    setPaying(true);
    setPayError(null);
    try {
      await payForConsultation(accessToken, id);
      setStatus('waiting');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  function handleCancel() {
    if (!id) return;
    cancelConsultation.mutate(id, {
      onSuccess: () => router.replace('/(patient)/(tabs)/appointments'),
    });
  }

  return (
    <Screen header={<StackHeader title="Video consultation" fallbackHref="/(patient)/(tabs)" />}>
      <View style={styles.center}>
        <View style={[styles.icon, { backgroundColor: tint(theme.primary, 0.12) }]}>
          {status === 'payment' ? (
            <Ionicons name="card-outline" size={26} color={theme.primary} />
          ) : status === 'waiting' ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Ionicons name="medkit-outline" size={26} color={theme.primary} />
          )}
        </View>

        {status === 'payment' ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Pay to connect with a doctor</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              Consultation fee ₹{amount ?? '—'}. Doctors are notified the moment payment goes through.
            </Text>
            {payError ? <Text style={[styles.body, { color: theme.danger }]}>{payError}</Text> : null}
            <Button
              label={paying ? 'Processing…' : `Pay ₹${amount ?? ''}`}
              icon="card-outline"
              loading={paying}
              onPress={handlePay}
              style={styles.action}
            />
            <Button
              label="Cancel request"
              variant="ghost"
              onPress={handleCancel}
            />
          </>
        ) : status === 'waiting' ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Connecting you to a doctor</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              We&apos;ve notified every available doctor. This usually takes under a minute.
            </Text>
            <Card variant="muted" style={styles.note}>
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                The call opens in your browser once a doctor accepts.
              </Text>
            </Card>
            <Button
              label={cancelConsultation.isPending ? 'Cancelling…' : 'Cancel request'}
              variant="danger"
              icon="close-circle-outline"
              loading={cancelConsultation.isPending}
              onPress={handleCancel}
              style={styles.action}
            />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.text }]}>This request is no longer active</Text>
            <Button
              label="Back to telemedicine"
              onPress={() => router.replace('/(patient)/telemedicine')}
              style={styles.action}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: Spacing.six,
    gap: Spacing.two,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    ...Typography.heading,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
  note: {
    marginTop: Spacing.three,
    width: '100%',
  },
  noteText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.four,
    width: '100%',
  },
});
