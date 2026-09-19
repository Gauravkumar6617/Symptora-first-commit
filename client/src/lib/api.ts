/**
 * API layer for the web client.
 *
 * Talks to the FastAPI backend (see backend/app/routers/userRouter.py).
 * Point VITE_API_URL at the server, e.g. VITE_API_URL=http://localhost:8000.
 * Leaving it unset keeps requests same-origin (useful behind a proxy).
 */

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
  date_of_birth: string
  gender: string | null
  medplum_patient_id: string
  is_active: boolean
  id_doctor: boolean
}

/** backend TokenResponse. */
export interface TokenResponse {
  access_token: string
  token_type: string
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
  email: string,
  password: string,
): Promise<TokenResponse> {
  return request<TokenResponse>('/users/login', {
    method: 'POST',
    body: { email, password },
  })
}

// ---------------------------------------------------------------- helpers

/** Turns the AvatarUpload data URL into a File for the multipart request. */
export async function dataUrlToFile(
  dataUrl: string,
  filename = 'avatar',
): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob()
  const extension = blob.type.split('/')[1] ?? 'png'
  return new File([blob], `${filename}.${extension}`, { type: blob.type })
}
