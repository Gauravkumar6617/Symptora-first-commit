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
import { MaxFormWidth, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { titleCase } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { validateEmail } from '@/lib/validation';
import { useFamilyStore } from '@/store/familyStore';
import {
  FAMILY_RELATIONSHIPS,
  GENDER_LABELS,
  GENDERS,
  type FamilyRelationship,
  type Gender,
} from '@/types';

const relationshipOptions = FAMILY_RELATIONSHIPS.map((value) => ({
  value,
  label: titleCase(value),
}));

const genderOptions = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

interface Errors {
  name?: string;
  relation?: string;
  age?: string;
  email?: string;
  number?: string;
}

export default function AddFamilyMemberScreen() {
  const theme = useTheme();
  const router = useRouter();
  const addMember = useFamilyStore((state) => state.addMember);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState<FamilyRelationship | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const nextErrors: Errors = {};
    if (!name.trim()) nextErrors.name = 'Enter their name.';
    if (!relation) nextErrors.relation = 'Pick a relationship.';
    const parsedAge = Number(age);
    if (!age || Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      nextErrors.age = 'Enter an age between 0 and 120.';
    }
    if (email.trim()) nextErrors.email = validateEmail(email);
    const cleanNumber = number.replace(/[\s-]/g, '');
    if (cleanNumber && !/^\+?\d{7,15}$/.test(cleanNumber)) nextErrors.number = 'Enter a valid phone number.';
    if (!nextErrors.email) delete nextErrors.email;

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // POST /api/v1/family-members — the same endpoint the website saves to.
      await addMember({
        name: name.trim(),
        relation: relation as FamilyRelationship,
        age: parsedAge,
        gender: gender ?? undefined,
        email: email.trim().toLowerCase() || undefined,
        number: cleanNumber || undefined,
      });
      successFeedback();
      router.back();
    } catch (error) {
      errorFeedback();
      setFormError(
        error instanceof ApiError ? error.message : 'Could not add this family member. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      header={<StackHeader title="Add family member" fallbackHref="/(patient)/(tabs)/family" />}
      keyboardAware
      maxWidth={MaxFormWidth}>
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Family profiles let you run symptom checks and book appointments on someone else&apos;s behalf. Add
        their email and phone to invite them to their own login: you&apos;ll both see their health checks.
      </Text>

      <Card style={{ gap: Spacing.three }}>
        <TextField
          label="Full name"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Meera Sharma"
        />

        <SelectField
          label="Relationship to you"
          placeholder="Select relationship"
          icon="people-outline"
          value={relation}
          options={relationshipOptions}
          onChange={(value: FamilyRelationship) => {
            setRelation(value);
            setErrors((current) => ({ ...current, relation: undefined }));
          }}
          error={errors.relation}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField
              label="Age"
              value={age}
              onChangeText={setAge}
              error={errors.age}
              placeholder="54"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={styles.rowItemWide}>
            <SelectField
              label="Gender (optional)"
              placeholder="Select"
              value={gender}
              options={genderOptions}
              onChange={(value: Gender) => setGender(value)}
            />
          </View>
        </View>

        <TextField
          label="Email (optional, for their invite)"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="meera@example.com"
        />

        <TextField
          label="Phone (optional, they log in with it)"
          icon="call-outline"
          value={number}
          onChangeText={setNumber}
          error={errors.number}
          keyboardType="phone-pad"
          placeholder="9876543210"
          maxLength={16}
        />

        {formError ? <AlertBanner tone="error" message={formError} /> : null}

        <Button label="Add member" icon="person-add-outline" onPress={handleSubmit} loading={loading} />
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
    width: 96,
  },
  rowItemWide: {
    flex: 1,
  },
});
