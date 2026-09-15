export interface Doctor {
  id: string
  name: string
  specialty: string
  experienceYears: number
  rating: number
  consults: string
  languages: string[]
  fee: number
  availableToday: boolean
  clinicId: string
}

export const doctors: Doctor[] = [
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
]

export const timeSlots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '11:15 AM',
  '02:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
]
