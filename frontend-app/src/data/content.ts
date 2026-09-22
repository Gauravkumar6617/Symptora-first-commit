import type { Ionicons } from '@expo/vector-icons';

// Real static content (marketing/informational copy) — not mock data, see
// src/data/mock/ for fake sample records standing in for backend responses.
// Ported from client/src (web app) so the mobile app tells the same story.
// Keep both in sync when copy changes.

export const APP_NAME = 'Symptora';
export const APP_TAGLINE = "Know when it matters. Act before it's late.";
export const SUPPORT_EMAIL = 'support@symptora.health';
export const SUPPORT_PHONE = '+91 80 4567 8900';
export const HEAD_OFFICE = '4th Block, Koramangala, Bengaluru';

export interface Stat {
  value: string;
  label: string;
}

export const trustStats: Stat[] = [
  { value: '25k+', label: 'Health checks run' },
  { value: '4.8/5', label: 'Average doctor rating' },
  { value: '<3 min', label: 'To connect on High risk' },
  { value: '40+', label: 'Partner clinics' },
];

export const aboutStats: Stat[] = [
  { value: '25k+', label: 'Health checks run' },
  { value: '40+', label: 'Partner clinics' },
  { value: '120+', label: 'Verified doctors' },
  { value: '4.8/5', label: 'Average rating' },
];

export interface ValueItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const brandValues: ValueItem[] = [
  {
    icon: 'locate',
    title: 'Clarity over panic',
    description:
      'We turn "I don\'t feel well" into a clear next step — self-care, a routine visit, or a doctor right now.',
  },
  {
    icon: 'people',
    title: 'Built for the whole family',
    description:
      'Parents, kids, grandparents — one account should be able to look after everyone, not just one person.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Privacy by default',
    description:
      'Health records are sensitive. Everything is encrypted and stored on a Medplum FHIR backend built for healthcare data.',
  },
  {
    icon: 'flash',
    title: 'Speed when it matters',
    description:
      'A High risk result should never sit in a queue — auto-escalation connects you to a doctor in minutes.',
  },
];

export const ourStory =
  'We kept seeing the same pattern: people either ignored serious symptoms because they didn\'t want to "make a fuss", or panicked over minor issues and ended up in an ER waiting room for hours. Neither outcome is good for patients or for a healthcare system already stretched thin. Symptora exists to close that gap — a single place to check symptoms, understand the risk, and get matched to the right kind of care immediately, for you and the people you look after.';

export interface HowItWorksStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const howItWorks: HowItWorksStep[] = [
  {
    icon: 'clipboard',
    title: 'Do a Health Check',
    description: 'Tell us your symptoms and vitals. It takes about two minutes.',
  },
  {
    icon: 'analytics',
    title: 'Get your risk report',
    description: 'Our triage engine scores you Low, Medium, or High risk with a clear explanation.',
  },
  {
    icon: 'videocam',
    title: 'Talk to a doctor if needed',
    description:
      'High risk auto-connects you to telemedicine. Low and Medium get self-care tips or a normal booking.',
  },
];

export const telemedicineFeatures: ValueItem[] = [
  { icon: 'videocam', title: 'Video consults', description: 'Face-to-face with a doctor, wherever you are.' },
  { icon: 'chatbubbles', title: 'Chat follow-ups', description: 'Ask quick questions after your visit.' },
  { icon: 'medkit', title: 'E-prescriptions', description: 'Digital prescriptions, ready at any pharmacy.' },
  { icon: 'flash', title: 'Auto-escalation', description: 'High risk skips the queue automatically.' },
];

export interface ComparisonRow {
  label: string;
  symptora: boolean;
  oldWay: boolean;
}

