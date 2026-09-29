import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptConsultation,
  bookAppointment,
  cancelAppointmentApi,
  cancelConsultationApi,
  fetchBlogPost,
  fetchBlogPosts,
  fetchCatalogDoctors,
  fetchChecks,
  fetchClinicDoctors,
  fetchClinics,
  fetchDoctorAppointments,
  fetchDoctorAvailability,
  fetchHandledConsultations,
  fetchIssuedPrescriptions,
  fetchMessages,
  fetchMyConsultations,
  fetchMyPrescriptions,
  fetchNotifications,
  fetchPatientAppointments,
  fetchPendingConsultations,
  fetchSpecialties,
  fetchSymptoms,
  issuePrescription,
  parseSymptoms,
  predictDisease,
  sendMessage,
  startConsultation,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type {
  AppointmentCreatePayload,
  PatientDetails,
  PrescriptionCreatePayload,
  TelemedicineStartPayload,
} from '@/types';

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

// ------------------------------------------------------------ appointments

/** Doctors bookable right now, flattened across every partner clinic. */
export function useClinicDoctors() {
  return useQuery({ queryKey: ['clinic-doctors'], queryFn: fetchClinicDoctors });
}

export function useDoctorAvailability(doctorId: string | null) {
  return useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: () => fetchDoctorAvailability(doctorId!),
    enabled: Boolean(doctorId),
  });
}

export function useBookAppointment() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentCreatePayload) => bookAppointment(accessToken!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useCancelAppointment() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointmentApi(accessToken!, appointmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// ------------------------------------------------------------ telemedicine

export function useMyConsultations() {
  return useQuery({ queryKey: ['consultations', 'mine'], queryFn: fetchMyConsultations });
}

export function useHandledConsultations() {
  return useQuery({ queryKey: ['consultations', 'handled'], queryFn: fetchHandledConsultations });
}

/** Initial page load for the doctor's live queue — the queue itself then
 * updates over the /ws/telemedicine/doctor socket. */
export function usePendingConsultations(enabled: boolean) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['consultations', 'pending'],
    queryFn: () => fetchPendingConsultations(accessToken!),
    enabled: enabled && Boolean(accessToken),
  });
}

export function useStartConsultation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: (payload: TelemedicineStartPayload) => startConsultation(accessToken!, payload),
  });
}

export function useAcceptConsultation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consultationId: string) => acceptConsultation(accessToken!, consultationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultations'] }),
  });
}

export function useCancelConsultation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consultationId: string) => cancelConsultationApi(accessToken!, consultationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultations'] }),
  });
}

// ----------------------------------------------------------------- messages

export function useMessages(kind: 'appointment' | 'telemedicine', id: string | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['messages', kind, id],
    queryFn: () => fetchMessages(accessToken!, kind, id!),
    enabled: Boolean(accessToken && id),
    refetchInterval: 4000,
  });
}

export function useSendMessage(kind: 'appointment' | 'telemedicine', id: string | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(accessToken!, kind, id!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', kind, id] }),
  });
}

// ------------------------------------------------------------ prescriptions

export function useMyPrescriptions() {
  return useQuery({ queryKey: ['prescriptions', 'mine'], queryFn: fetchMyPrescriptions });
}

export function useIssuedPrescriptions() {
  return useQuery({ queryKey: ['prescriptions', 'issued'], queryFn: fetchIssuedPrescriptions });
}

export function useIssuePrescription() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PrescriptionCreatePayload) => issuePrescription(accessToken!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
}
