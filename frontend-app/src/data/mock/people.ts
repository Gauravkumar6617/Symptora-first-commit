import type { AppNotification, AuthUser } from '@/types';

/**
 * MOCK DATA — fake sample records standing in for backend responses that
 * don't exist yet:
 *   - `mockPatient` / `mockDoctor` → demo-mode login identities only (see
 *     `loginUser` in src/lib/api.ts); real sessions come from POST /users/login.
 *   - `mockNotifications`         → a notifications endpoint.
 *
 * Family members, Health Check history, and appointments are NOT here —
 * family/health-checks live in useFamilyStore/useHealthCheckStore, and
 * appointments come back empty from fetchPatientAppointments/
 * fetchDoctorAppointments in src/lib/api.ts — all start empty for a new
 * user instead of being seeded with sample people/history/bookings.
 *
 * Field names deliberately match the backend schemas
 * (backend/app/schemas/userSchema.py, app/models/enumModel.py) so swapping
 * the fetch* functions in src/lib/api.ts for real HTTP calls needs no
 * mapping layer once those routes exist.
 */

const NOW = '2026-09-18T09:00:00.000Z';

export const mockPatient: AuthUser = {
  id: 'u-patient-1',
  created_at: NOW,
  updated_at: NOW,
  first_name: 'Aarav',
  last_name: 'Sharma',
  email: 'aarav@example.com',
  number: '+919876543210',
  address: '12 MG Road, Bengaluru',
  avatar: null,
  date_of_birth: '1992-04-11T00:00:00.000Z',
  gender: 'male',
  is_active: true,
  id_doctor: false,
  role: 'patient',
};

export const mockDoctor: AuthUser = {
  id: 'u-doctor-1',
  created_at: NOW,
  updated_at: NOW,
  first_name: 'Priya',
  last_name: 'Nair',
  email: 'priya.nair@symptora.com',
  number: '+919000011122',
  address: 'HeartCare Clinic, Indiranagar',
  avatar: null,
  date_of_birth: '1985-11-02T00:00:00.000Z',
  gender: 'female',
  is_active: true,
  id_doctor: true,
  role: 'doctor',
  specialization: 'Cardiology',
};

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Video consult at 10:30 AM',
    body: 'Dr. Priya Nair is expecting you. Join from the Appointments tab.',
    createdAt: '2026-09-18T07:30:00.000Z',
    kind: 'appointment',
    read: false,
  },
  {
    id: 'n2',
    title: 'Health Check result ready',
    body: 'Your chest pain check came back High risk — a doctor has been notified.',
    createdAt: '2026-09-14T18:42:00.000Z',
    kind: 'result',
    read: false,
  },
  {
    id: 'n3',
    title: 'Time for Meera’s monthly check',
    body: 'It has been 30 days since her last Health Check.',
    createdAt: '2026-09-12T06:00:00.000Z',
    kind: 'reminder',
    read: true,
  },
  {
    id: 'n4',
    title: 'E-prescriptions are here',
    body: 'Prescriptions from video consults now save straight to your profile.',
    createdAt: '2026-09-05T10:15:00.000Z',
    kind: 'system',
    read: true,
  },
];
