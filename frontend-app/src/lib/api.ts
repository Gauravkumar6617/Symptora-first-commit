/**
 * API layer.
 *
 * Auth calls hit the real FastAPI backend when EXPO_PUBLIC_API_URL is set
 * (see backend/app/routers/userRouter.py). The signed-in user always comes
 * from GET /users/me — the same source the website uses. Catalog/appointment data is still
 * served from src/data/mock/* — each fetch* below is a one-line swap to a
 * request once those routes exist. `src/data/specialties.ts` is NOT mock;
 * it's real static content this app ships with.
 */

import { blogPosts, catalogDoctors, partnerClinics } from '@/data/mock/directory';
import { mockNotifications, mockPatient } from '@/data/mock/people';
import { useAuthStore } from '@/store/authStore';
import { specialties } from '@/data/specialties';
import type {
  Appointment,
  AppNotification,
  AuthSession,
  AuthUser,
  ClinicRecord,
  CurrentUserResponse,
  DoctorClinicLink,
  FamilyMember,
  FamilyMemberCreatePayload,
  FamilyMemberRecord,
  Gender,
  UserCreatePayload,
  UserResponse,
  UserUpdatePayload,
} from '@/types';

/** Set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.5:8000) to talk to the API. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
export const API_PREFIX = '/api/v1';

/** With no API URL configured the app runs against local mock data. */
export const isDemoMode = !API_BASE_URL;

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status = 0, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Demo mode only: the signed-in user, to merge a local-only edit into. */
function currentUserSnapshot(): AuthUser {
  return useAuthStore.getState().user ?? mockPatient;
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  /** Send as application/x-www-form-urlencoded (FastAPI OAuth2 login). */
  form?: Record<string, string>;
  /** Send as multipart/form-data (registration uploads the avatar file). */
  formData?: FormData;
}

async function request<T>(
  path: string,
  { body, token, form, formData, headers, ...init }: RequestOptions = {},
): Promise<T> {
  if (isDemoMode) {
    throw new ApiError('No API URL configured (EXPO_PUBLIC_API_URL).', 0);
  }

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (formData) {
    // Content-Type is left unset so fetch adds the multipart boundary.
    payload = formData;
  } else if (form) {
    requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: requestHeaders,
      body: payload,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw toApiError(data, response.status, text);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** FastAPI returns `detail` as a string, or a list for validation errors. */
function toApiError(data: unknown, status: number, fallback: string): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;

  if (typeof detail === 'string') {
    return new ApiError(detail, status);
  }

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of detail) {
      const loc = (item as { loc?: unknown[] }).loc;
      const message = (item as { msg?: string }).msg ?? 'Invalid value.';
      const field = Array.isArray(loc) ? String(loc[loc.length - 1]) : undefined;
      if (field) fieldErrors[field] = message;
    }
    const first = Object.values(fieldErrors)[0];
    return new ApiError(first ?? 'Please check the highlighted fields.', status, fieldErrors);
  }

  return new ApiError(status ? `Request failed (${status}).` : fallback || 'Request failed.', status);
}

/**
 * /users/me → AuthUser. Role comes from the server's `id_doctor` flag only —
 * the same rule the website uses — so both clients always agree.
 */
export function toAuthUser(user: UserResponse | CurrentUserResponse): AuthUser {
  const me = user as CurrentUserResponse;
  return {
    ...user,
    role: user.id_doctor ? 'doctor' : 'patient',
    specialization: me.specialization ?? undefined,
    doctor_status: me.doctor_status ?? null,
  };
}

// ---------------------------------------------------------------- auth

/**
 * Starts registration without creating a user, then emails a verification code.
 *
 * POST /api/v1/users/register/request-otp takes multipart/form-data
 * (`UserCreate.as_form` plus an optional `avatar` file), so the picked image
 * URI is attached as a file part rather than sent as a string.
 */
export async function requestRegistrationOtp(payload: UserCreatePayload): Promise<void> {
  if (isDemoMode) {
    await delay(500);
    return;
  }

  const formData = new FormData();
  formData.append('first_name', payload.first_name);
  formData.append('last_name', payload.last_name);
  formData.append('email', payload.email);
  formData.append('number', payload.number);
  formData.append('password', payload.password);
  formData.append('date_of_birth', payload.date_of_birth);
  if (payload.address) formData.append('address', payload.address);
  if (payload.gender) formData.append('gender', payload.gender);
  if (payload.avatar) formData.append('avatar', uriToFilePart(payload.avatar));

  await request<{ detail: string }>('/users/register/request-otp', {
    method: 'POST',
    formData,
  });
}

