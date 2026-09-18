import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/ui/alert-banner';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateField } from '@/components/ui/date-field';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Gradient, MaxFormWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { ApiError, registerUser } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import {
  emptyDateParts,
  LIMITS,
  passwordStrength,
  signupFormToPayload,
  validateSignupDetails,
  validateSignupIdentity,
  type SignupFieldErrors,
  type SignupForm,
} from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { GENDER_LABELS, GENDERS, type Gender } from '@/types';

const steps = ['Your details', 'Health profile'] as const;

const genderOptions = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

const emptyForm: SignupForm = {
  first_name: '',
  last_name: '',
  email: '',
  number: '',
  address: '',
  avatar: null,
  gender: null,
  dateOfBirth: emptyDateParts,
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export default function SignupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SignupForm>(emptyForm);
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignupForm>(key: K, value: SignupForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleNext() {
    const stepErrors = validateSignupIdentity(form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      errorFeedback();
      return;
    }
    setFormError('');
    setStep(1);
  }

  async function handleSubmit() {
    const stepErrors = validateSignupDetails(form);
    setErrors(stepErrors);
    setFormError('');
    if (Object.keys(stepErrors).length > 0) {
      errorFeedback();
      return;
    }

    setLoading(true);
    try {
      // POST /api/v1/users/ — see backend/app/schemas/userSchema.py UserCreate.
      const user = await registerUser(signupFormToPayload(form));
      successFeedback();
      setSession({ user });
      router.replace(user.role === 'doctor' ? '/(doctor)/(tabs)' : '/(patient)/(tabs)');
    } catch (error) {
      errorFeedback();
      if (error instanceof ApiError) {
        setFormError(error.message);
        if (error.fieldErrors) {
          setErrors((current) => ({ ...current, ...(error.fieldErrors as SignupFieldErrors) }));
          // A duplicate email/phone is reported on step one.
          if (error.fieldErrors.email || error.fieldErrors.number) setStep(0);
        }
        if (/already exists/i.test(error.message)) setStep(0);
      } else {
        setFormError('Could not create your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength(form.password);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.five },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Image
            source={require('@/assets/images/symptora-logo.png')}
            style={styles.logo}
            contentFit="contain"
            tintColor="#FFFFFF"
          />

          <Card style={styles.card}>
            <View style={styles.headerBlock}>
              <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {step === 0
                  ? 'Start your first Health Check in minutes.'
                  : 'These details help doctors read your results correctly.'}
              </Text>
            </View>

            <ProgressSteps steps={steps} current={step} />

            {formError ? <AlertBanner tone="error" message={formError} /> : null}

            {step === 0 ? (
              <View style={styles.form}>
                <AvatarPicker
                  value={form.avatar}
                  onChange={(uri) => update('avatar', uri)}
                  name={`${form.first_name} ${form.last_name}`.trim()}
                />

                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <TextField
                      label="First name"
                      value={form.first_name}
                      onChangeText={(text) => update('first_name', text)}
                      error={errors.first_name}
                      placeholder="Aarav"
                      autoComplete="given-name"
                      maxLength={LIMITS.firstName}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <TextField
                      label="Last name"
                      value={form.last_name}
                      onChangeText={(text) => update('last_name', text)}
                      error={errors.last_name}
                      placeholder="Sharma"
                      autoComplete="family-name"
                      maxLength={LIMITS.lastName}
                    />
                  </View>
                </View>

                <TextField
                  label="Email"
                  icon="mail-outline"
                  value={form.email}
                  onChangeText={(text) => update('email', text)}
                  error={errors.email}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  maxLength={LIMITS.email}
                />

                <TextField
                  label="Phone number"
                  icon="call-outline"
                  value={form.number}
                  onChangeText={(text) => update('number', text)}
                  error={errors.number}
                  hint="Used for appointment reminders."
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={LIMITS.number}
                />

                <Button label="Continue" icon="arrow-forward" iconPosition="trailing" onPress={handleNext} size="lg" />
              </View>
            ) : (
              <View style={styles.form}>
                <DateField
                  label="Date of birth"
                  value={form.dateOfBirth}
                  onChange={(value) => update('dateOfBirth', value)}
                  error={errors.dateOfBirth}
                  hint="Risk scoring is age-aware, so this has to be accurate."
                />

                <SelectField
                  label="Gender"
                  placeholder="Select gender"
                  icon="person-outline"
                  value={form.gender}
                  options={genderOptions}
                  onChange={(value: Gender) => update('gender', value)}
                  error={errors.gender}
                />

                <TextField
                  label="Address (optional)"
                  icon="location-outline"
                  value={form.address}
                  onChangeText={(text) => update('address', text)}
                  error={errors.address}
                  placeholder="Flat, street, city"
                  maxLength={LIMITS.address}
                  multiline
                  style={styles.multiline}
                />

                <View>
                  <TextField
                    label="Password"
                    icon="lock-closed-outline"
                    value={form.password}
                    onChangeText={(text) => update('password', text)}
                    error={errors.password}
                    password
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    maxLength={LIMITS.passwordMax}
                  />
                  {form.password ? (
                    <View style={styles.strengthRow}>
                      {[0, 1, 2].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.strengthBar,
                            {
                              backgroundColor:
                                strength.score > index
                                  ? strength.score === 1
                                    ? theme.warning
                                    : strength.score === 2
                                      ? theme.primary
                                      : theme.success
                                  : theme.border,
                            },
                          ]}
                        />
                      ))}
                      <Text style={[styles.strengthLabel, { color: theme.textSecondary }]}>
                        {strength.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <TextField
                  label="Confirm password"
                  icon="lock-closed-outline"
                  value={form.confirmPassword}
                  onChangeText={(text) => update('confirmPassword', text)}
                  error={errors.confirmPassword}
                  password
                  placeholder="Repeat your password"
                  maxLength={LIMITS.passwordMax}
                />

                <Checkbox
                  checked={form.acceptedTerms}
                  onChange={(checked) => update('acceptedTerms', checked)}
                  error={errors.acceptedTerms}>
                  <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                    I agree to the{' '}
                    <Link href="/(info)/legal/terms" style={{ color: theme.primary, fontWeight: '700' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/(info)/legal/privacy" style={{ color: theme.primary, fontWeight: '700' }}>
                      Privacy Policy
                    </Link>
                    .
                  </Text>
                </Checkbox>

                <Button label="Create account" onPress={handleSubmit} loading={loading} size="lg" />
                <Button
                  label="Back"
                  variant="ghost"
                  size="sm"
                  icon="chevron-back"
                  onPress={() => setStep(0)}
                />
              </View>
            )}

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" style={[styles.footerLink, { color: theme.primary }]}>
                Log in
              </Link>
            </View>
          </Card>

          <Text style={styles.doctorHint}>
            Practising doctor? Sign up as a patient first, then apply from your profile.
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
  logo: {
    width: 190,
    height: 24,
    marginBottom: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: MaxFormWidth,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    gap: Spacing.three,
  },
  headerBlock: {
    gap: 4,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.small,
  },
  form: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  rowItem: {
    flex: 1,
  },
  multiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
  },
  strengthLabel: {
    ...Typography.caption,
    width: 72,
    textAlign: 'right',
  },
  termsText: {
    ...Typography.caption,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.small,
  },
  footerLink: {
    ...Typography.small,
    fontWeight: '700',
  },
  doctorHint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: Spacing.three,
    maxWidth: MaxFormWidth,
  },
});
