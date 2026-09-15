import {
  Baby,
  Brain,
  Ear,
  HeartPulse,
  Smile,
  Sparkles,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface Specialty {
  slug: string
  label: string
  /** Matches Doctor.specialty for filtering the doctor list */
  doctorSpecialty: string
  shortDescription: string
  longDescription: string
  icon: LucideIcon
  gradient: string
  commonFor: string[]
}

export const specialties: Specialty[] = [
  {
    slug: 'health-check',
    label: 'Health Check',
    doctorSpecialty: 'General Physician',
    shortDescription: 'Start here for any new symptom',
    longDescription:
      'Not sure who to see? Run a guided Health Check first — answer a few questions about your symptoms and vitals and get a Low, Medium, or High risk report, with a recommendation on what to do next.',
    icon: Stethoscope,
    gradient: 'from-primary-400 to-primary-700',
    commonFor: ['New or unclear symptoms', 'Fever', 'General wellness check'],
  },
  {
    slug: 'general-physician',
    label: 'General Physician',
    doctorSpecialty: 'General Physician',
    shortDescription: 'Everyday illness & checkups',
    longDescription:
      'General physicians handle the everyday stuff — colds, infections, fatigue, routine checkups, and referrals to specialists when something needs a closer look.',
    icon: UserRound,
    gradient: 'from-primary-500 to-primary-800',
    commonFor: ['Cold & flu', 'Fatigue', 'Routine checkups', 'Referrals'],
  },
  {
    slug: 'pediatrician',
    label: 'Pediatrician',
    doctorSpecialty: 'Pediatrician',
    shortDescription: 'Care for infants, kids & teens',
    longDescription:
      'Pediatricians specialize in children from birth through adolescence — growth tracking, vaccinations, and the illnesses that are common in kids specifically.',
    icon: Baby,
    gradient: 'from-secondary to-primary-600',
    commonFor: ['Vaccinations', 'Growth concerns', "Kids' fevers & infections"],
  },
  {
    slug: 'dermatologist',
    label: 'Dermatologist',
    doctorSpecialty: 'Dermatologist',
    shortDescription: 'Skin, hair & nail concerns',
    longDescription:
      'From rashes and acne to hair loss and nail changes, dermatologists diagnose and treat skin conditions — you can even upload a photo of the affected area before your consult.',
    icon: Sparkles,
    gradient: 'from-primary-300 to-secondary',
    commonFor: ['Rashes & acne', 'Hair loss', 'Allergic reactions'],
  },
  {
    slug: 'gynecologist',
    label: 'Gynecologist',
    doctorSpecialty: 'Gynecologist',
    shortDescription: "Women's reproductive health",
    longDescription:
      "Gynecologists cover reproductive health at every stage — menstrual concerns, pregnancy care, contraception guidance, and routine women's health checkups.",
    icon: HeartPulse,
    gradient: 'from-primary-400 to-primary-700',
    commonFor: ['Menstrual concerns', 'Pregnancy care', 'Routine checkups'],
  },
  {
    slug: 'ent',
    label: 'Ear, Nose, Throat',
    doctorSpecialty: 'ENT Specialist',
    shortDescription: 'Ear, nose & throat specialists',
    longDescription:
      'ENT specialists treat everything from persistent sinus issues and ear infections to voice and throat concerns that a general physician would refer onward.',
    icon: Ear,
    gradient: 'from-primary-500 to-secondary',
    commonFor: ['Sinus issues', 'Ear infections', 'Sore throat'],
  },
  {
    slug: 'dentist',
    label: 'Dentist',
    doctorSpecialty: 'Dentist',
    shortDescription: 'Oral & dental health',
    longDescription:
      'Dentists handle everything from routine cleanings to toothaches — book a video consult for quick guidance, or find a partner clinic near you for in-person care.',
    icon: Smile,
    gradient: 'from-primary-400 to-primary-800',
    commonFor: ['Toothache', 'Routine cleaning', 'Gum concerns'],
  },
  {
    slug: 'psychiatrist',
    label: 'Psychiatrist',
    doctorSpecialty: 'Psychiatrist',
    shortDescription: 'Mental health & wellbeing',
    longDescription:
      'Psychiatrists support anxiety, low mood, sleep issues, and other mental health concerns in a private, judgment-free video consult you can book from home.',
    icon: Brain,
    gradient: 'from-primary-600 to-primary-800',
    commonFor: ['Anxiety & stress', 'Low mood', 'Sleep issues'],
  },
]

export function getSpecialtyBySlug(slug: string) {
  return specialties.find((item) => item.slug === slug)
}
