import { useQuery } from '@tanstack/react-query'
import { type ClinicDoctor, listClinicDirectory } from '@/lib/api'

export type DirectoryDoctor = ClinicDoctor & { clinicName: string }

/** Clinics and their doctors, straight from the admin-managed DB. */
export function useDirectory() {
  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ['clinic-directory'],
    queryFn: listClinicDirectory,
  })
  const seen = new Set<string>()
  const doctors: DirectoryDoctor[] = []
  for (const clinic of clinics)
    for (const d of clinic.doctors)
      if (!seen.has(d.id)) {
        seen.add(d.id)
        doctors.push({ ...d, clinicName: clinic.name })
      }
  return { clinics, doctors, isLoading }
}
