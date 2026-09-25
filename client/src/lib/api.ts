/**
 * API layer for the web client.
 *
 * Talks to the FastAPI backend (see backend/app/routers/userRouter.py).
 * Point VITE_API_URL at the server, e.g. VITE_API_URL=http://localhost:8000.
 * Leaving it unset keeps requests same-origin (useful behind a proxy).
 */

import { type AuthUser, useAuthStore } from '@/store/authStore'

/** Base URL of the API server, without a trailing slash. */
export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
export const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  status: number
  /** Per-field messages parsed out of FastAPI's 422 validation payload. */
  fieldErrors?: Record<string, string>

  constructor(message: string, status = 0, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Sent as JSON. */
  body?: unknown
  /** Sent as multipart/form-data (registration uploads the avatar file). */
  formData?: FormData
  token?: string
}

async function request<T>(
  path: string,
  { body, formData, token, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (formData) {
    // Content-Type is left to the browser so it can add the multipart boundary.
    payload = formData
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: requestHeaders,
      body: payload,
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0)
  }

  const text = await response.text()
  const data = text ? safeJsonParse(text) : null

  if (!response.ok) {
    // Access tokens expire after 30 minutes and there's no refresh endpoint,
    // so a rejected token ends the session; ProtectedRoute then sends to /login.
    if (response.status === 401 && token) {
      useAuthStore.getState().logout()
      throw new ApiError('Your session has expired. Please log in again.', 401)
    }
    throw toApiError(data, response.status, text)
  }

  return data as T
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** FastAPI returns `detail` as a string, or a list for validation errors. */
function toApiError(data: unknown, status: number, fallback: string): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail

  if (typeof detail === 'string') {
    return new ApiError(detail, status)
  }

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const item of detail) {
      const loc = (item as { loc?: unknown[] }).loc
      const message = (item as { msg?: string }).msg ?? 'Invalid value.'
      const field = Array.isArray(loc) ? String(loc[loc.length - 1]) : undefined
      if (field) fieldErrors[field] = message
    }
    const first = Object.values(fieldErrors)[0]
    return new ApiError(
      first ?? 'Please check the highlighted fields.',
      status,
      fieldErrors,
    )
  }

  return new ApiError(
    status ? `Request failed (${status}).` : fallback || 'Request failed.',
    status,
  )
}

// ---------------------------------------------------------------- types

/** backend UserCreate (multipart fields; avatar travels as a file). */
export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  number: string
  password: string
  date_of_birth: string
  address?: string
  gender?: string
  avatar?: File | null
}

/** backend UserResponse. */
export interface UserResponse {
  id: string
  first_name: string
  last_name: string
  email: string
  number: string
  address: string | null
  avatar: string | null
  avatar_url?: string | null
  date_of_birth: string
  gender: string | null
  medplum_patient_id: string | null
  is_active: boolean
  id_doctor: boolean
  is_admin: boolean
}

/** backend TokenResponse. */
export interface TokenResponse {
  access_token: string
  token_type: string
}

// -------------------------------------------------------------- doctors

export type DoctorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** backend DoctorProfileCreate. */
export interface DoctorApplicationPayload {
  specialization: string
  license_number: string
  clinic_id?: string | null
}

