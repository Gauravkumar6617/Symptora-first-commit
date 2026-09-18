import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { MaxFormWidth, Spacing, Typography } from '@/constants/theme';
import { ApiError, updateUser } from '@/lib/api';
import { formatDate, fullName } from '@/lib/format';
import { successFeedback } from '@/lib/haptics';
import {
  LIMITS,
  profileFormToPayload,
  validateProfile,
  type ProfileForm,
} from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { GENDER_LABELS, GENDERS, type Gender } from '@/types';

const genderOptions = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, accessToken, updateProfile } = useAuthStore();

  const [form, setForm] = useState<ProfileForm>({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    number: user?.number ?? '',
    address: user?.address ?? '',
    avatar: user?.avatar ?? null,
    gender: (user?.gender as Gender | null) ?? null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSave() {
    const nextErrors = validateProfile(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // PATCH /api/v1/users/{id} — backend UserUpdate fields only.
      const payload = profileFormToPayload(form);
      const updated = await updateUser(user?.id ?? '', payload, accessToken ?? undefined);
      updateProfile(updated);
      successFeedback();
      router.back();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not save your changes. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      header={<StackHeader title="Edit profile" fallbackHref="/" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      <Card style={{ gap: Spacing.three }}>
        <AvatarPicker
          value={form.avatar}
          onChange={(uri) => update('avatar', uri)}
          name={fullName({ first_name: form.first_name, last_name: form.last_name })}
          label="Profile photo"
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField
              label="First name"
              value={form.first_name}
              onChangeText={(text) => update('first_name', text)}
              error={errors.first_name}
              maxLength={LIMITS.firstName}
            />
          </View>
          <View style={styles.rowItem}>
            <TextField
              label="Last name"
              value={form.last_name}
              onChangeText={(text) => update('last_name', text)}
              error={errors.last_name}
              maxLength={LIMITS.lastName}
            />
          </View>
        </View>

        <TextField
          label="Phone number"
          icon="call-outline"
          value={form.number}
          onChangeText={(text) => update('number', text)}
          error={errors.number}
          keyboardType="phone-pad"
          maxLength={LIMITS.number}
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
          label="Address"
          icon="location-outline"
          value={form.address}
          onChangeText={(text) => update('address', text)}
          error={errors.address}
          placeholder="Flat, street, city"
          maxLength={LIMITS.address}
          multiline
          style={styles.multiline}
        />

        {formError ? <AlertBanner tone="error" message={formError} /> : null}

        <Button label="Save changes" onPress={handleSave} loading={loading} />
      </Card>

      <Card variant="muted" style={styles.lockedCard}>
        <Text style={[styles.lockedHeading, { color: theme.text }]}>Locked fields</Text>
        <Text style={[styles.lockedBody, { color: theme.textSecondary }]}>
          Email and date of birth are tied to your clinical record, so support has to change them.
        </Text>
        <View style={styles.lockedRow}>
          <Text style={[styles.lockedLabel, { color: theme.textSecondary }]}>Email</Text>
          <Text style={[styles.lockedValue, { color: theme.text }]}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.lockedRow}>
          <Text style={[styles.lockedLabel, { color: theme.textSecondary }]}>Date of birth</Text>
          <Text style={[styles.lockedValue, { color: theme.text }]}>
            {formatDate(user?.date_of_birth)}
          </Text>
        </View>
        <Button
          label="Contact support"
          variant="ghost"
          size="sm"
          onPress={() => router.push('/(info)/contact')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  lockedCard: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  lockedHeading: {
    ...Typography.section,
  },
  lockedBody: {
    ...Typography.caption,
  },
  lockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lockedLabel: {
    ...Typography.caption,
  },
  lockedValue: {
    ...Typography.smallStrong,
  },
});
