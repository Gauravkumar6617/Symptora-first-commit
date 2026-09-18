import type { Ionicons } from '@expo/vector-icons';

// Ported from client/src/data/*.ts (web app) so both apps show the same
// catalog. Swap for real API calls once the backend exposes these routes.

export interface Specialty {
  slug: string;
  label: string;
  doctorSpecialty: string;
  shortDescription: string;
  longDescription: string;
  icon: keyof typeof Ionicons.glyphMap;
  commonFor: string[];
}

export const specialties: Specialty[] = [
  {
    slug: 'health-check',
    label: 'Health Check',
    doctorSpecialty: 'General Physician',
    shortDescription: 'Start here for any new symptom',
    longDescription:
      'Not sure who to see? Run a guided Health Check first — answer a few questions about your symptoms and vitals and get a Low, Medium, or High risk report, with a recommendation on what to do next.',
    icon: 'medkit',
    commonFor: ['New or unclear symptoms', 'Fever', 'General wellness check'],
  },
  {
    slug: 'general-physician',
    label: 'General Physician',
    doctorSpecialty: 'General Physician',
    shortDescription: 'Everyday illness & checkups',
    longDescription:
      'General physicians handle the everyday stuff — colds, infections, fatigue, routine checkups, and referrals to specialists when something needs a closer look.',
    icon: 'person',
    commonFor: ['Cold & flu', 'Fatigue', 'Routine checkups', 'Referrals'],
  },
  {
    slug: 'pediatrician',
    label: 'Pediatrician',
    doctorSpecialty: 'Pediatrician',
    shortDescription: 'Care for infants, kids & teens',
    longDescription:
      'Pediatricians specialize in children from birth through adolescence — growth tracking, vaccinations, and the illnesses that are common in kids specifically.',
    icon: 'happy',
    commonFor: ['Vaccinations', 'Growth concerns', "Kids' fevers & infections"],
  },
  {
    slug: 'dermatologist',
    label: 'Dermatologist',
    doctorSpecialty: 'Dermatologist',
    shortDescription: 'Skin, hair & nail concerns',
    longDescription:
      'From rashes and acne to hair loss and nail changes, dermatologists diagnose and treat skin conditions — you can even upload a photo of the affected area before your consult.',
    icon: 'sparkles',
    commonFor: ['Rashes & acne', 'Hair loss', 'Allergic reactions'],
  },
  {
    slug: 'gynecologist',
    label: 'Gynecologist',
    doctorSpecialty: 'Gynecologist',
    shortDescription: "Women's reproductive health",
    longDescription:
      "Gynecologists cover reproductive health at every stage — menstrual concerns, pregnancy care, contraception guidance, and routine women's health checkups.",
    icon: 'heart',
    commonFor: ['Menstrual concerns', 'Pregnancy care', 'Routine checkups'],
  },
  {
    slug: 'ent',
    label: 'Ear, Nose, Throat',
    doctorSpecialty: 'ENT Specialist',
    shortDescription: 'Ear, nose & throat specialists',
    longDescription:
      'ENT specialists treat everything from persistent sinus issues and ear infections to voice and throat concerns that a general physician would refer onward.',
    icon: 'ear',
    commonFor: ['Sinus issues', 'Ear infections', 'Sore throat'],
  },
  {
    slug: 'dentist',
    label: 'Dentist',
    doctorSpecialty: 'Dentist',
    shortDescription: 'Oral & dental health',
    longDescription:
      'Dentists handle everything from routine cleanings to toothaches — book a video consult for quick guidance, or find a partner clinic near you for in-person care.',
    icon: 'happy-outline',
    commonFor: ['Toothache', 'Routine cleaning', 'Gum concerns'],
  },
  {
    slug: 'psychiatrist',
    label: 'Psychiatrist',
    doctorSpecialty: 'Psychiatrist',
    shortDescription: 'Mental health & wellbeing',
    longDescription:
      'Psychiatrists support anxiety, low mood, sleep issues, and other mental health concerns in a private, judgment-free video consult you can book from home.',
    icon: 'flower',
    commonFor: ['Anxiety & stress', 'Low mood', 'Sleep issues'],
  },
];

export function getSpecialtyBySlug(slug: string) {
  return specialties.find((item) => item.slug === slug);
}

export interface Clinic {
  id: string;
  name: string;
  area: string;
  city: string;
  address: string;
  distanceKm: number;
  rating: number;
  openHours: string;
  services: string[];
}

export const clinics: Clinic[] = [
  {
    id: 'clinic-koramangala',
    name: 'Symptora Care – Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala',
    distanceKm: 1.2,
    rating: 4.7,
    openHours: '8:00 AM – 9:00 PM',
    services: ['General Physician', 'Psychiatry', 'Lab Tests'],
  },
  {
    id: 'clinic-indiranagar',
    name: 'Symptora Care – Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    address: '100 Feet Road, Indiranagar',
    distanceKm: 3.8,
    rating: 4.6,
    openHours: '9:00 AM – 8:00 PM',
    services: ['Dermatology', 'ENT', 'Vaccinations'],
  },
  {
    id: 'clinic-andheri',
    name: 'Symptora Care – Andheri West',
    area: 'Andheri West',
    city: 'Mumbai',
    address: 'Link Road, Andheri West',
    distanceKm: 5.1,
    rating: 4.8,
    openHours: '8:00 AM – 10:00 PM',
    services: ['Pediatrics', 'Gynecology', 'Diagnostics'],
  },
  {
    id: 'clinic-hitech-city',
    name: 'Symptora Care – Hitech City',
    area: 'Hitech City',
    city: 'Hyderabad',
    address: 'Cyber Towers Road, Hitech City',
    distanceKm: 7.4,
    rating: 4.5,
    openHours: '9:00 AM – 9:00 PM',
    services: ['General Physician', 'Cardiology'],
  },
];

