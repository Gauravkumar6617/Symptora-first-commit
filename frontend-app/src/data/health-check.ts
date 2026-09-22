import type { Ionicons } from '@expo/vector-icons';

import type { RiskLevel } from '@/types';

/**
 * The Health Check triage questionnaire — real, working client-side scoring
 * logic (not a fake sample record from src/data/mock/), used until a
 * backend triage service exists to take over the scoring itself.
 *
 * Scoring is deliberately simple and transparent: every answer carries a
 * weight, the weights are normalised to 0–100, and any "red flag" answer
 * forces a High risk result regardless of the total. This mirrors the
 * Low/Medium/High contract of backend enumModel.RiskLevel.
 */

export interface HealthCheckOption {
  value: string;
  label: string;
  /** Contribution to the raw triage score. */
  weight: number;
  /** Forces a High risk result when selected. */
  redFlag?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface HealthCheckQuestion {
  id: string;
  question: string;
  helper?: string;
  type: 'single' | 'multi';
  options: HealthCheckOption[];
}

export const healthCheckQuestions: HealthCheckQuestion[] = [
  {
    id: 'primary',
    question: 'What is bothering you most?',
    helper: 'Pick the symptom that concerns you the most right now.',
    type: 'single',
    options: [
      { value: 'chest', label: 'Chest pain or pressure', weight: 26, icon: 'heart' },
      { value: 'breathing', label: 'Shortness of breath', weight: 24, icon: 'fitness' },
      { value: 'fever', label: 'Fever or chills', weight: 12, icon: 'thermometer' },
      { value: 'head', label: 'Headache or dizziness', weight: 12, icon: 'pulse' },
      { value: 'stomach', label: 'Stomach or digestive pain', weight: 10, icon: 'nutrition' },
      { value: 'skin', label: 'Skin, rash or wound', weight: 6, icon: 'sparkles' },
      { value: 'mental', label: 'Mood, sleep or anxiety', weight: 8, icon: 'flower' },
      { value: 'other', label: 'Something else', weight: 8, icon: 'help-circle' },
    ],
  },
  {
    id: 'duration',
    question: 'How long has it been going on?',
    type: 'single',
    options: [
      { value: 'hours', label: 'Started in the last few hours', weight: 14 },
      { value: 'days', label: '1–3 days', weight: 8 },
      { value: 'week', label: 'About a week', weight: 6 },
      { value: 'longer', label: 'Longer than a month', weight: 10 },
    ],
  },
  {
    id: 'severity',
    question: 'How bad does it feel?',
    helper: 'Think about how much it is stopping you from doing normal things.',
    type: 'single',
    options: [
      { value: 'mild', label: 'Mild — I can carry on as usual', weight: 2 },
      { value: 'moderate', label: 'Moderate — it is distracting', weight: 10 },
      { value: 'severe', label: 'Severe — I cannot do much', weight: 20 },
      { value: 'worst', label: 'The worst I have ever felt', weight: 28 },
    ],
  },
  {
    id: 'redFlags',
    question: 'Any of these right now?',
    helper: 'Select everything that applies. Select "None of these" if none do.',
    type: 'multi',
    options: [
      { value: 'chest-radiating', label: 'Chest pain spreading to arm, jaw or back', weight: 30, redFlag: true },
      { value: 'breathless-rest', label: 'Struggling to breathe while resting', weight: 30, redFlag: true },
      { value: 'fainting', label: 'Fainted or nearly fainted', weight: 26, redFlag: true },
      { value: 'confusion', label: 'New confusion or slurred speech', weight: 30, redFlag: true },
      { value: 'bleeding', label: 'Bleeding that will not stop', weight: 28, redFlag: true },
      { value: 'none', label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'temperature',
    question: 'What about your temperature?',
    type: 'single',
    options: [
      { value: 'normal', label: 'Normal', weight: 0 },
      { value: 'mild', label: 'Slightly warm (37.5–38.5°C)', weight: 8 },
      { value: 'high', label: 'High (above 38.5°C)', weight: 16 },
      { value: 'persistent', label: 'High for 3 days or more', weight: 22 },
      { value: 'unknown', label: 'Have not measured', weight: 4 },
    ],
  },
  {
    id: 'conditions',
    question: 'Do any of these apply to you?',
    helper: 'Existing conditions change how urgently symptoms should be seen.',
    type: 'multi',
    options: [
      { value: 'diabetes', label: 'Diabetes', weight: 8 },
      { value: 'hypertension', label: 'High blood pressure', weight: 8 },
      { value: 'heart', label: 'Heart disease', weight: 12 },
      { value: 'lung', label: 'Asthma or COPD', weight: 10 },
      { value: 'pregnant', label: 'Pregnant', weight: 10 },
      { value: 'immune', label: 'Weakened immune system', weight: 12 },
      { value: 'none', label: 'None of these', weight: 0 },
    ],
  },
];

/** Total score achievable, used to normalise to a 0–100 scale. */
const MAX_RAW_SCORE = 110;

export type HealthCheckAnswers = Record<string, string[]>;

export interface HealthCheckResult {
  score: number;
  riskLevel: RiskLevel;
  title: string;
  summary: string;
  recommendation: string;
  nextSteps: string[];
  redFlagged: boolean;
}

/** Older patients carry a small additive risk, as in most triage protocols. */
function ageWeight(age?: number | null) {
  if (age == null) return 0;
  if (age >= 70) return 12;
  if (age >= 60) return 8;
  if (age <= 2) return 10;
  if (age <= 5) return 6;
  return 0;
}

export function scoreHealthCheck(answers: HealthCheckAnswers, age?: number | null): HealthCheckResult {
  let raw = ageWeight(age);
  let redFlagged = false;

  for (const question of healthCheckQuestions) {
    const selected = answers[question.id] ?? [];
    for (const value of selected) {
      const option = question.options.find((item) => item.value === value);
      if (!option) continue;
      raw += option.weight;
      if (option.redFlag) redFlagged = true;
    }
  }

  const score = Math.min(100, Math.round((raw / MAX_RAW_SCORE) * 100));
  const riskLevel: RiskLevel = redFlagged || score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return {
    score: redFlagged ? Math.max(score, 80) : score,
    riskLevel,
    title: describeAnswers(answers),
    summary: summaryFor(riskLevel, redFlagged),
    recommendation: recommendationFor(riskLevel),
    nextSteps: nextStepsFor(riskLevel),
    redFlagged,
  };
}

function describeAnswers(answers: HealthCheckAnswers) {
  const primary = healthCheckQuestions[0].options.find(
    (option) => option.value === answers.primary?.[0],
  );
  return primary ? primary.label : 'Health Check';
}

function summaryFor(risk: RiskLevel, redFlagged: boolean) {
  if (redFlagged) {
    return 'You reported a symptom that needs to be seen straight away. We have flagged this for a doctor now.';
  }
  if (risk === 'high') {
    return 'Your answers point to something that should be assessed by a doctor today.';
  }
  if (risk === 'medium') {
    return 'Nothing here looks like an emergency, but it is worth getting checked in the next day or two.';
  }
  return 'Your answers suggest this can most likely be managed at home for now.';
}

function recommendationFor(risk: RiskLevel) {
  if (risk === 'high') return 'Connect to a doctor now';
  if (risk === 'medium') return 'Book a consult in the next 48 hours';
  return 'Self-care and monitoring';
}

function nextStepsFor(risk: RiskLevel): string[] {
  if (risk === 'high') {
    return [
      'Start a video consult — High risk checks skip the queue.',
      'If symptoms are severe or worsening, call your local emergency number.',
      'Have a list of your medications ready for the doctor.',
    ];
  }
  if (risk === 'medium') {
    return [
      'Book a consult with the matching specialty in the next 48 hours.',
      'Note down how the symptom changes — it helps the doctor.',
      'Run another Health Check if anything gets worse.',
    ];
  }
  return [
    'Rest, keep fluids up, and monitor for 48 hours.',
    'Run another Health Check if the symptom changes.',
    'Book a routine consult if it is still there after a week.',
  ];
}

/** Maps the primary symptom onto the specialty to book with. */
export function suggestedSpecialtySlug(answers: HealthCheckAnswers): string {
  const primary = answers.primary?.[0];
  switch (primary) {
    case 'chest':
    case 'breathing':
      return 'general-physician';
    case 'skin':
      return 'dermatologist';
    case 'mental':
      return 'psychiatrist';
    case 'head':
      return 'general-physician';
    default:
      return 'health-check';
  }
}