/** React Native sends a local file URI to FormData as {uri, name, type}. */
function uriToFilePart(uri: string) {
  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const type = extension === 'png' ? 'image/png' : 'image/jpeg';
  return { uri, name: `avatar.${extension}`, type } as unknown as Blob;
}

/** Verifies the emailed code and creates the account. */
export async function verifyRegistrationOtp(email: string, otp: string): Promise<AuthUser> {
  if (isDemoMode) {
    await delay(500);
    const now = new Date().toISOString();
    return toAuthUser({
      id: `demo-${Date.now()}`,
      created_at: now,
      updated_at: now,
      is_active: true,
      id_doctor: false,
      first_name: 'Demo',
      last_name: 'User',
      email,
      number: '',
      address: null,
      avatar: null,
      date_of_birth: now,
      gender: null,
    });
  }
  const user = await request<UserResponse>('/users/register/verify', {
    method: 'POST',
    body: { email, otp },
  });
  return toAuthUser(user);
}

/** GET /api/v1/users/me — the account the bearer token belongs to. */
export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const user = await request<CurrentUserResponse>('/users/me', { token });
  return toAuthUser(user);
}

/**
 * POST /api/v1/users/login, then GET /users/me. The role is whatever the
 * server says the account is — never picked on the login screen.
 */
export async function loginUser(email: string, password: string): Promise<AuthSession> {
  if (isDemoMode) {
    await delay(450);
    if (password.length < 8) {
      throw new ApiError('Incorrect email or password.', 401);
    }
    return { user: { ...mockPatient, email } };
  }

  const tokens = await request<{ access_token: string; token_type: string }>('/users/login', {
    method: 'POST',
    body: { email, password },
  });
  const user = await fetchCurrentUser(tokens.access_token);
  return { user, accessToken: tokens.access_token };
}

/**
 * PATCH /api/v1/users/me — multipart, like registration, so a newly picked
 * avatar (a local file URI) is uploaded as a file part. An avatar that is
 * already a remote url is the unchanged current one and is not re-sent.
 */
