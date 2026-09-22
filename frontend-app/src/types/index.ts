/**
 * Client-side types.
 *
 * The auth/user types mirror the FastAPI schemas in
 * backend/app/schemas/userSchema.py and the enums in
 * backend/app/models/enumModel.py — field names are kept snake_case on
 * purpose so payloads can be sent to the API without a mapping layer.
 */

export type UserRole = 'patient' | 'doctor';

/** backend: UserBase.gender (free-form string column, constrained here). */
export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

/** backend: enumModel.RiskLevel */
export type RiskLevel = 'low' | 'medium' | 'high';

/** backend: enumModel.AppointmentStatus */
export type AppointmentStatus = 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';

/** backend: enumModel.ConsultationStatus */
export type ConsultationStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/** backend: enumModel.FamilyRelationship */
export const FAMILY_RELATIONSHIPS = [
  'mother',
  'father',
  'son',
  'daughter',
  'brother',
  'sister',
  'husband',
  'wife',
  'grandmother',
  'grandfather',
  'grandson',
  'granddaughter',
  'uncle',
  'aunt',
  'nephew',
  'niece',
  'cousin',
  'other',
] as const;
export type FamilyRelationship = (typeof FAMILY_RELATIONSHIPS)[number];

/** backend: UserBase — the fields every user payload shares. */
export interface UserBase {
  first_name: string;
  last_name: string;
  email: string;
  number: string;
  address?: string | null;
  avatar?: string | null;
  /** ISO 8601 date-time string; backend expects a `datetime`. */
  date_of_birth: string;
  gender?: Gender | null;
}

/** backend: UserCreate — POST /api/v1/users/ request body. */
export interface UserCreatePayload extends UserBase {
  /** Backend constraint: min 8, max 72 characters. */
  password: string;
}

/** backend: UserUpdate — PATCH payload (every field optional). */
export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  number?: string;
  address?: string | null;
  avatar?: string | null;
  gender?: Gender | null;
}

/** backend: UserResponse (UserBase + ORMReadBase + flags). */
export interface UserResponse extends UserBase {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  id_doctor: boolean;
}

/**
 * The signed-in user as the app holds it: the API shape plus the UI-only
 * bits (role derived from `id_doctor`, doctor specialization).
 */
export interface AuthUser extends UserResponse {
  role: UserRole;
  specialization?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

/** backend: ClinicRead — GET /api/v1/clinics. */
export interface ClinicRecord {
  id: string;
  name: string;
  picture: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  medplum_organisation_id: string;
  created_at: string;
  updated_at: string;
}

/** backend: DoctorClinicRead — the calling doctor's link to one clinic. */
export interface DoctorClinicLink {
  id: string;
  doctor_profile_id: string;
  clinic_id: string;
  medplum_practitioner_role_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Field-level errors keyed by the payload field name. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelationship;
  age: number;
  gender?: Gender;
  lastCheck: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  mode: 'in-person' | 'video';
  clinic?: string;
  reason?: string;
}


export interface RiskCheck {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  createdAt: string;
  /** 0–100 triage score produced by the Health Check flow. */
  score?: number;
  summary?: string;
  forMember?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: 'appointment' | 'result' | 'reminder' | 'system';
  read: boolean;
}
