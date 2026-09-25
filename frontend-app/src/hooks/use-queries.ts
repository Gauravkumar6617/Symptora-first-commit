import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchBlogPost,
  fetchBlogPosts,
  fetchCatalogDoctors,
  fetchChecks,
  fetchClinics,
  fetchDoctorAppointments,
  fetchNotifications,
  fetchPatientAppointments,
  fetchSpecialties,
  fetchSymptoms,
  parseSymptoms,
  predictDisease,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { PatientDetails } from '@/types';

// Family members come from useFamilyStore. Symptom-checker history is on the
// server (useChecks); questionnaire Health Checks stay in useHealthCheckStore.

export function usePatientAppointments() {
  return useQuery({ queryKey: ['appointments', 'patient'], queryFn: fetchPatientAppointments });
}

export function useDoctorAppointments() {
  return useQuery({ queryKey: ['appointments', 'doctor'], queryFn: fetchDoctorAppointments });
}

export function useSpecialties() {
  return useQuery({ queryKey: ['specialties'], queryFn: fetchSpecialties });
}

export function useClinics() {
  return useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
}

export function useCatalogDoctors() {
  return useQuery({ queryKey: ['catalog-doctors'], queryFn: fetchCatalogDoctors });
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });
}

export function useBlogPosts() {
  return useQuery({ queryKey: ['blog-posts'], queryFn: fetchBlogPosts });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-posts', slug],
    queryFn: () => fetchBlogPost(slug!),
    enabled: Boolean(slug),
  });
}

/** The symptom list rarely changes, so it's cached for the whole session. */
export function useSymptoms() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['symptoms'],
    queryFn: () => fetchSymptoms(accessToken),
    staleTime: Infinity,
  });
}

/** `mutate('vomiting for two days')` → `data` is the ParsedSymptoms. */
export function useParseSymptoms() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({ mutationFn: (text: string) => parseSymptoms(accessToken, text) });
}

/** `mutate({ symptoms: ['fatigue'], patient })` → `data` is the PredictionResult. */
export function usePredictDisease() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      symptoms,
      patient,
      familyMemberId,
    }: {
      symptoms: string[];
      patient?: PatientDetails;
      familyMemberId?: string;
    }) => predictDisease(accessToken, symptoms, patient, familyMemberId),
    // The new result was saved server-side; refresh every history list.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checks'] }),
  });
}

/** Saved symptom checks (shared with family); `memberId` narrows to one member. */
export function useChecks(memberId?: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['checks', accessToken, memberId ?? 'all'],
    queryFn: () => fetchChecks(accessToken, memberId),
    enabled: !!accessToken,
  });
}