export async function updateMyProfile(payload: UserUpdatePayload, token?: string | null): Promise<AuthUser> {
  if (isDemoMode || !token) {
    await delay(400);
    const current = currentUserSnapshot();
    return { ...current, ...payload, avatar_url: payload.avatar ?? null } as AuthUser;
  }

  const formData = new FormData();
  if (payload.first_name !== undefined) formData.append('first_name', payload.first_name);
  if (payload.last_name !== undefined) formData.append('last_name', payload.last_name);
  if (payload.number !== undefined) formData.append('number', payload.number);
  if (payload.address !== undefined) formData.append('address', payload.address ?? '');
  if (payload.gender !== undefined) formData.append('gender', payload.gender ?? '');
  if (payload.avatar && !/^https?:\/\//.test(payload.avatar)) {
    formData.append('avatar', uriToFilePart(payload.avatar));
  }

  const user = await request<CurrentUserResponse>('/users/me', {
    method: 'PATCH',
    formData,
    token,
  });
  return toAuthUser(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (isDemoMode) {
    await delay(500);
    return;
  }
  await request('/auth/forgot-password', { method: 'POST', body: { email } });
}

// ---------------------------------------------------------- family members
//
// Screens read family members from useFamilyStore, which calls these and
// falls back to on-device storage in demo mode (no EXPO_PUBLIC_API_URL).

/** The backend stores a date of birth; the app only asks for an age. */
export function ageToDateOfBirth(age: number): string {
  const today = new Date();
  const year = today.getUTCFullYear() - age;
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  // 29 Feb in a non-leap year rolls to 1 Mar, which is still the right age.
  return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString().slice(0, 10);
}

function ageFromDateOfBirth(dateOfBirth: string): number {
  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Math.max(age, 0);
}

export function toFamilyMember(record: FamilyMemberRecord): Omit<FamilyMember, 'lastCheck'> {
  return {
    id: record.id,
    name: record.full_name,
    relation: record.relationship_to_owner ?? 'other',
    age: ageFromDateOfBirth(record.date_of_birth),
    gender: (record.gender as Gender | null) ?? undefined,
  };
}

/** GET /api/v1/family-members — the caller's family profiles. */
export async function fetchFamilyMembers(token: string): Promise<FamilyMemberRecord[]> {
  return request<FamilyMemberRecord[]>('/family-members', { token });
}

/** POST /api/v1/family-members */
export async function createFamilyMember(
  token: string,
  payload: FamilyMemberCreatePayload,
): Promise<FamilyMemberRecord> {
  return request<FamilyMemberRecord>('/family-members', { method: 'POST', body: payload, token });
}

/** DELETE /api/v1/family-members/{member_id} */
export async function deleteFamilyMember(token: string, memberId: string): Promise<void> {
  await request(`/family-members/${memberId}`, { method: 'DELETE', token });
}

// ------------------------------------------------------- mocked resources
//
// Health Check history is NOT fetched from here — the app reads/writes it
// from useHealthCheckStore (backed by on-device AsyncStorage), which starts
// empty for a new user. There is no fetchRiskChecks; don't add screens that
// call one.
//
// Appointments start empty too — there is no booking flow or backend route
// yet, so there is nothing real to seed a new user with. `mockAppointments`/
// `mockDoctorAppointments` in src/data/mock/people.ts are kept only as
// sample shapes for whoever wires up the real appointments endpoint.

export async function fetchPatientAppointments(): Promise<Appointment[]> {
  await delay();
  return [];
}

export async function fetchDoctorAppointments(): Promise<Appointment[]> {
  await delay();
  return [];
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  await delay();
  return mockNotifications;
}

export async function fetchSpecialties() {
  await delay();
  return specialties;
}

/** Mock "find a partner clinic" directory — unrelated to fetchClinicOptions below. */
export async function fetchClinics() {
  await delay();
  return partnerClinics;
}

export async function fetchCatalogDoctors() {
  await delay();
  return catalogDoctors;
}

export async function fetchBlogPosts() {
  await delay();
  return blogPosts;
}

export async function sendContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (isDemoMode) {
    await delay(600);
    return;
  }
  await request('/support/contact', { method: 'POST', body: payload });
}

/**
 * POST /api/v1/doctor/promote — the same endpoint the website uses. The
 * account stays a patient until an admin approves it.
 */
export async function submitDoctorApplication(
  token: string | null | undefined,
  payload: { specialization: string; license_number: string },
): Promise<void> {
  if (isDemoMode) {
    await delay(700);
    return;
  }
  if (!token) {
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }
  await request('/doctor/promote', { method: 'POST', body: payload, token });
}

// ---------------------------------------------------------- doctor clinics

const demoClinicOptions: ClinicRecord[] = [
  {
    id: 'demo-clinic-1',
    name: 'Symptora City Clinic',
    picture: '',
    description: 'Demo clinic (no EXPO_PUBLIC_API_URL configured).',
    address: null,
    phone: null,
    medplum_organisation_id: 'demo-org-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/** GET /api/v1/clinics — every clinic, e.g. for a doctor picking one to join. */
export async function fetchClinicOptions(token: string): Promise<ClinicRecord[]> {
  if (isDemoMode) {
    await delay();
    return demoClinicOptions;
  }
  return request<ClinicRecord[]>('/clinics', { token });
}

/** GET /api/v1/doctor/my-clinics — clinics the calling doctor is assigned to. */
export async function fetchMyClinicLinks(token: string): Promise<DoctorClinicLink[]> {
  if (isDemoMode) {
    await delay();
    return [];
  }
  return request<DoctorClinicLink[]>('/doctor/my-clinics', { token });
}

/**
 * POST /api/v1/doctor/clinics/{clinic_id}/assign — links the calling
 * (approved) doctor to a clinic, creating a PractitionerRole in Medplum.
 */
export async function assignDoctorToClinic(token: string, clinicId: string): Promise<DoctorClinicLink> {
  if (isDemoMode) {
    await delay(500);
    const now = new Date().toISOString();
    return {
      id: `demo-link-${clinicId}`,
      doctor_profile_id: 'demo-doctor',
      clinic_id: clinicId,
      medplum_practitioner_role_id: 'demo-role',
      created_at: now,
      updated_at: now,
    };
  }
  return request<DoctorClinicLink>(`/doctor/clinics/${clinicId}/assign`, {
    method: 'POST',
    token,
  });
}