/** backend DoctorProfileRead. */
export interface DoctorApplication {
  id: string
  user_id: string
  specialization: string
  license_number: string
  clinic_id: string | null
  medplum_practitioner_id: string | null
  status: DoctorApplicationStatus
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------- clinics

/** backend ClinicRead. */
export interface Clinic {
  id: string
  name: string
  picture: string
  description: string | null
  address: string | null
  phone: string | null
  medplum_organisation_id: string
  /** Presigned url for `picture` (an R2 key or absolute url). */
  picture_url: string | null
  created_at: string
  updated_at: string
}

/** A doctor listed under a clinic (approved doctors only). */
export interface ClinicDoctor {
  id: string
  name: string
  specialization: string
}

/** backend AdminClinicRead — a clinic plus its linked doctors. */
export interface AdminClinic extends Clinic {
  doctors: ClinicDoctor[]
}

/** backend PublicClinicRead — GET /clinics/directory, no login needed. */
export interface PublicClinic {
  id: string
  name: string
  picture_url: string | null
  description: string | null
  address: string | null
  phone: string | null
  doctors: ClinicDoctor[]
}

/** backend DoctorClinicRead — a doctor's link to one clinic. */
export interface DoctorClinic {
  id: string
  doctor_profile_id: string
  clinic_id: string
  medplum_practitioner_role_id: string | null
  created_at: string
  updated_at: string
}

/** POST /admin/clinics request body — the admin-typed fields; the backend
 * derives medplum_organisation_id itself by creating the Organization. */
export interface ClinicCreatePayload {
  name: string
  picture: string
  description?: string
  address?: string
  phone?: string
}

// ----------------------------------------------------------------- admin

/** backend GET /admin/stats. */
export interface AdminStats {
  patients: number
  doctors: number
  clinics: number
  pending_applications: number
}

/** backend AdminDoctorRead — an approved doctor plus their user info and clinics. */
export interface AdminDoctor {
  id: string
  user_id: string
  specialization: string
  license_number: string
  clinic_id: string | null
  medplum_practitioner_id: string | null
  status: DoctorApplicationStatus
  first_name: string
  last_name: string
  email: string
  clinics: Clinic[]
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------- auth

/**
 * POST /users/register/request-otp — validates the details and emails a code.
 * No account exists until the code is verified.
 */
export async function requestRegistrationOtp(
  payload: RegisterPayload,
): Promise<{ detail: string }> {
  const formData = new FormData()
  formData.append('first_name', payload.first_name)
  formData.append('last_name', payload.last_name)
  formData.append('email', payload.email)
  formData.append('number', payload.number)
  formData.append('password', payload.password)
  formData.append('date_of_birth', payload.date_of_birth)
  if (payload.address) formData.append('address', payload.address)
  if (payload.gender) formData.append('gender', payload.gender)
  if (payload.avatar) formData.append('avatar', payload.avatar)

  return request<{ detail: string }>('/users/register/request-otp', {
    method: 'POST',
    formData,
  })
}

/** POST /users/register/verify — confirms the emailed code and creates the user. */
export async function verifyRegistrationOtp(
  email: string,
  otp: string,
): Promise<UserResponse> {
  return request<UserResponse>('/users/register/verify', {
    method: 'POST',
    body: { email, otp },
  })
}

/** POST /users/login — returns a bearer token. */
export async function loginUser(
  /** Email or phone number. */
  email: string,
  password: string,
): Promise<TokenResponse> {
  return request<TokenResponse>('/users/login', {
    method: 'POST',
    body: { email, password },
  })
}

/** GET /users/me — the caller's own account, identified by the bearer token. */
export async function getCurrentUser(token: string): Promise<UserResponse> {
  return request<UserResponse>('/users/me', { token })
}

/** backend UserResponse → the store's AuthUser shape. */
export function toAuthUser(user: UserResponse): AuthUser {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    phone: user.number,
    address: user.address ?? undefined,
    avatarUrl: user.avatar_url ?? undefined,
    dateOfBirth: user.date_of_birth,
    gender: user.gender ?? undefined,
    isDoctor: user.id_doctor,
    isAdmin: user.is_admin,
  }
}

// ---------------------------------------------------------- password reset

/** POST /users/password/forgot — emails a 6-digit code (same reply for unknown emails). */
export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return request('/users/password/forgot', { method: 'POST', body: { email } })
}

/** POST /users/password/verify — checks the code; the token authorises the reset. */
export async function verifyPasswordReset(
  email: string,
  otp: string,
): Promise<{ reset_token: string }> {
  return request('/users/password/verify', { method: 'POST', body: { email, otp } })
}

/** POST /users/password/reset */
export async function resetPassword(payload: {
  email: string
  reset_token: string
  password: string
}): Promise<{ detail: string }> {
  return request('/users/password/reset', { method: 'POST', body: payload })
}

// ---------------------------------------------------------------- helpers

/**
 * POST /doctor/promote — submits a doctor application. It stays pending
 * until an admin approves it; nothing about the account changes yet.
 */
