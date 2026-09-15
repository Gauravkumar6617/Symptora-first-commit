import { useQuery } from '@tanstack/react-query';

import {
  fetchBlogPosts,
  fetchCatalogDoctors,
  fetchClinics,
  fetchDoctorAppointments,
  fetchDoctors,
  fetchFamilyMembers,
  fetchPatientAppointments,
  fetchRiskChecks,
  fetchSpecialties,
} from '@/lib/api';

export function useFamilyMembers() {
  return useQuery({ queryKey: ['family-members'], queryFn: fetchFamilyMembers });
}

export function useDoctors() {
  return useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });
}

export function usePatientAppointments() {
  return useQuery({ queryKey: ['appointments', 'patient'], queryFn: fetchPatientAppointments });
}

export function useDoctorAppointments() {
  return useQuery({ queryKey: ['appointments', 'doctor'], queryFn: fetchDoctorAppointments });
}

export function useRiskChecks() {
  return useQuery({ queryKey: ['risk-checks'], queryFn: fetchRiskChecks });
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

export function useBlogPosts() {
  return useQuery({ queryKey: ['blog-posts'], queryFn: fetchBlogPosts });
}
