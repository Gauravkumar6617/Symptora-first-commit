import { useMutation, useQuery } from '@tanstack/react-query';

import {
  fetchBlogPosts,
  fetchCatalogDoctors,
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

// Family members and Health Check history come from
// useFamilyStore/useHealthCheckStore, not a query hook here.

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
  return useMutation({
    mutationFn: ({ symptoms, patient }: { symptoms: string[]; patient?: PatientDetails }) =>
      predictDisease(accessToken, symptoms, patient),
  });
}
