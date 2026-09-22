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
import { MaxFormWidth, Radius, Spacing, Typography, tint } from '@/constants/theme';
import { specialties } from '@/data/specialties';
import { ApiError, submitDoctorApplication } from '@/lib/api';
import { successFeedback } from '@/lib/haptics';
import { LIMITS, validateEmail, validateNumber } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

const specialtyOptions = Array.from(
  new Map(specialties.map((item) => [item.doctorSpecialty, item.doctorSpecialty])).values(),
).map((value) => ({ value, label: value }));

interface Errors {
  first_name?: string;
  last_name?: string;
  email?: string;
  number?: string;
  specialization?: string;
  license_number?: string;
  experience_years?: string;
}

export default function ApplyDoctorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [number, setNumber] = useState(user?.number ?? '');
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [license, setLicense] = useState('');
  const [experience, setExperience] = useState('');
  const [about, setAbout] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const nextErrors: Errors = {};
    if (!firstName.trim()) nextErrors.first_name = 'Required.';
    if (!lastName.trim()) nextErrors.last_name = 'Required.';
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    const numberError = validateNumber(number);
    if (numberError) nextErrors.number = numberError;
    if (!specialization) nextErrors.specialization = 'Pick your specialty.';
    if (license.trim().length < 4) nextErrors.license_number = 'Enter your medical licence number.';
    const years = Number(experience);
    if (!experience || Number.isNaN(years) || years < 0 || years > 70) {
      nextErrors.experience_years = 'Enter years of experience (0–70).';
    }

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await submitDoctorApplication({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        number: number.trim(),
        specialization: specialization as string,
        license_number: license.trim(),
        experience_years: experience,
        about: about.trim(),
      });
      successFeedback();
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not send your application. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Screen
        header={<StackHeader title="Application sent" fallbackHref="/(patient)/(tabs)/profile" />}
        maxWidth={MaxFormWidth}>
        <Card style={styles.successCard}>
          <View style={[styles.successIcon, { backgroundColor: tint(theme.success, 0.12) }]}>
            <Ionicons name="checkmark-circle" size={32} color={theme.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Application received</Text>
          <Text style={[styles.successBody, { color: theme.textSecondary }]}>
            Our clinical team verifies every licence by hand. We&apos;ll email {email} within three
            business days.
          </Text>
          <Button label="Back to profile" onPress={() => router.replace('/(patient)/(tabs)/profile')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<StackHeader title="Apply as a doctor" fallbackHref="/(patient)/(tabs)/profile" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Consult patients over video, set your own availability and fee, and get matched automatically to
        High risk Health Checks in your specialty.
      </Text>

      <Card style={{ gap: Spacing.three }}>
        {formError ? <AlertBanner tone="error" message={formError} /> : null}

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.first_name}
              maxLength={LIMITS.firstName}
            />
          </View>
          <View style={styles.rowItem}>
            <TextField
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.last_name}
              maxLength={LIMITS.lastName}
            />
          </View>
        </View>

        <TextField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={LIMITS.email}
        />

        <TextField
          label="Phone number"
          icon="call-outline"
          value={number}
          onChangeText={setNumber}
          error={errors.number}
          keyboardType="phone-pad"
          maxLength={LIMITS.number}
        />

        <SelectField
          label="Specialty"
          placeholder="Select your specialty"
          icon="medkit-outline"
          value={specialization}
          options={specialtyOptions}
          onChange={(value: string) => {
            setSpecialization(value);
            setErrors((current) => ({ ...current, specialization: undefined }));
          }}
          error={errors.specialization}
        />

        <View style={styles.row}>
          <View style={styles.rowItemWide}>
            <TextField
              label="Medical licence number"
              icon="ribbon-outline"
              value={license}
              onChangeText={setLicense}
              error={errors.license_number}
              placeholder="Licence #"
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.rowItemNarrow}>
            <TextField
              label="Years"
              value={experience}
              onChangeText={setExperience}
              error={errors.experience_years}
              placeholder="8"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <TextField
          label="About you (optional)"
          value={about}
          onChangeText={setAbout}
          placeholder="Where you practise, languages you consult in, special interests…"
          multiline
          style={styles.multiline}
        />

        <Button label="Submit application" onPress={handleSubmit} loading={loading} />
      </Card>

      <Card variant="muted" style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={17} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Licence details are used only for verification and are never shown to patients.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...Typography.small,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  rowItem: {
    flex: 1,
  },
  rowItemWide: {
    flex: 1,
  },
  rowItemNarrow: {
    width: 84,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  successCard: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    marginTop: Spacing.four,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...Typography.heading,
  },
  successBody: {
    ...Typography.small,
    textAlign: 'center',
    maxWidth: 320,
  },
});
