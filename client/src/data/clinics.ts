export interface Clinic {
  id: string
  name: string
  area: string
  city: string
  address: string
  distanceKm: number
  rating: number
  openHours: string
  services: string[]
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
]
