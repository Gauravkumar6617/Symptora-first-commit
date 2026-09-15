export type UserRole = 'patient' | 'doctor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: UserRole;
  specialization?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  lastCheck: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
  mode: 'in-person' | 'video';
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  rating: number;
  avatarUrl?: string;
}

export interface RiskCheck {
  id: string;
  title: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}
