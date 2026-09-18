import type { AuthUser, FamilyRelationship, UserResponse } from '@/types';

/** The API stores names in two columns; the UI mostly wants one string. */
export function fullName(user?: Pick<UserResponse, 'first_name' | 'last_name'> | null) {
  if (!user) return '';
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
}

export function firstName(user?: Pick<UserResponse, 'first_name'> | null) {
  return user?.first_name?.trim() || 'there';
}

export function initials(nameOrUser?: string | Pick<UserResponse, 'first_name' | 'last_name'> | null) {
  const name = typeof nameOrUser === 'string' ? nameOrUser : fullName(nameOrUser);
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Splits a single typed name into the backend's first/last columns. */
export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? '',
    last_name: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
}

export function formatDate(iso?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDayMonth(iso?: string | null) {
  return formatDate(iso, { day: 'numeric', month: 'short' });
}

export function ageFromDob(iso?: string | null) {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export function relativeTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export function relationshipLabel(relation: FamilyRelationship) {
  return titleCase(relation);
}

export function roleLabel(user?: AuthUser | null) {
  return user?.role === 'doctor' ? 'Doctor' : 'Patient';
}
