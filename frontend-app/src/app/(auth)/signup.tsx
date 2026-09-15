import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export default function SignupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!name || !email || !password) {
      setError('Fill in all fields to continue.');
      return;
    }
    setError('');
    setLoading(true);
    // TODO: replace with a real API call once backend auth routes exist.
    setTimeout(() => {
      login({
        id: `mock-${Date.now()}`,
        name,
        email,
        role,
        specialization: role === 'doctor' ? 'General Medicine' : undefined,
      });
      setLoading(false);
      router.replace(role === 'doctor' ? '/(doctor)/(tabs)' : '/(patient)/(tabs)');
    }, 400);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled">
        <Image source={require('@/assets/images/symptora-logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Know when it matters. Act before it&apos;s late.
        </Text>

        <View style={[styles.roleSwitch, { backgroundColor: theme.backgroundElement }]}>
          {(['patient', 'doctor'] as UserRole[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setRole(option)}
              style={[styles.roleOption, role === option && { backgroundColor: theme.primary }]}>
              <Text
                style={[
                  styles.roleLabel,
                  { color: role === option ? theme.onPrimary : theme.textSecondary },
                ]}>
                {option === 'patient' ? "I'm a patient" : "I'm a doctor"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" autoComplete="name" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {error ? <Text style={{ color: theme.danger, fontSize: 13 }}>{error}</Text> : null}
          <Button label={role === 'doctor' ? 'Apply as a doctor' : 'Sign up'} onPress={handleSubmit} loading={loading} />
        </View>

        <View style={styles.footerRow}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Already have an account? </Text>
          <Link href="/(auth)/login" style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>
            Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'stretch',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: 200,
    height: 48,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  roleSwitch: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.four,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    gap: Spacing.three,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.five,
  },
});
