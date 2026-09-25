import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, RiskTone, Spacing, Typography, tint } from '@/constants/theme';
import { useParseSymptoms, usePredictDisease, useSymptoms } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { ageFromDateOfBirth, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { useHealthCheckStore } from '@/store/healthCheckStore';
import {
  GENDER_LABELS,
  GENDERS,
  SYMPTOM_DURATION_LABELS,
  SYMPTOM_DURATIONS,
  type Gender,
  type PatientDetails,
  type RiskLevel,
  type SymptomDuration,
} from '@/types';

/** Backend accepts at most 20 symptoms per request. */
const MAX_SELECTED = 20;
const MAX_SUGGESTIONS = 12;

const urgencyAdvice: Record<RiskLevel, string> = {
  low: 'Usually fine to monitor at home. Book a doctor if it gets worse or lasts.',
  medium: 'Consider seeing a doctor in the next day or two.',
  high: 'Please see a doctor soon. If symptoms are severe, seek emergency care.',
};

const ME = 'me';

export default function SymptomCheckerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const symptomsQuery = useSymptoms();
  const predict = usePredictDisease();
  const user = useAuthStore((state) => state.user);
  const { members, loadMembers } = useFamilyStore();
  const addCheck = useHealthCheckStore((state) => state.addCheck);

  // Step 1: who the check is for. Pre-filled from the profile / family member.
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [forWhom, setForWhom] = useState(ME);
  const [age, setAge] = useState(user?.date_of_birth ? String(ageFromDateOfBirth(user.date_of_birth)) : '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [duration, setDuration] = useState<SymptomDuration | null>(null);

  // Step 2: symptoms, typed as free text and/or picked from the list.
  const parse = useParseSymptoms();
  const [description, setDescription] = useState('');
  const [openQuestions, setOpenQuestions] = useState<string[]>([]); // vague words still unanswered
  const [durationNote, setDurationNote] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    loadMembers().catch(() => {}); // offline: the persisted list is used
  }, [loadMembers]);

  function pickPerson(id: string) {
    setForWhom(id);
    const member = members.find((m) => m.id === id);
    const dob = id === ME ? user?.date_of_birth : undefined;
    setAge(member ? String(member.age) : dob ? String(ageFromDateOfBirth(dob)) : '');
    setGender(member ? (member.gender ?? null) : (user?.gender ?? null));
  }

  const parsedAge = Number(age);
  const ageValid = age.trim() !== '' && Number.isInteger(parsedAge) && parsedAge >= 0 && parsedAge <= 120;
  const personName = forWhom === ME ? 'You' : (members.find((m) => m.id === forWhom)?.name ?? 'Them');

  const labels = useMemo(
    () => Object.fromEntries((symptomsQuery.data ?? []).map((s) => [s.id, s.label])),
    [symptomsQuery.data],
  );

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (symptomsQuery.data ?? [])
      .filter((s) => !selected.includes(s.id))
      .filter((s) => !term || s.label.toLowerCase().includes(term))
      .slice(0, MAX_SUGGESTIONS);
  }, [symptomsQuery.data, search, selected]);

  function toggle(id: string) {
    predict.reset(); // the old result no longer matches the selection
    setSelected((current) =>
      current.includes(id)
        ? current.filter((s) => s !== id)
        : current.length < MAX_SELECTED
          ? [...current, id]
          : current,
    );
  }

  function describe() {
    parse.mutate(description, {
      onSuccess: (found) => {
        predict.reset();
        setSelected((current) =>
          [...new Set([...current, ...found.symptoms.map((s) => s.id)])].slice(0, MAX_SELECTED),
        );
        setOpenQuestions(found.suggestions.map((s) => s.phrase));
        if (found.duration && patient && found.duration !== patient.duration) {
          setPatient({ ...patient, duration: found.duration });
          setDurationNote(`Duration updated to "${SYMPTOM_DURATION_LABELS[found.duration]}" from your description.`);
        } else {
          setDurationNote('');
        }
      },
    });
  }

  const parsed = parse.data;
  const result = predict.data;
  const error = symptomsQuery.error ?? parse.error ?? predict.error;

  if (!patient) {
    return (
      <Screen
        keyboardAware
        header={
          <StackHeader
            title="Symptom checker"
            subtitle="Step 1 of 2 · About the patient"
            fallbackHref="/(patient)/(tabs)"
          />
        }>
        <View style={styles.section}>
          <Text style={[styles.overline, { color: theme.textMuted }]}>WHO IS THIS FOR?</Text>
          <View style={styles.chips}>
            <Chip label="Me" icon="person" selected={forWhom === ME} onPress={() => pickPerson(ME)} />
            {members.map((m) => (
              <Chip key={m.id} label={m.name} selected={forWhom === m.id} onPress={() => pickPerson(m.id)} />
            ))}
          </View>
        </View>

        <TextField
          label="Age"
          placeholder="Age in years"
          value={age}
          onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          error={age && !ageValid ? 'Enter an age between 0 and 120.' : undefined}
        />

        <View style={[styles.section, { marginTop: Spacing.three }]}>
          <Text style={[styles.overline, { color: theme.textMuted }]}>GENDER</Text>
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <Chip key={g} label={GENDER_LABELS[g]} selected={gender === g} onPress={() => setGender(g)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.overline, { color: theme.textMuted }]}>HOW LONG HAVE THE SYMPTOMS LASTED?</Text>
          <View style={styles.chips}>
            {SYMPTOM_DURATIONS.map((d) => (
              <Chip
                key={d}
                label={SYMPTOM_DURATION_LABELS[d]}
                selected={duration === d}
                onPress={() => setDuration(d)}
              />
            ))}
          </View>
        </View>

        <Button
          label="Continue"
          icon="arrow-forward"
          iconPosition="trailing"
          disabled={!ageValid || !gender || !duration}
          onPress={() => {
            if (ageValid && gender && duration) setPatient({ age: parsedAge, gender, duration });
          }}
          style={{ marginTop: Spacing.three }}
        />

        <Card variant="muted" style={[styles.note, { marginTop: Spacing.four }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
          <Text style={[styles.caption, { color: theme.textSecondary, flex: 1 }]}>
            Age and how long symptoms have lasted help decide how soon to see a doctor.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAware
      header={
        <StackHeader
          title="Symptom checker"
          subtitle="Step 2 of 2 · Pick what you're feeling"
          fallbackHref="/(patient)/(tabs)"
        />
      }>
      <Card variant="muted" style={[styles.note, { alignItems: 'center', marginBottom: Spacing.three }]}>
        <Ionicons name="person-circle-outline" size={18} color={theme.primary} />
        <Text style={[styles.caption, { color: theme.text, flex: 1 }]}>
          {personName} · {patient.age} yrs · {GENDER_LABELS[patient.gender]} ·{' '}
          {SYMPTOM_DURATION_LABELS[patient.duration]}
        </Text>
        <Button
          label="Edit"
          variant="ghost"
          size="sm"
          onPress={() => {
            predict.reset();
            setPatient(null);
          }}
        />
      </Card>

      {error ? (
        <AlertBanner
          tone="error"
          message={error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'}
        />
      ) : null}

      <TextField
        label="Describe how you feel"
        placeholder="e.g. I have been vomiting for two days and there is blood"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
        style={styles.multiline}
      />
      <Button
        label="Find symptoms"
        icon="sparkles"
        variant="outline"
        size="sm"
        onPress={describe}
        loading={parse.isPending}
        disabled={!description.trim()}
        style={{ alignSelf: 'flex-start', marginTop: Spacing.two, marginBottom: Spacing.three }}
      />

      {parsed ? (
        <View style={styles.section}>
          {parsed.red_flags.map((flag) => (
            <AlertBanner key={flag} tone="error" message={flag} />
          ))}
          {parsed.symptoms.length > 0 ? (
            <Text style={[styles.caption, { color: theme.textSecondary }]}>
              Found: {parsed.symptoms.map((s) => s.label).join(', ')}. Added below.
            </Text>
          ) : null}
          {durationNote ? (
            <Text style={[styles.caption, { color: theme.textSecondary }]}>{durationNote}</Text>
          ) : null}
          {parsed.suggestions
            .filter((s) => openQuestions.includes(s.phrase))
            .map((s) => (
              <View key={s.phrase} style={{ gap: Spacing.two }}>
                <Text style={[styles.body, { color: theme.text }]}>
                  Which did you mean by &quot;{s.phrase}&quot;?
                </Text>
                <View style={styles.chips}>
                  {s.options.map((o) => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      icon="add"
                      onPress={() => {
                        toggle(o.id);
                        setOpenQuestions((q) => q.filter((p) => p !== s.phrase));
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}
          {parsed.symptoms.length === 0 && parsed.suggestions.length === 0 ? (
            <Text style={[styles.caption, { color: theme.textMuted }]}>
              We couldn&apos;t match any symptoms in that. Try simpler words, or pick from the list below.
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.overline, styles.divider, { color: theme.textMuted }]}>OR SEARCH THE LIST</Text>

      {selected.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.overline, { color: theme.textMuted }]}>
            SELECTED ({selected.length}) · TAP TO REMOVE
          </Text>
          <View style={styles.chips}>
            {selected.map((id) => (
              <Chip key={id} label={labels[id] ?? id} icon="close" selected onPress={() => toggle(id)} />
            ))}
          </View>
        </View>
      ) : null}

      <TextField
        icon="search"
        placeholder="Search symptoms, e.g. fever"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={[styles.chips, styles.section]}>
        {symptomsQuery.isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} width={90} height={34} radius={Radius.full} />
            ))
          : suggestions.map((s) => (
              <Chip key={s.id} label={s.label} icon="add" onPress={() => toggle(s.id)} />
            ))}
        {symptomsQuery.data?.length && suggestions.length === 0 ? (
          <Text style={[styles.caption, { color: theme.textMuted }]}>No matching symptoms.</Text>
        ) : null}
      </View>

      <Button
        label={selected.length ? `Check ${selected.length} symptom${selected.length === 1 ? '' : 's'}` : 'Select at least one symptom'}
        icon="pulse"
        onPress={() =>
          predict.mutate(
            {
              symptoms: selected,
              patient: { ...patient, description: description.trim() || undefined },
            },
            {
              // Keep the result in Health Check history alongside questionnaire checks.
              onSuccess: (found) =>
                addCheck({
                  id: `sc-${Date.now()}`,
                  title: found.predictions[0] ? `Possible ${found.predictions[0].label}` : 'Symptom check',
                  riskLevel: found.urgency,
                  createdAt: new Date().toISOString(),
                  summary: found.symptoms.map((id) => labels[id] ?? id).join(', '),
                  forMember: forWhom === ME ? undefined : personName,
                }),
            },
          )
        }
        loading={predict.isPending}
        disabled={selected.length === 0}
        style={{ marginTop: Spacing.four }}
      />

      {result ? (
        <View style={[styles.section, { marginTop: Spacing.four }]}>
          <Card style={styles.urgency}>
            <RiskBadge level={result.urgency} />
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {urgencyAdvice[result.urgency]}
            </Text>
            {result.urgency_reasons.map((reason) => (
              <View key={reason} style={styles.tip}>
                <Ionicons name="alert-circle-outline" size={15} color={RiskTone[result.urgency].color} />
                <Text style={[styles.caption, { color: theme.text, flex: 1 }]}>{reason}</Text>
              </View>
            ))}
          </Card>

          <Text style={[styles.heading, { color: theme.text }]}>Possible conditions</Text>
          {result.predictions.map((p, index) => {
            const accent = index === 0 ? theme.primary : theme.textSecondary;
            return (
              <Card key={p.disease} style={styles.prediction}>
                <View style={styles.predictionHeader}>
                  <View style={[styles.rank, { backgroundColor: tint(accent, 0.12) }]}>
                    <Text style={[styles.rankText, { color: accent }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.title, { color: theme.text }]}>{p.label}</Text>
                  <Text style={[styles.caption, { color: theme.textMuted }]}>
                    {Math.round(p.probability * 100)}% match
                  </Text>
                </View>
                <View style={[styles.bar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(4, p.probability * 100)}%`, backgroundColor: accent },
                    ]}
                  />
                </View>
                {p.description ? (
                  <Text style={[styles.caption, { color: theme.textSecondary }]}>{p.description}</Text>
                ) : null}
                {p.precautions.length > 0 ? (
                  <View style={{ gap: 4 }}>
                    {p.precautions.map((tip) => (
                      <View key={tip} style={styles.tip}>
                        <Ionicons name="checkmark-circle" size={15} color={RiskTone.low.color} />
                        <Text style={[styles.caption, { color: theme.text, flex: 1 }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}

          <Button
            label="Talk to a doctor"
            icon="videocam"
            variant="secondary"
            onPress={() => router.push('/(patient)/telemedicine')}
          />

          <Card variant="muted" style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
            <Text style={[styles.caption, { color: theme.textSecondary, flex: 1 }]}>
              {result.disclaimer}
            </Text>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three - 4,
    marginBottom: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  overline: {
    ...Typography.overline,
  },
  divider: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  heading: {
    ...Typography.section,
    marginTop: Spacing.two,
  },
  title: {
    ...Typography.bodyStrong,
    flex: 1,
  },
  body: {
    ...Typography.small,
  },
  caption: {
    ...Typography.caption,
    lineHeight: 18,
  },
  urgency: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  prediction: {
    gap: Spacing.two,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.smallStrong,
    fontWeight: '800',
  },
  bar: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  tip: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