export async function applyToBecomeDoctor(
  token: string,
  payload: DoctorApplicationPayload,
): Promise<DoctorApplication> {
  return request<DoctorApplication>('/doctor/promote', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** GET /doctor/me — the caller's own application, or null if they never applied. */
export async function getMyDoctorApplication(
  token: string,
): Promise<DoctorApplication | null> {
  return request<DoctorApplication | null>('/doctor/me', { token })
}

/** GET /doctor/pending — every application awaiting admin review. */
export async function listPendingDoctorApplications(
  token: string,
): Promise<DoctorApplication[]> {
  return request<DoctorApplication[]>('/doctor/pending', { token })
}

/** PATCH /doctor/{id}/approve — creates the Medplum Practitioner and makes the user a doctor. */
export async function approveDoctorApplication(
  token: string,
  doctorId: string,
): Promise<DoctorApplication> {
  return request<DoctorApplication>(`/doctor/${doctorId}/approve`, {
    method: 'PATCH',
    token,
  })
}

/** PATCH /doctor/{id}/reject */
export async function rejectDoctorApplication(
  token: string,
  doctorId: string,
): Promise<DoctorApplication> {
  return request<DoctorApplication>(`/doctor/${doctorId}/reject`, {
    method: 'PATCH',
    token,
  })
}

/** GET /clinics — every clinic, e.g. for a doctor picking one to join. */
export async function listClinics(token: string): Promise<Clinic[]> {
  return request<Clinic[]>('/clinics', { token })
}

/** GET /doctor/my-clinics — clinics the calling doctor is currently assigned to. */
export async function getMyClinics(token: string): Promise<DoctorClinic[]> {
  return request<DoctorClinic[]>('/doctor/my-clinics', { token })
}

/**
 * POST /doctor/clinics/{clinic_id}/assign — links the calling (approved)
 * doctor to a clinic, creating a PractitionerRole in Medplum.
 */
export async function assignDoctorToClinic(
  token: string,
  clinicId: string,
): Promise<DoctorClinic> {
  return request<DoctorClinic>(`/doctor/clinics/${clinicId}/assign`, {
    method: 'POST',
    token,
  })
}

/** GET /admin/stats — counts for the dashboard header. */
export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats', { token })
}

/** GET /admin/patients — every non-doctor account. */
export async function fetchAdminPatients(token: string): Promise<UserResponse[]> {
  return request<UserResponse[]>('/admin/patients', { token })
}

/** GET /admin/doctors — every approved doctor, with their clinic links. */
export async function fetchAdminDoctors(token: string): Promise<AdminDoctor[]> {
  return request<AdminDoctor[]>('/admin/doctors', { token })
}

/**
 * POST /admin/clinics — creates the clinic's Organization in Medplum, then
 * the local row; `medplum_organisation_id` is derived server-side.
 */
/** GET /admin/clinics — every clinic with its linked doctors. */
export async function listAdminClinics(token: string): Promise<AdminClinic[]> {
  return request<AdminClinic[]>('/admin/clinics', { token })
}

/** GET /clinics/directory — public partner-clinic list for "Find a clinic". */
export async function listClinicDirectory(): Promise<PublicClinic[]> {
  return request<PublicClinic[]>('/clinics/directory')
}

/** POST /admin/clinics/picture — upload a photo; send `picture` on create/update. */
export async function uploadClinicPicture(
  token: string,
  file: File,
): Promise<{ picture: string; picture_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return request('/admin/clinics/picture', { method: 'POST', formData, token })
}

/** PATCH /admin/clinics/{id} — only the fields sent change; "" clears optional ones. */
export async function updateClinic(
  token: string,
  clinicId: string,
  payload: Partial<ClinicCreatePayload>,
): Promise<Clinic> {
  return request<Clinic>(`/admin/clinics/${clinicId}`, { method: 'PATCH', body: payload, token })
}

/** DELETE /admin/clinics/{id} — also unlinks its doctors. */
export async function deleteClinic(token: string, clinicId: string): Promise<void> {
  await request(`/admin/clinics/${clinicId}`, { method: 'DELETE', token })
}

export async function createClinic(
  token: string,
  payload: ClinicCreatePayload,
): Promise<Clinic> {
  return request<Clinic>('/admin/clinics', {
    method: 'POST',
    body: payload,
    token,
  })
}

// ---------------------------------------------------------- family members

/** backend enumModel.FamilyRelationship */
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
] as const
export type FamilyRelationship = (typeof FAMILY_RELATIONSHIPS)[number]

/** backend FamilyMemberRead. */
export interface FamilyMemberRecord {
  id: string
  account_owner_id: string
  full_name: string
  email: string | null
  /** Phone the member can log in with once they activate their account. */
  number: string | null
  medplum_patient_id: string | null
  linked_user_id: string | null
  /** True once the member activated their own login from the invite. */
  has_account: boolean
  /** Photo as a data URL. */
  profile: string | null
  relationship_to_owner: FamilyRelationship | null
  date_of_birth: string
  gender: string | null
  created_at: string
  updated_at: string
}

