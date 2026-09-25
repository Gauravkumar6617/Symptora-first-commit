import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { MaxFormWidth, Radius, Spacing, Typography, tint } from '@/constants/theme';
import { SUPPORT_EMAIL } from '@/data/content';
import { ApiError, requestPasswordReset, resetPassword, verifyPasswordReset } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { validateEmail, validatePassword } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';

type Step = 'email' | 'code' | 'password' | 'done';

const RESET_STEPS = ['Email', 'Code', 'New password'] as const;

const STEP_COPY: Record<Exclude<Step, 'done'>, { icon: keyof typeof Ionicons.glyphMap; title: string }> = {
  email: { icon: 'key-outline', title: 'Forgot your password?' },
  code: { icon: 'mail-unread-outline', title: 'Check your email' },
  password: { icon: 'lock-closed-outline', title: 'Choose a new password' },
};

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  function fail(error: unknown, fallback: string) {
    errorFeedback();
    setFormError(error instanceof ApiError ? error.message : fallback);
  }

  async function sendCode(isResend = false) {
    const emailError = validateEmail(email);
    setFieldError(emailError);
    setFormError('');
    setNotice('');
    if (emailError) return;

    setLoading(true);
    try {
      await requestPasswordReset(normalizedEmail);
      successFeedback();
      if (isResend) {
        setNotice('A new code is on its way.');
      } else {
        setOtp('');
        setStep('code');
      }
    } catch (error) {
      fail(error, 'Could not send the code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setNotice('');
    if (!/^\d{6}$/.test(otp)) {
      setFieldError('Enter the 6-digit code from the email.');
      return;
    }
    setFieldError(undefined);
    setFormError('');
    setLoading(true);
    try {
      setResetToken(await verifyPasswordReset(normalizedEmail, otp));
      setStep('password');
    } catch (error) {
      fail(error, 'That code did not work. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setFieldError(passwordError);
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    setFieldError(undefined);
    setFormError('');
    setLoading(true);
    try {
      await resetPassword({ email: normalizedEmail, reset_token: resetToken, password });
      successFeedback();
      setStep('done');
    } catch (error) {
      fail(error, 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function goTo(next: Step) {
    setFieldError(undefined);
    setFormError('');
    setNotice('');
    setStep(next);
  }

  if (step === 'done') {
    return (
      <Screen
        header={<StackHeader title="Reset password" fallbackHref="/(auth)/login" />}
        maxWidth={MaxFormWidth}>
        <Card style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: tint(theme.success, 0.12) }]}>
            <Ionicons name="checkmark-circle-outline" size={28} color={theme.success} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Password updated</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You can now log in with your new password.
          </Text>
          <Button label="Back to login" icon="log-in-outline" onPress={() => router.replace('/(auth)/login')} />
        </Card>
      </Screen>
    );
  }

  const copy = STEP_COPY[step];
  const stepIndex = step === 'email' ? 0 : step === 'code' ? 1 : 2;

  return (
    <Screen
      header={<StackHeader title="Reset password" fallbackHref="/(auth)/login" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      <Card style={styles.card}>
        <ProgressSteps steps={RESET_STEPS} current={stepIndex} compact />
        <View style={[styles.iconWrap, { backgroundColor: tint(theme.primary, 0.1) }]}>
          <Ionicons name={copy.icon} size={26} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {step === 'email'
            ? "Enter the email linked to your account and we'll send you a 6-digit code."
            : step === 'code'
              ? `If ${normalizedEmail} has an account, we sent it a 6-digit code. It expires in 5 minutes.`
              : 'Use at least 8 characters with letters and numbers.'}
        </Text>

        {notice ? <AlertBanner tone="info" message={notice} /> : null}
        {formError ? <AlertBanner tone="error" message={formError} /> : null}

        {step === 'email' ? (
          <>
            <TextField
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              error={fieldError}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              returnKeyType="send"
              onSubmitEditing={() => sendCode()}
            />
            <Button label="Send code" icon="mail-outline" onPress={() => sendCode()} loading={loading} />
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <TextField
              label="6-digit code"
              icon="key-outline"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
              error={fieldError}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              returnKeyType="done"
              onSubmitEditing={verifyCode}
            />
            <Button label="Verify code" icon="shield-checkmark-outline" onPress={verifyCode} loading={loading} />
            <View style={styles.row}>
              <Button label="Change email" variant="ghost" size="sm" onPress={() => goTo('email')} />
              <Button label="Resend code" variant="ghost" size="sm" onPress={() => sendCode(true)} disabled={loading} />
            </View>
          </>
        ) : null}

        {step === 'password' ? (
          <>
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
              label="Confirm new password"
              icon="lock-closed-outline"
              value={confirm}
              onChangeText={setConfirm}
              error={fieldError}
              password
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={savePassword}
            />
            <Button label="Reset password" icon="checkmark-circle-outline" onPress={savePassword} loading={loading} />
          </>
        ) : null}

        <Link href="/(auth)/login" style={[styles.link, { color: theme.primary }]}>
          Back to login
        </Link>
        {step === 'code' ? (
          <Text style={[styles.footnote, { color: theme.textMuted }]}>
            Nothing arrived? Check spam, or email {SUPPORT_EMAIL}.
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Radius.xl,
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading,
  },
  body: {
    ...Typography.small,
    marginTop: -Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    ...Typography.smallStrong,
    textAlign: 'center',
  },
  footnote: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
