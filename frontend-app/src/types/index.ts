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
  is_admin?: boolean;
  /** Presigned, short-lived url for `avatar` (which is only a storage key). */
  avatar_url?: string | null;
}

/** backend: enumModel.Status — a doctor application's review state. */
export type DoctorApplicationStatus = 'pending' | 'approved' | 'rejected';

/** backend: CurrentUserResponse — GET/PATCH /api/v1/users/me. */
export interface CurrentUserResponse extends UserResponse {
  doctor_status?: DoctorApplicationStatus | null;
  specialization?: string | null;
}

/**
 * The signed-in user as the app holds it: the /users/me shape plus the
 * UI-only role, derived from `id_doctor` exactly as the website does.
 */
export interface AuthUser extends UserResponse {
  role: UserRole;
  specialization?: string;
  doctor_status?: DoctorApplicationStatus | null;
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

/** backend: schemas/clinic.PublicClinicRead — GET /clinics/directory. */
export interface PublicClinic {
  id: string;
  name: string;
  picture_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  /** Approved doctors working there. */
  doctors: { id: string; name: string; specialization: string }[];
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
  email?: string;
  /** Phone they log in with once they activate their account. */
  number?: string;
  /** They activated their own login and see their checks too. */
  hasAccount: boolean;
}

/** backend: schemas/family_member.FamilyMemberRead */
export interface FamilyMemberRecord {
  id: string;
  account_owner_id: string;
  full_name: string;
  email: string | null;
  number: string | null;
  medplum_patient_id: string | null;
  linked_user_id: string | null;
  has_account: boolean;
  profile: string | null;
  relationship_to_owner: FamilyRelationship | null;
  date_of_birth: string;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

/** backend: schemas/family_member.FamilyMemberCreate */
export interface FamilyMemberCreatePayload {
  full_name: string;
  relationship_to_owner: FamilyRelationship;
  /** YYYY-MM-DD */
  date_of_birth: string;
  gender?: Gender | null;
  email?: string | null;
  number?: string | null;
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

// ---------------------------------------------------------- symptom checker

/** backend: schemas/prediction.SymptomRead */
export interface Symptom {
  /** Send this back in predictDisease(), e.g. "high_fever". */
  id: string;
  /** Human-readable, e.g. "High fever". */
  label: string;
  /** Severity 1 (mild) .. 7 (serious). */
  weight: number;
}

/** backend: schemas/prediction.DiseasePrediction */
export interface DiseasePrediction {
  disease: string;
  label: string;
  /** 0..1 — relative likelihood among the 41 known conditions. */
  probability: number;
  description: string;
  precautions: string[];
}

/** backend: schemas/prediction.Duration — how long the symptoms have lasted. */
export const SYMPTOM_DURATIONS = ['today', 'few_days', 'week', 'longer'] as const;
export type SymptomDuration = (typeof SYMPTOM_DURATIONS)[number];

export const SYMPTOM_DURATION_LABELS: Record<SymptomDuration, string> = {
  today: 'Today',
  few_days: '1–6 days',
  week: '1–4 weeks',
  longer: 'Over a month',
};

/** Who the check is for. Feeds the urgency safety rules, not the model. */
export interface PatientDetails {
  age: number;
  gender: Gender;
  duration: SymptomDuration;
  /** Free text the symptoms were parsed from; red flags in it raise urgency. */
  description?: string;
}

/** backend: schemas/prediction.ParseResponse */
export interface ParsedSymptoms {
  /** Confidently matched; pre-select these. */
  symptoms: Symptom[];
  /** Vague words (e.g. "blood") with the symptoms they could mean. */
  suggestions: { phrase: string; options: Symptom[] }[];
  duration: SymptomDuration | null;
  /** Urgent-care warnings to show straight away. */
  red_flags: string[];
}

/** backend: schemas/prediction.PredictResponse */
export interface PredictionResult {
  /** The normalised symptom ids that were used. */
  symptoms: string[];
  /** Most likely first (top 3). */
  predictions: DiseasePrediction[];
  urgency: RiskLevel;
  /** Why the urgency is what it is, e.g. "Adults 65 and over are at higher risk." */
  urgency_reasons: string[];
  disclaimer: string;
  /** Id of the saved history entry. */
  check_id?: string | null;
}

/** backend: schemas/prediction.SymptomCheckRead — one saved check. */
export interface SymptomCheck {
  id: string;
  created_at: string;
  /** Who the check was about. */
  subject_name: string;
  /** The viewer's family profile it's about, if any. */
  family_member_id: string | null;
  run_by_name: string;
  /** The viewer ran it. */
  is_mine: boolean;
  /** The viewer is the patient. */
  about_me: boolean;
  age: number | null;
  gender: string | null;
  duration: SymptomDuration | null;
  symptoms: Symptom[];
  predictions: { disease: string; label: string; probability: number }[];
  urgency: RiskLevel;
  urgency_reasons: string[];
  synced_to_medplum: boolean;
}
