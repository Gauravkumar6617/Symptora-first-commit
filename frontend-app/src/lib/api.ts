/**
 * API layer.
 *
 * Auth calls hit the real FastAPI backend when EXPO_PUBLIC_API_URL is set
 * (see backend/app/routers/userRouter.py). Catalog/appointment data is still
 * served from src/data/mock/* — each fetch* below is a one-line swap to a
 * request once those routes exist. `src/data/specialties.ts` is NOT mock;
 * it's real static content this app ships with.
 */

import { blogPosts, catalogDoctors, partnerClinics } from '@/data/mock/directory';
import {
  mockAppointments,
  mockDoctor,
  mockDoctorAppointments,
  mockNotifications,
  mockPatient,
} from '@/data/mock/people';
import { specialties } from '@/data/specialties';
import type {
  Appointment,
  AppNotification,
  AuthSession,
  AuthUser,
  ClinicRecord,
  DoctorClinicLink,
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

/** UserResponse → AuthUser (adds the UI-only role field). */
export function toAuthUser(user: UserResponse, specialization?: string): AuthUser {
  return {
    ...user,
    role: user.id_doctor ? 'doctor' : 'patient',
    specialization,
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

/**
 * POST /api/v1/users/login — see backend/app/routers/userRouter.py. Returns a
 * bearer token; there is no /users/me yet, so the session user is built from
 * what was typed until that route lands.
 */
export async function loginUser(email: string, password: string, asDoctor = false): Promise<AuthSession> {
  if (isDemoMode) {
    await delay(450);
    if (password.length < 8) {
      throw new ApiError('Incorrect email or password.', 401);
    }
    const base = asDoctor ? mockDoctor : mockPatient;
    return { user: { ...base, email } };
  }

  const tokens = await request<{ access_token: string; token_type: string }>('/users/login', {
    method: 'POST',
    body: { email, password },
  });

  const now = new Date().toISOString();
  const user = toAuthUser({
    id: email,
    created_at: now,
    updated_at: now,
    is_active: true,
    id_doctor: asDoctor,
    first_name: email.split('@')[0],
    last_name: '',
    email,
    number: '',
    address: null,
    avatar: null,
    date_of_birth: now,
    gender: null,
  });

  return { user, accessToken: tokens.access_token };
}

/** PATCH /api/v1/users/{id} — backend UserUpdate. */
export async function updateUser(
  userId: string,
  payload: UserUpdatePayload,
  token?: string,
): Promise<Partial<AuthUser>> {
  if (isDemoMode) {
    await delay(400);
    return payload as Partial<AuthUser>;
  }

  const user = await request<UserResponse>(`/users/${userId}`, {
    method: 'PATCH',
    body: payload,
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

// ------------------------------------------------------- mocked resources
//
// Family members and Health Check history are NOT fetched from here — the
// app reads/writes those from useFamilyStore/useHealthCheckStore (backed by
// on-device AsyncStorage), which start empty for a new user. There is no
// fetchFamilyMembers/fetchRiskChecks; don't add screens that call one.

export async function fetchPatientAppointments(): Promise<Appointment[]> {
  await delay();
  return mockAppointments;
}

export async function fetchDoctorAppointments(): Promise<Appointment[]> {
  await delay();
  return mockDoctorAppointments;
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

export async function submitDoctorApplication(payload: {
  first_name: string;
  last_name: string;
  email: string;
  number: string;
  specialization: string;
  license_number: string;
  experience_years: string;
  about: string;
}): Promise<void> {
  if (isDemoMode) {
    await delay(700);
    return;
  }
  await request('/doctors/applications', { method: 'POST', body: payload });
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
