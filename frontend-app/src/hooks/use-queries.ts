import { useQuery } from '@tanstack/react-query';

import {
  fetchBlogPosts,
  fetchCatalogDoctors,
  fetchClinics,
  fetchDoctorAppointments,
  fetchNotifications,
  fetchPatientAppointments,
  fetchSpecialties,
} from '@/lib/api';

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
