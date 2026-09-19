import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { Gradient, MaxFormWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { APP_TAGLINE } from '@/data/content';
import { ApiError, isDemoMode, loginUser } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { validateLogin } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const session = await loginUser(email.trim().toLowerCase(), password, role === 'doctor');
      successFeedback();
      setSession(session);
      router.replace(session.user.role === 'doctor' ? '/(doctor)/(tabs)' : '/(patient)/(tabs)');
    } catch (error) {
      errorFeedback();
      setFormError(
        error instanceof ApiError ? error.message : 'Could not sign you in. Please try again.',
      );
      if (error instanceof ApiError && error.fieldErrors) {
        setErrors(error.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.five },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/symptora-logo.png')}
              style={styles.logo}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Log in to pick up where you left off.
            </Text>

            <SegmentedControl
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'doctor', label: 'Doctor' },
              ]}
              value={role}
              onChange={setRole}
            />

            {formError ? <AlertBanner tone="error" message={formError} /> : null}

            <TextField
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              returnKeyType="next"
            />

            <TextField
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              password
              autoComplete="current-password"
              placeholder="••••••••"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <Link href="/(auth)/forgot-password" style={[styles.forgot, { color: theme.primary }]}>
              Forgot password?
            </Link>

            <Button label="Log in" onPress={handleSubmit} loading={loading} size="lg" />

            {isDemoMode ? (
              <AlertBanner
                tone="info"
                message="Demo mode: no API URL is set, so any email with an 8+ character password signs you in."
              />
            ) : null}

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/(auth)/signup" style={[styles.footerLink, { color: theme.primary }]}>
                Sign up
              </Link>
            </View>
          </Card>

          <View style={styles.exploreRow}>
            <ExploreLink icon="help-circle-outline" label="How it works" href="/(info)/how-it-works" />
            <ExploreLink icon="information-circle-outline" label="About" href="/(info)/about" />
            <ExploreLink icon="chatbubble-ellipses-outline" label="Contact" href="/(info)/contact" />
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function ExploreLink({
  icon,
  label,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.exploreLink}
      accessibilityRole="link"
      onPress={() => router.push(href as never)}>
      <Ionicons name={icon} size={15} color="rgba(255,255,255,0.9)" />
      <Text style={styles.exploreLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxFormWidth,
  },
  logo: {
    width: 210,
    height: 26,
  },
  tagline: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: MaxFormWidth,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    gap: Spacing.three,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.small,
    marginTop: -Spacing.two,
    marginBottom: Spacing.one,
  },
  forgot: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: -Spacing.one,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  footerText: {
    ...Typography.small,
  },
  footerLink: {
    ...Typography.small,
    fontWeight: '700',
  },
  exploreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  exploreLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