export const comparisonRows: ComparisonRow[] = [
  { label: 'Know your risk before you decide', symptora: true, oldWay: false },
  { label: 'Connect to a doctor in minutes', symptora: true, oldWay: false },
  { label: 'One profile for your whole family', symptora: true, oldWay: false },
  { label: 'Digital prescription & visit history', symptora: true, oldWay: false },
  { label: 'Hours in a waiting room', symptora: false, oldWay: true },
  { label: 'Guessing symptoms on search engines', symptora: false, oldWay: true },
];

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: 'How does the Health Check decide my risk level?',
    answer:
      'You answer a short set of questions about your symptoms and vitals. Our triage logic, built with clinicians, scores you Low, Medium, or High risk and explains why — it never replaces a doctor, it tells you how urgently you need one.',
  },
  {
    question: 'What happens if my risk comes back High?',
    answer:
      'Symptora automatically opens a telemedicine request and connects you to the next available doctor, usually within a few minutes. No searching, no waiting room queue.',
  },
  {
    question: 'Can I manage healthcare for my parents or kids?',
    answer:
      'Yes. Family Profiles let you link anyone you care for under your account — run Health Checks, book appointments, and view visit history on their behalf, all in one place.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'Your records are stored on a Medplum FHIR backend with end-to-end encryption, and video consults run over WebRTC. Only you and the doctors you consult can see your data.',
  },
  {
    question: 'Do I need to pay for every consultation?',
    answer:
      'Each doctor lists their consultation fee upfront before you book — there are no hidden charges, and follow-up chat messages after a video consult are included at no extra cost.',
  },
  {
    question: 'Is Symptora a replacement for emergency care?',
    answer:
      'No. If you have severe symptoms — crushing chest pain, trouble breathing, heavy bleeding, or loss of consciousness — call your local emergency number immediately.',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "My father's chest pain check came back High risk at 11pm and we were on a video call with a doctor in under three minutes. That speed mattered.",
    name: 'Rohan Verma',
    role: 'Using Symptora for 8 months',
  },
  {
    quote:
      'I used to Google every symptom and scare myself. Now I run a Health Check first — it tells me honestly when it is nothing and when I should actually go in.',
    name: 'Ayesha Khan',
    role: 'Health Check user',
  },
  {
    quote:
      'Managing appointments for my mother from another city used to mean a dozen phone calls. Family Profiles put it all in one place I can actually see.',
    name: 'Sandeep Nair',
    role: 'Family Profiles user',
  },
];

export interface ContactChannel {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  /** Passed to Linking.openURL when the card is tapped. */
  href?: string;
}

export const contactChannels: ContactChannel[] = [
  { icon: 'mail', label: 'Email', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  { icon: 'call', label: 'Phone', value: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE.replace(/\s/g, '')}` },
  { icon: 'location', label: 'Head office', value: HEAD_OFFICE },
];

export const LEGAL_LAST_UPDATED = '18 September 2026';

export interface LegalSection {
  heading: string;
  body: string;
}

export const privacySections: LegalSection[] = [
  {
    heading: 'Data we collect',
    body: 'We collect the information you provide when creating an account — name, email, phone number, date of birth, gender, and optional address and profile photo — along with the symptoms, vitals, and family member profiles you add while using Symptora.',
  },
  {
    heading: 'How we use it',
    body: 'Your data is used to produce risk assessments, connect you with doctors, and maintain your appointment and family history. Clinical records are stored on a Medplum FHIR server. We never sell your health data or use it for advertising.',
  },
  {
    heading: 'Who can see it',
    body: 'Only you and the doctors you consult can see your clinical records. Our support team can access account details (not consultation notes) when you ask for help.',
  },
  {
    heading: 'Your controls',
    body: 'You can update or remove your profile, family member profiles, and Health Check history at any time from Profile → Settings. Deleting your account removes your records from our systems within 30 days.',
  },
];

export const termsSections: LegalSection[] = [
  {
    heading: 'Using Symptora',
    body: 'Symptora provides risk guidance and access to licensed doctors, but it is not a substitute for emergency care. In a medical emergency, contact your local emergency services immediately.',
  },
  {
    heading: 'Health Check results',
    body: 'Risk levels are triage guidance generated from the answers you give. They are not a diagnosis, and accuracy depends on the information you provide being complete and truthful.',
  },
  {
    heading: 'Appointments and fees',
    body: 'Appointments are subject to doctor and clinic availability. Consultation fees are shown before you book. Cancellations should be made as early as possible so the slot can be released.',
  },
  {
    heading: 'Account responsibility',
    body: 'You are responsible for keeping your login credentials safe and for the accuracy of the health information you and your family members provide.',
  },
];
