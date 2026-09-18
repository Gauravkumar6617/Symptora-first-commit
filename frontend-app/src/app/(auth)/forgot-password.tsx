import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { MaxFormWidth, Radius, Spacing, Typography, tint } from '@/constants/theme';
import { SUPPORT_EMAIL } from '@/data/content';
import { ApiError, requestPasswordReset } from '@/lib/api';
import { successFeedback } from '@/lib/haptics';
import { validateEmail } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const emailError = validateEmail(email);
    setError(emailError);
    setFormError('');
    if (emailError) return;

    setLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      successFeedback();
      setSent(true);
    } catch (submitError) {
      setFormError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Could not send the reset link. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      header={<StackHeader title="Reset password" fallbackHref="/(auth)/login" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      {sent ? (
        <Card style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: tint(theme.success, 0.12) }]}>
            <Ionicons name="mail-open-outline" size={28} color={theme.success} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Check your inbox</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            If an account exists for {email}, a reset link is on its way. The link expires in 30 minutes.
          </Text>
          <Link href="/(auth)/login" style={[styles.link, { color: theme.primary }]}>
            Back to login
          </Link>
          <Text style={[styles.footnote, { color: theme.textMuted }]}>
            Nothing arrived? Check spam, or email {SUPPORT_EMAIL}.
          </Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: tint(theme.primary, 0.1) }]}>
            <Ionicons name="key-outline" size={26} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Forgot your password?</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Enter the email linked to your account and we&apos;ll send you reset instructions.
          </Text>

          {formError ? <AlertBanner tone="error" message={formError} /> : null}

          <TextField
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            error={error}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />

          <Button label="Send reset link" onPress={handleSubmit} loading={loading} />
          <Link href="/(auth)/login" style={[styles.link, { color: theme.primary }]}>
            Back to login
          </Link>
        </Card>
      )}
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
  link: {
    ...Typography.smallStrong,
    textAlign: 'center',
  },
  footnote: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
