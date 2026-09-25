import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RiskScoreDial } from '@/components/ui/risk-badge';
import { Screen } from '@/components/ui/screen';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { StackHeader } from '@/components/ui/stack-header';
import { Radius, RiskTone, Spacing, Typography, tint } from '@/constants/theme';
import {
  healthCheckQuestions,
  scoreHealthCheck,
  suggestedSpecialtySlug,
  type HealthCheckAnswers,
  type HealthCheckResult,
} from '@/data/health-check';
import { ageFromDob, fullName, relationshipLabel } from '@/lib/format';
import { selectionFeedback, successFeedback, warningFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { useHealthCheckStore } from '@/store/healthCheckStore';

const SUBJECT_STEP = 0;
const FIRST_QUESTION_STEP = 1;
const RESULT_STEP = FIRST_QUESTION_STEP + healthCheckQuestions.length;

export default function HealthCheckScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const members = useFamilyStore((state) => state.members);
  const addCheck = useHealthCheckStore((state) => state.addCheck);

  const [step, setStep] = useState(SUBJECT_STEP);
  const [subjectId, setSubjectId] = useState<string>('self');
  const [answers, setAnswers] = useState<HealthCheckAnswers>({});
  const [result, setResult] = useState<HealthCheckResult | null>(null);

  const subject = useMemo(() => {
    if (subjectId === 'self') {
      return { name: user ? fullName(user) : 'Me', age: ageFromDob(user?.date_of_birth) };
    }
    const member = members.find((item) => item.id === subjectId);
    return { name: member?.name ?? 'Family member', age: member?.age ?? null };
  }, [subjectId, user, members]);

  const question = step >= FIRST_QUESTION_STEP && step < RESULT_STEP
    ? healthCheckQuestions[step - FIRST_QUESTION_STEP]
    : null;

  const selected = question ? (answers[question.id] ?? []) : [];

  function toggleOption(value: string) {
    if (!question) return;
    selectionFeedback();

    setAnswers((current) => {
      const previous = current[question.id] ?? [];

      if (question.type === 'single') {
        return { ...current, [question.id]: [value] };
      }

      // "None of these" is exclusive within a multi-select question.
      if (value === 'none') {
        return { ...current, [question.id]: previous.includes('none') ? [] : ['none'] };
      }

      const withoutNone = previous.filter((item) => item !== 'none');
      const next = withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
      return { ...current, [question.id]: next };
    });
  }

  function handleNext() {
    if (step === RESULT_STEP - 1) {
      const computed = scoreHealthCheck(answers, subject.age);
      setResult(computed);
      addCheck({
        id: `hc-${Date.now()}`,
        title: computed.title,
        riskLevel: computed.riskLevel,
        createdAt: new Date().toISOString(),
        score: computed.score,
        summary: computed.summary,
        forMember: subjectId === 'self' ? undefined : subject.name,
      });
      if (computed.riskLevel === 'high') warningFeedback();
      else successFeedback();
      setStep(RESULT_STEP);
      return;
    }
    setStep((current) => current + 1);
  }

  function handleBack() {
    if (step === SUBJECT_STEP) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  }

  function restart() {
    setAnswers({});
    setResult(null);
    setStep(SUBJECT_STEP);
  }

  const canContinue = step === SUBJECT_STEP || selected.length > 0;
  const progressLabels = ['Who', ...healthCheckQuestions.map((_, index) => String(index + 1)), 'Result'];

  if (step === RESULT_STEP && result) {
    return <HealthCheckResultView result={result} answers={answers} subjectName={subject.name} onRestart={restart} />;
  }

  return (
    <Screen
      header={
        <StackHeader
          title="Health Check"
          subtitle={step === SUBJECT_STEP ? 'About two minutes' : `Step ${step} of ${healthCheckQuestions.length}`}
          fallbackHref="/(patient)/(tabs)"
        />
      }
      scroll>
      <ProgressSteps steps={progressLabels} current={step} compact />

      {step === SUBJECT_STEP ? (
        <View style={styles.block}>
          <Text style={[styles.question, { color: theme.text }]}>Who is this check for?</Text>
          <Text style={[styles.helper, { color: theme.textSecondary }]}>
            Age changes how symptoms are scored, so pick the right person.
          </Text>

          <View style={{ gap: Spacing.two }}>
            <SubjectRow
              name={user ? fullName(user) : 'Me'}
              detail={subject.age != null && subjectId === 'self' ? `${subject.age} yrs · You` : 'You'}
              selected={subjectId === 'self'}
              onPress={() => setSubjectId('self')}
            />
            {members.map((member) => (
              <SubjectRow
                key={member.id}
                name={member.name}
                detail={`${relationshipLabel(member.relation)} · ${member.age} yrs`}
                selected={subjectId === member.id}
                onPress={() => setSubjectId(member.id)}
              />
            ))}
          </View>

          <Pressable style={styles.addLink} onPress={() => router.push('/(patient)/add-family-member')}>
            <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
            <Text style={[styles.addLinkText, { color: theme.primary }]}>Add a family member</Text>
          </Pressable>
        </View>
      ) : question ? (
        <View style={styles.block}>
          <Text style={[styles.question, { color: theme.text }]}>{question.question}</Text>
          {question.helper ? (
            <Text style={[styles.helper, { color: theme.textSecondary }]}>{question.helper}</Text>
          ) : null}

          <View style={{ gap: Spacing.two }}>
            {question.options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <Card
                  key={option.value}
                  onPress={() => toggleOption(option.value)}
                  style={[
                    styles.option,
                    isSelected ? { borderColor: theme.primary, backgroundColor: tint(theme.primary, 0.06) } : null,
                  ]}>
                  <View
                    style={[
                      styles.marker,
                      question.type === 'single' ? styles.markerRound : null,
                      {
                        borderColor: isSelected ? theme.primary : theme.borderStrong,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                      },
                    ]}>
                    {isSelected ? (
                      <Ionicons
                        name={question.type === 'single' ? 'ellipse' : 'checkmark'}
                        size={question.type === 'single' ? 8 : 13}
                        color={theme.onPrimary}
                      />
                    ) : null}
                  </View>

                  {option.icon ? (
                    <Ionicons
                      name={option.icon}
                      size={17}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                  ) : null}

                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? theme.text : theme.textSecondary },
                    ]}>
                    {option.label}
                  </Text>

                  {option.redFlag ? <Ionicons name="warning" size={15} color={theme.danger} /> : null}
                </Card>
              );
            })}
          </View>

          {question.type === 'multi' ? (
            <Text style={[styles.helper, { color: theme.textMuted }]}>Select all that apply.</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={step === RESULT_STEP - 1 ? 'See my result' : 'Continue'}
          icon="arrow-forward"
          iconPosition="trailing"
          onPress={handleNext}
          disabled={!canContinue}
          size="lg"
        />
        <Button label="Back" variant="ghost" size="sm" icon="chevron-back" onPress={handleBack} />
      </View>

      <Card variant="muted" style={styles.emergency}>
        <Ionicons name="alert-circle" size={18} color={theme.danger} />
        <Text style={[styles.emergencyText, { color: theme.textSecondary }]}>
          This is triage guidance, not a diagnosis. For severe symptoms, call your local emergency number.
        </Text>
      </Card>
    </Screen>
  );
}

