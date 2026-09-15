import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.six }]}>
      <Text style={[styles.title, { color: theme.text }]}>Reset your password</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter the email linked to your account and we&apos;ll send you reset instructions.
      </Text>

      {sent ? (
        <Text style={{ color: theme.success, fontWeight: '600' }}>
          If an account exists for {email}, a reset link is on its way.
        </Text>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Button label="Send reset link" onPress={() => setSent(true)} disabled={!email} />
        </View>
      )}

      <Link href="/(auth)/login" style={[styles.back, { color: theme.primary }]}>
        Back to login
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: Spacing.three,
  },
  back: {
    fontWeight: '700',
    fontSize: 14,
  },
});
