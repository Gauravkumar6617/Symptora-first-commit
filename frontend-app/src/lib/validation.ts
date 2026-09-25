/**
 * Form validation mirroring the backend Pydantic constraints in
 * backend/app/schemas/userSchema.py so the client rejects what the API
 * would reject (and with the same limits).
 */

import type { FieldErrors, Gender, UserCreatePayload, UserUpdatePayload } from '@/types';
import { GENDERS } from '@/types';

export const LIMITS = {
  firstName: 24,
  lastName: 24,
  email: 50,
  number: 15,
  address: 255,
  passwordMin: 8,
  passwordMax: 72,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+]?[\d\s()-]{7,15}$/;

export interface DateParts {
  day: string;
  month: string;
  year: string;
}

export const emptyDateParts: DateParts = { day: '', month: '', year: '' };

/** Turns day/month/year inputs into the ISO string the API expects. */
export function datePartsToIso(parts: DateParts): string | null {
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);

  if (!day || !month || !year) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Month is 0-indexed in Date; UTC keeps the date stable across timezones.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

export function isoToDateParts(iso?: string | null): DateParts {
  if (!iso) return emptyDateParts;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return emptyDateParts;
  return {
    day: String(date.getUTCDate()),
    month: String(date.getUTCMonth() + 1),
    year: String(date.getUTCFullYear()),
  };
}

export function validateFirstName(value: string): string | undefined {
  if (!value.trim()) return 'First name is required.';
  if (value.trim().length > LIMITS.firstName) return `Keep it under ${LIMITS.firstName} characters.`;
  return undefined;
}

export function validateLastName(value: string): string | undefined {
  if (!value.trim()) return 'Last name is required.';
  if (value.trim().length > LIMITS.lastName) return `Keep it under ${LIMITS.lastName} characters.`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address.';
  if (value.trim().length > LIMITS.email) return `Keep it under ${LIMITS.email} characters.`;
  return undefined;
}

export function validateNumber(value: string): string | undefined {
  if (!value.trim()) return 'Phone number is required.';
  if (value.trim().length > LIMITS.number) return `Keep it under ${LIMITS.number} characters.`;
  if (!PHONE_PATTERN.test(value.trim())) return 'Enter a valid phone number.';
  return undefined;
}

export function validateAddress(value: string): string | undefined {
  if (value.trim().length > LIMITS.address) return `Keep it under ${LIMITS.address} characters.`;
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.';
  if (value.length < LIMITS.passwordMin) return `Use at least ${LIMITS.passwordMin} characters.`;
  if (value.length > LIMITS.passwordMax) return `Keep it under ${LIMITS.passwordMax} characters.`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Mix letters and numbers.';
  return undefined;
}

export function validateDateOfBirth(parts: DateParts): string | undefined {
  if (!parts.day && !parts.month && !parts.year) return 'Date of birth is required.';
  const iso = datePartsToIso(parts);
  if (!iso) return 'Enter a real date (DD / MM / YYYY).';

  const date = new Date(iso);
  const now = new Date();
  if (date.getTime() > now.getTime()) return 'Date of birth cannot be in the future.';
  if (now.getUTCFullYear() - date.getUTCFullYear() > 120) return 'Check the year.';
  return undefined;
}

export function validateGender(value: Gender | null | undefined): string | undefined {
  if (!value) return undefined;
  return GENDERS.includes(value) ? undefined : 'Choose one of the listed options.';
}

/** Rough strength meter for the signup password field. */
export function passwordStrength(value: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (value.length < LIMITS.passwordMin) return { score: 0, label: 'Too short' };
  let score = 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 12) score += 1;
  const labels = ['Too short', 'Weak', 'Good', 'Strong'] as const;
  return { score: score as 0 | 1 | 2 | 3, label: labels[score] };
}

export interface SignupForm {
  first_name: string;
  last_name: string;
  email: string;
  number: string;
  address: string;
  avatar: string | null;
  gender: Gender | null;
  dateOfBirth: DateParts;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export type SignupFieldErrors = FieldErrors<SignupForm>;

/** Step 1 of signup: who you are and how we reach you. */
export function validateSignupIdentity(form: SignupForm): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  errors.first_name = validateFirstName(form.first_name);
  errors.last_name = validateLastName(form.last_name);
  errors.email = validateEmail(form.email);
  errors.number = validateNumber(form.number);
  return stripUndefined(errors);
}

/** Step 2 of signup: the details the FHIR/Medplum patient record needs. */
export function validateSignupDetails(form: SignupForm): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  errors.dateOfBirth = validateDateOfBirth(form.dateOfBirth);
  errors.gender = validateGender(form.gender);
  errors.address = validateAddress(form.address);
  errors.password = validatePassword(form.password);
  if (!errors.password && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!form.acceptedTerms) {
    errors.acceptedTerms = 'Accept the terms to continue.';
  }
  return stripUndefined(errors);
}

export function validateSignup(form: SignupForm): SignupFieldErrors {
  return { ...validateSignupIdentity(form), ...validateSignupDetails(form) };
}

/** Maps a validated signup form onto the backend UserCreate payload. */
export function signupFormToPayload(form: SignupForm): UserCreatePayload {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim().toLowerCase(),
    number: form.number.trim(),
    address: form.address.trim() ? form.address.trim() : null,
    avatar: form.avatar,
    date_of_birth: datePartsToIso(form.dateOfBirth) ?? new Date().toISOString(),
    gender: form.gender,
    password: form.password,
  };
}

export interface ProfileForm {
  first_name: string;
  last_name: string;
  number: string;
  address: string;
  avatar: string | null;
  gender: Gender | null;
}

export function validateProfile(form: ProfileForm): FieldErrors<ProfileForm> {
  return stripUndefined({
    first_name: validateFirstName(form.first_name),
    last_name: validateLastName(form.last_name),
    number: validateNumber(form.number),
    address: validateAddress(form.address),
    gender: validateGender(form.gender),
  });
}

export function profileFormToPayload(form: ProfileForm): UserUpdatePayload {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    number: form.number.trim(),
    address: form.address.trim() ? form.address.trim() : null,
    avatar: form.avatar,
    gender: form.gender,
  };
}

/** `email` may also be a phone number (family members log in with the one they were added with). */
export function validateLogin(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  const value = email.trim();
  const isPhone = /^\+?[\d\s-]{7,16}$/.test(value);
  const emailError = isPhone ? undefined : value ? validateEmail(value) : 'Enter your email or phone number.';
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function stripUndefined<T extends Record<string, string | undefined>>(errors: T): T {
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => Boolean(value))) as T;
}