function SubjectRow({
  name,
  detail,
  selected,
  onPress,
}: {
  name: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      style={[
        styles.subject,
        selected ? { borderColor: theme.primary, backgroundColor: tint(theme.primary, 0.06) } : null,
      ]}>
      <Avatar name={name} size={40} gradient={selected} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.subjectName, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.subjectDetail, { color: theme.textSecondary }]}>{detail}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
    </Card>
  );
}

function HealthCheckResultView({
  result,
  answers,
  subjectName,
  onRestart,
}: {
  result: HealthCheckResult;
  answers: HealthCheckAnswers;
  subjectName: string;
  onRestart: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const tone = RiskTone[result.riskLevel];
  const specialtySlug = suggestedSpecialtySlug(answers);

  return (
    <Screen header={<StackHeader title="Your risk report" fallbackHref="/(patient)/(tabs)" />}>
      <LinearGradient
        colors={tone.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resultHero}>
        <Text style={styles.resultFor}>FOR {subjectName.toUpperCase()}</Text>
        <RiskScoreDial level={result.riskLevel} score={result.score} />
        <Text style={styles.resultTitle}>{result.title}</Text>
        <Text style={styles.resultSummary}>{result.summary}</Text>
      </LinearGradient>

      <Card style={styles.recommendation}>
        <View style={[styles.recIcon, { backgroundColor: tint(tone.color, 0.14) }]}>
          <Ionicons
            name={result.riskLevel === 'high' ? 'medical' : result.riskLevel === 'medium' ? 'calendar' : 'leaf'}
            size={20}
            color={tone.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.recLabel, { color: theme.textSecondary }]}>RECOMMENDED</Text>
          <Text style={[styles.recValue, { color: theme.text }]}>{result.recommendation}</Text>
        </View>
      </Card>

      <Text style={[styles.stepsHeading, { color: theme.text }]}>What to do next</Text>
      <View style={{ gap: Spacing.two }}>
        {result.nextSteps.map((step, index) => (
          <Card key={step} variant="muted" style={styles.nextStep}>
            <Text style={[styles.nextStepIndex, { color: tone.color }]}>{index + 1}</Text>
            <Text style={[styles.nextStepText, { color: theme.textSecondary }]}>{step}</Text>
          </Card>
        ))}
      </View>

      <View style={styles.actions}>
        {result.riskLevel === 'high' ? (
          <Button
            label="Connect to a doctor now"
            icon="videocam"
            onPress={() => router.push('/(patient)/telemedicine')}
            size="lg"
          />
        ) : (
          <Button
            label="Book a consult"
            icon="calendar-outline"
            onPress={() => router.push('/(patient)/telemedicine')}
            size="lg"
          />
        )}
        <Button
          label="Read about this specialty"
          variant="outline"
          onPress={() => router.push(`/(info)/specialties/${specialtySlug}`)}
        />
        <Button label="Run another check" variant="ghost" size="sm" icon="refresh" onPress={onRestart} />
      </View>

      <Card variant="muted" style={styles.emergency}>
        <Ionicons name="lock-closed" size={16} color={theme.primary} />
        <Text style={[styles.emergencyText, { color: theme.textSecondary }]}>
          Saved to your history. Only you and the doctors you consult can see it.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  question: {
    ...Typography.heading,
  },
  helper: {
    ...Typography.caption,
    marginBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  optionLabel: {
    ...Typography.small,
    flex: 1,
    fontWeight: '500',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerRound: {
    borderRadius: Radius.full,
  },
  subject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  subjectName: {
    ...Typography.smallStrong,
  },
  subjectDetail: {
    ...Typography.caption,
    textTransform: 'capitalize',
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  addLinkText: {
    ...Typography.smallStrong,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  emergency: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  emergencyText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  resultHero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  resultFor: {
    ...Typography.overline,
    color: 'rgba(255,255,255,0.85)',
  },
  resultTitle: {
    ...Typography.heading,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resultSummary: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    marginTop: Spacing.three,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recLabel: {
    ...Typography.overline,
  },
  recValue: {
    ...Typography.smallStrong,
    marginTop: 2,
  },
  stepsHeading: {
    ...Typography.section,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  nextStep: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    alignItems: 'flex-start',
  },
  nextStepIndex: {
    ...Typography.smallStrong,
    fontWeight: '800',
  },
  nextStepText: {
    ...Typography.small,
    flex: 1,
  },
});
