import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { MaxFormWidth, Spacing, Typography } from '@/constants/theme';
import { acceptFamilyInvite, ApiError, requestFamilyInvite } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { validateEmail } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

/**
 * A family member someone added activates their own login: code from the
 * invite email + a new password. Their profile comes from the family record.
 */
export default function ActivateFamilyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [number, setNumber] = useState('');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function fail(error: unknown) {
    errorFeedback();
    setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
  }

  async function requestCode() {
    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      return;
    }
    setFormError('');
    setLoading(true);
    try {
      setNotice(await requestFamilyInvite(email.trim().toLowerCase()));
      setStep('code');
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  }

  async function activate() {
    if (!/^\d{6}$/.test(otp)) {
      setFormError('Enter the 6-digit code from the email.');
      return;
    }
    if (password.length < 8) {
      setFormError('Choose a password of at least 8 characters.');
      return;
    }
    setFormError('');
    setLoading(true);
    try {
      const session = await acceptFamilyInvite({
        email: email.trim().toLowerCase(),
        otp,
        password,
        number: number.replace(/[\s-]/g, '') || undefined,
      });
      successFeedback();
      setSession(session);
      router.replace('/(patient)/(tabs)');
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      header={<StackHeader title="Activate family account" fallbackHref="/(auth)/login" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Someone added you as a family member? Set up your own login to see your health checks and run new
        ones. You both see them.
      </Text>

      <Card style={{ gap: Spacing.three }}>
        {notice && step === 'code' ? <AlertBanner tone="info" message={notice} /> : null}

        <TextField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="The email your family member added"
        />

        {step === 'code' ? (
          <>
            <TextField
              label="6-digit code"
              icon="key-outline"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
            <TextField
              label="New password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              password
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <TextField
              label="Phone (only if they didn't add it)"
              icon="call-outline"
              value={number}
              onChangeText={setNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="9876543210"
            />
          </>
        ) : null}

        {formError ? <AlertBanner tone="error" message={formError} /> : null}

        {step === 'email' ? (
          <>
            <Button label="Send me a code" icon="mail-outline" onPress={requestCode} loading={loading} />
            <Button label="I already have a code" variant="ghost" onPress={() => setStep('code')} />
          </>
        ) : (
          <>
            <Button label="Activate and log in" icon="checkmark-circle-outline" onPress={activate} loading={loading} />
            <Button label="Send a new code" variant="ghost" onPress={requestCode} disabled={loading} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...Typography.small,
    marginBottom: Spacing.three,
  },
});
