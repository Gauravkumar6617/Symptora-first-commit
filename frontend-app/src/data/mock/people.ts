import type { Appointment, AppNotification, AuthUser } from '@/types';

/**
 * MOCK DATA — fake sample records standing in for backend responses that
 * don't exist yet:
 *   - `mockPatient` / `mockDoctor` → demo-mode login identities only (see
 *     `loginUser` in src/lib/api.ts); real sessions come from POST /users/login.
 *   - `mockAppointments` / `mockDoctorAppointments` → an appointments endpoint.
 *   - `mockNotifications`         → a notifications endpoint.
 *
 * Family members and Health Check history are NOT here — they live in
 * useFamilyStore/useHealthCheckStore, which start empty for a new user
 * instead of being seeded with sample people/history.
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

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    patientName: 'Aarav Sharma',
    doctorName: 'Dr. Priya Nair',
    specialization: 'Cardiology',
    date: '2026-09-18',
    time: '10:30 AM',
    status: 'scheduled',
    mode: 'video',
    reason: 'Chest tightness follow-up',
  },
  {
    id: 'a2',
    patientName: 'Meera Sharma',
    doctorName: 'Dr. Sana Iqbal',
    specialization: 'Pediatrics',
    date: '2026-09-20',
    time: '4:00 PM',
    status: 'scheduled',
    mode: 'in-person',
    clinic: 'Symptora Care – Koramangala',
  },
  {
    id: 'a5',
    patientName: 'Aarav Sharma',
    doctorName: 'Dr. Arjun Mehta',
    specialization: 'Dermatology',
    date: '2026-09-02',
    time: '11:00 AM',
    status: 'completed',
    mode: 'video',
    reason: 'Rash on forearm',
  },
  {
    id: 'a6',
    patientName: 'Kabir Sharma',
    doctorName: 'Dr. Sana Iqbal',
    specialization: 'Pediatrics',
    date: '2026-08-24',
    time: '9:30 AM',
    status: 'cancelled',
    mode: 'in-person',
    clinic: 'Little Steps Clinic',
  },
];

export const mockDoctorAppointments: Appointment[] = [
  {
    id: 'a1',
    patientName: 'Aarav Sharma',
    doctorName: 'Dr. Priya Nair',
    specialization: 'Cardiology',
    date: '2026-09-18',
    time: '10:30 AM',
    status: 'scheduled',
    mode: 'video',
    reason: 'Chest tightness follow-up',
  },
  {
    id: 'a3',
    patientName: 'Neha Verma',
    doctorName: 'Dr. Priya Nair',
    specialization: 'Cardiology',
    date: '2026-09-18',
    time: '11:15 AM',
    status: 'scheduled',
    mode: 'in-person',
    clinic: 'HeartCare Clinic',
  },
  {
    id: 'a4',
    patientName: 'Kabir Sharma',
    doctorName: 'Dr. Priya Nair',
    specialization: 'Cardiology',
    date: '2026-09-17',
    time: '9:00 AM',
    status: 'completed',
    mode: 'video',
  },
  {
    id: 'a7',
    patientName: 'Imran Qureshi',
    doctorName: 'Dr. Priya Nair',
    specialization: 'Cardiology',
    date: '2026-09-19',
    time: '2:45 PM',
    status: 'rescheduled',
    mode: 'video',
    reason: 'Palpitations',
  },
];

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
