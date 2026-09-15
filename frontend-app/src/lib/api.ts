import { blogPosts, catalogDoctors, clinics, specialties } from '@/data/catalog';
import {
  mockAppointments,
  mockDoctorAppointments,
  mockDoctors,
  mockFamilyMembers,
  mockRiskChecks,
} from '@/data/mockData';
import type { Appointment, Doctor, FamilyMember, RiskCheck } from '@/types';

// Thin "API" layer over mock data, shaped like real async calls so each
// function is a one-line swap to a fetch() against the FastAPI backend
// (see backend/app/schemas) once those routes exist.
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  await delay();
  return mockFamilyMembers;
}

export async function fetchDoctors(): Promise<Doctor[]> {
  await delay();
  return mockDoctors;
}

export async function fetchPatientAppointments(): Promise<Appointment[]> {
  await delay();
  return mockAppointments;
}

export async function fetchDoctorAppointments(): Promise<Appointment[]> {
  await delay();
  return mockDoctorAppointments;
}

export async function fetchRiskChecks(): Promise<RiskCheck[]> {
  await delay();
  return mockRiskChecks;
}

export async function fetchSpecialties() {
  await delay();
  return specialties;
}

export async function fetchClinics() {
  await delay();
  return clinics;
}

export async function fetchCatalogDoctors() {
  await delay();
  return catalogDoctors;
}

export async function fetchBlogPosts() {
  await delay();
  return blogPosts;
}