/** backend FamilyMemberCreate. */
export interface FamilyMemberCreatePayload {
  full_name: string
  relationship_to_owner: FamilyRelationship
  /** YYYY-MM-DD */
  date_of_birth: string
  gender?: string | null
  profile?: string | null
  email?: string | null
  number?: string | null
}

/** GET /family-members — the caller's family profiles. */
export async function listFamilyMembers(token: string): Promise<FamilyMemberRecord[]> {
  return request<FamilyMemberRecord[]>('/family-members', { token })
}

/** POST /family-members */
export async function createFamilyMember(
  token: string,
  payload: FamilyMemberCreatePayload,
): Promise<FamilyMemberRecord> {
  return request<FamilyMemberRecord>('/family-members', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** POST /family-members/{member_id}/invite — emails the member an activation code. */
export async function inviteFamilyMember(
  token: string,
  memberId: string,
): Promise<{ detail: string; has_account: boolean }> {
  return request(`/family-members/${memberId}/invite`, { method: 'POST', token })
}

/** POST /users/family-invite/request — the member asks for a (new) activation code. */
export async function requestFamilyInvite(email: string): Promise<{ detail: string }> {
  return request('/users/family-invite/request', { method: 'POST', body: { email } })
}

/** POST /users/family-invite/accept — code + password creates the member's login. */
export async function acceptFamilyInvite(payload: {
  email: string
  otp: string
  password: string
  number?: string
}): Promise<TokenResponse> {
  return request<TokenResponse>('/users/family-invite/accept', { method: 'POST', body: payload })
}

/** DELETE /family-members/{member_id} */
export async function deleteFamilyMember(token: string, memberId: string): Promise<void> {
  await request(`/family-members/${memberId}`, { method: 'DELETE', token })
}

// -------------------------------------------------------------------- blog

/** backend schemas/blog.BlogPostRead */
export interface BlogPost {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string
  /** Plain text; a blank line starts a new paragraph. */
  content: string
  paragraphs: string[]
  author: string
  /** R2 key or absolute url. */
  cover_image: string | null
  /** Presigned url for `cover_image`. */
  cover_image_url: string | null
  is_published: boolean
  published_at: string | null
  read_time: string
  created_at: string
  updated_at: string
}

/** POST /admin/blogs body. */
export interface BlogPostPayload {
  title: string
  category: string
  excerpt: string
  content: string
  author: string
  cover_image?: string | null
  is_published: boolean
}

/** GET /blogs — published posts, newest first. No login needed. */
export async function listBlogPosts(): Promise<BlogPost[]> {
  return request<BlogPost[]>('/blogs')
}

/** GET /blogs/{slug} */
export async function getBlogPost(slug: string): Promise<BlogPost> {
  return request<BlogPost>(`/blogs/${encodeURIComponent(slug)}`)
}

/** GET /admin/blogs — every post, drafts included. */
export async function listAdminBlogPosts(token: string): Promise<BlogPost[]> {
  return request<BlogPost[]>('/admin/blogs', { token })
}

export async function createBlogPost(token: string, payload: BlogPostPayload): Promise<BlogPost> {
  return request<BlogPost>('/admin/blogs', { method: 'POST', body: payload, token })
}

/** PATCH /admin/blogs/{id} — only the fields sent change; cover_image "" removes it. */
export async function updateBlogPost(
  token: string,
  postId: string,
  payload: Partial<BlogPostPayload>,
): Promise<BlogPost> {
  return request<BlogPost>(`/admin/blogs/${postId}`, { method: 'PATCH', body: payload, token })
}

export async function deleteBlogPost(token: string, postId: string): Promise<void> {
  await request(`/admin/blogs/${postId}`, { method: 'DELETE', token })
}

/** POST /admin/blogs/image — upload a cover; send `cover_image` on create/update. */
export async function uploadBlogImage(
  token: string,
  file: File,
): Promise<{ cover_image: string; cover_image_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return request('/admin/blogs/image', { method: 'POST', formData, token })
}

// ---------------------------------------------------------- symptom checker

/** backend schemas/prediction.SymptomRead */
export interface Symptom {
  /** Send this back in predictDisease(), e.g. "high_fever". */
  id: string
  /** Human-readable, e.g. "High fever". */
  label: string
  /** Severity 1 (mild) .. 7 (serious). */
  weight: number
}

/** backend schemas/prediction.DiseasePrediction */
export interface DiseasePrediction {
  disease: string
  label: string
  /** 0..1 — relative likelihood among the 41 known conditions. */
  probability: number
  description: string
  precautions: string[]
}

/** backend schemas/prediction.Gender */
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const
export type Gender = (typeof GENDERS)[number]['value']

/** backend schemas/prediction.Duration — how long the symptoms have lasted. */
export const SYMPTOM_DURATIONS = [
  { value: 'today', label: 'Today' },
  { value: 'few_days', label: '1–6 days' },
  { value: 'week', label: '1–4 weeks' },
  { value: 'longer', label: 'Over a month' },
] as const
export type SymptomDuration = (typeof SYMPTOM_DURATIONS)[number]['value']

/** Who the check is for. Feeds the urgency safety rules, not the model. */
export interface PatientDetails {
  age: number
  gender: Gender
  duration: SymptomDuration
  /** Free text the symptoms were parsed from; red flags in it raise urgency. */
  description?: string
}

/** backend schemas/prediction.ParseResponse */
export interface ParsedSymptoms {
  /** Confidently matched; pre-select these. */
  symptoms: Symptom[]
  /** Vague words (e.g. "blood") with the symptoms they could mean. */
  suggestions: { phrase: string; options: Symptom[] }[]
  duration: SymptomDuration | null
  /** Urgent-care warnings to show straight away. */
  red_flags: string[]
}

/** POST /symptoms/parse — "vomiting for two days and there's blood" → symptoms to confirm. */
export async function parseSymptoms(token: string, text: string): Promise<ParsedSymptoms> {
  return request<ParsedSymptoms>('/symptoms/parse', { method: 'POST', body: { text }, token })
}

/** backend schemas/prediction.PredictResponse */
export interface PredictionResult {
  /** The normalised symptom ids that were used. */
  symptoms: string[]
  /** Most likely first (top 3). */
  predictions: DiseasePrediction[]
  urgency: 'low' | 'medium' | 'high'
  /** Why the urgency is what it is, e.g. "Adults 65 and over are at higher risk." */
  urgency_reasons: string[]
  disclaimer: string
  /** Id of the saved history entry. */
  check_id: string | null
}

/** backend schemas/prediction.SymptomCheckRead — one saved check. */
export interface SymptomCheck {
  id: string
  created_at: string
  /** Who the check was about. */
  subject_name: string
  family_member_id: string | null
  run_by_name: string
  /** The viewer ran it. */
  is_mine: boolean
  /** The viewer is the patient. */
  about_me: boolean
  age: number | null
  gender: string | null
  duration: SymptomDuration | null
  symptoms: Symptom[]
  predictions: { disease: string; label: string; probability: number }[]
  urgency: 'low' | 'medium' | 'high'
  urgency_reasons: string[]
  synced_to_medplum: boolean
}

/**
 * GET /checks — your checks, the ones you ran for family, and the ones
 * family ran about you. Pass memberId for one family member's history.
 */
export async function listChecks(token: string, memberId?: string): Promise<SymptomCheck[]> {
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : ''
  return request<SymptomCheck[]>(`/checks${query}`, { token })
}

/** GET /symptoms — every symptom the model knows, for the picker. */
export async function listSymptoms(token: string): Promise<Symptom[]> {
  return request<Symptom[]>('/symptoms', { token })
}

/**
 * POST /predict — top 3 likely conditions for the given symptom ids
 * (from listSymptoms). Patient details only adjust the urgency flag.
 * Not a diagnosis; show the disclaimer with the result.
 */
export async function predictDisease(
  token: string,
  symptoms: string[],
  patient?: PatientDetails,
  familyMemberId?: string,
): Promise<PredictionResult> {
  return request<PredictionResult>('/predict', {
    method: 'POST',
    // Saved to history; family_member_id files it under that member.
    body: { symptoms, ...patient, family_member_id: familyMemberId },
    token,
  })
}

/** Turns the AvatarUpload data URL into a File for the multipart request. */
export async function dataUrlToFile(
  dataUrl: string,
  filename = 'avatar',
): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob()
  const extension = blob.type.split('/')[1] ?? 'png'
  return new File([blob], `${filename}.${extension}`, { type: blob.type })
}
