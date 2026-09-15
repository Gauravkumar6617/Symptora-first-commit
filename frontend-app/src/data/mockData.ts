import type { Appointment, AuthUser, Doctor, FamilyMember, RiskCheck } from '@/types';

// Mock data mirrors the shapes used by client/src/data/*.ts and the backend
// models (UserModel, DoctorProfile, enumModel). Swap the fetch* functions in
// src/lib/api.ts for real HTTP calls once the backend exposes these routes.

export const mockPatient: AuthUser = {
  id: 'u-patient-1',
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  phone: '+91 98765 43210',
  role: 'patient',
};

export const mockDoctor: AuthUser = {
  id: 'u-doctor-1',
  name: 'Dr. Priya Nair',
  email: 'priya.nair@symptora.com',
  phone: '+91 90000 11122',
  role: 'doctor',
  specialization: 'Cardiology',
};

export const mockFamilyMembers: FamilyMember[] = [
  { id: 'f1', name: 'Meera Sharma', relation: 'mother', age: 54, lastCheck: 'Last check 3 days ago' },
  { id: 'f2', name: 'Kabir Sharma', relation: 'son', age: 9, lastCheck: 'Last check 2 weeks ago' },
  { id: 'f3', name: 'Rohan Sharma', relation: 'brother', age: 29, lastCheck: 'No checks yet' },
];

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Priya Nair', specialization: 'Cardiology', clinic: 'HeartCare Clinic', rating: 4.8 },
  { id: 'd2', name: 'Dr. Arjun Mehta', specialization: 'Dermatology', clinic: 'SkinFirst Clinic', rating: 4.6 },
  { id: 'd3', name: 'Dr. Sana Iqbal', specialization: 'Pediatrics', clinic: 'Little Steps Clinic', rating: 4.9 },
];

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
];

export const mockRiskChecks: RiskCheck[] = [
  { id: 'r1', title: 'Chest pain & shortness of breath', riskLevel: 'high', createdAt: '2026-09-14' },
  { id: 'r2', title: 'Seasonal cold symptoms', riskLevel: 'low', createdAt: '2026-09-10' },
];