export interface CatalogDoctor {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  rating: number;
  consults: string;
  languages: string[];
  fee: number;
  availableToday: boolean;
  clinicId: string;
}

export const catalogDoctors: CatalogDoctor[] = [
  {
    id: 'dr-ananya-rao',
    name: 'Dr. Ananya Rao',
    specialty: 'General Physician',
    experienceYears: 12,
    rating: 4.8,
    consults: '12k+',
    languages: ['English', 'Hindi'],
    fee: 499,
    availableToday: true,
    clinicId: 'clinic-koramangala',
  },
  {
    id: 'dr-karan-shah',
    name: 'Dr. Karan Shah',
    specialty: 'Pediatrician',
    experienceYears: 9,
    rating: 4.7,
    consults: '8k+',
    languages: ['English', 'Gujarati'],
    fee: 549,
    availableToday: true,
    clinicId: 'clinic-andheri',
  },
  {
    id: 'dr-meera-iyer',
    name: 'Dr. Meera Iyer',
    specialty: 'Dermatologist',
    experienceYears: 7,
    rating: 4.9,
    consults: '6k+',
    languages: ['English', 'Tamil'],
    fee: 599,
    availableToday: false,
    clinicId: 'clinic-indiranagar',
  },
  {
    id: 'dr-farhan-ali',
    name: 'Dr. Farhan Ali',
    specialty: 'Psychiatrist',
    experienceYears: 14,
    rating: 4.9,
    consults: '15k+',
    languages: ['English', 'Urdu'],
    fee: 699,
    availableToday: true,
    clinicId: 'clinic-koramangala',
  },
  {
    id: 'dr-priya-menon',
    name: 'Dr. Priya Menon',
    specialty: 'Gynecologist',
    experienceYears: 11,
    rating: 4.8,
    consults: '10k+',
    languages: ['English', 'Malayalam'],
    fee: 599,
    availableToday: false,
    clinicId: 'clinic-andheri',
  },
  {
    id: 'dr-sameer-khan',
    name: 'Dr. Sameer Khan',
    specialty: 'ENT Specialist',
    experienceYears: 10,
    rating: 4.6,
    consults: '7k+',
    languages: ['English', 'Hindi'],
    fee: 499,
    availableToday: true,
    clinicId: 'clinic-indiranagar',
  },
];

export const timeSlots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '11:15 AM',
  '02:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string[];
  author: string;
  date: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'when-to-see-a-doctor-for-fever',
    title: 'When Should You Actually See a Doctor for a Fever?',
    category: 'Symptom Guide',
    excerpt:
      'Not every fever needs an ER visit, but some do. Here is how to tell the difference in under a minute.',
    author: 'Dr. Ananya Rao',
    date: '2026-08-12',
    readTime: '4 min read',
    content: [
      "A fever is your body's natural response to infection, and most low-grade fevers resolve on their own within a few days with rest and fluids.",
      'You should seek medical attention if the fever is above 103°F (39.4°C), lasts more than three days, or is accompanied by a stiff neck, confusion, difficulty breathing, or a rash.',
      'For infants under three months, any fever warrants an immediate call to a doctor.',
      "Symptora's Health Check walks through these red flags automatically and tells you whether to self-monitor, book a routine appointment, or start a telemedicine consult right away.",
    ],
  },
  {
    slug: 'managing-elderly-parents-health-remotely',
    title: "Managing Your Elderly Parents' Health When You Live Far Away",
    category: 'Family Care',
    excerpt:
      'Family profiles make it possible to track symptoms, book appointments, and get alerts for a parent who cannot easily do it themselves.',
    author: 'Priya Menon',
    date: '2026-07-28',
    readTime: '6 min read',
    content: [
      "Millions of adults manage a parent's healthcare from another city, often piecing together updates over phone calls.",
      'A shared family profile lets you log symptoms on their behalf, see risk reports as they come in, and get notified immediately if a check comes back high risk.',
      'It also keeps a single history of prescriptions and past consultations, so nothing gets lost between different doctors or hospital visits.',
    ],
  },
  {
    slug: 'understanding-your-risk-score',
    title: 'Understanding Your Symptora Risk Score',
    category: 'Product',
    excerpt: 'What Low, Medium, and High risk actually mean, and what happens next in each case.',
    author: 'Symptora Clinical Team',
    date: '2026-06-30',
    readTime: '5 min read',
    content: [
      'Every Health Check ends with a Low, Medium, or High risk score based on your reported symptoms and vitals.',
      'Low risk means self-care and monitoring are appropriate; Medium risk recommends booking a routine appointment within a few days.',
      'High risk automatically suggests an urgent telemedicine consult or an in-person visit, and flags the case for faster doctor review.',
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getClinicById(id: string) {
  return clinics.find((clinic) => clinic.id === id);
}

export function getCatalogDoctorById(id: string) {
  return catalogDoctors.find((doctor) => doctor.id === id);
}

/** Every city that has at least one partner clinic, for filter chips. */
export function clinicCities() {
  return Array.from(new Set(clinics.map((clinic) => clinic.city)));
}

/** Every blog category, for filter chips. */
export function blogCategories() {
  return Array.from(new Set(blogPosts.map((post) => post.category)));
}
