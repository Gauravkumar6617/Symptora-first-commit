import logging

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.enumModel import Status
from app.models.prescriptionModel import PrescriptionModel
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.prescriptionRepository import PrescriptionRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.schemas.prescription import PrescriptionCreate
from app.services.familyMemberService import FamilyMemberService
from app.services.notificationService import notify
from app.utils.pdf import text_pdf
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)


class PrescriptionService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = PrescriptionRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.consultation_repo = TelemedicineRepository(db)
        self.doctor_repo = DoctorRepository(db)

    def issue(self, doctor_user, data: PrescriptionCreate) -> PrescriptionModel:
        if bool(data.appointment_id) == bool(data.consultation_id):
            raise ValueError("Give exactly one of appointment_id or consultation_id")

        doctor = self.doctor_repo.get_by_user_id(doctor_user.id)
        if not doctor or doctor.status != Status.APPROVED:
            raise PermissionError("Only an approved doctor can issue a prescription")

        if data.appointment_id:
            visit = self.appointment_repo.get_by_id(data.appointment_id)
        else:
            visit = self.consultation_repo.get_by_id(data.consultation_id)
        if not visit:
            raise ValueError("Appointment or consultation not found")
        if visit.doctor_profile_id != doctor.id:
            raise PermissionError("Only the treating doctor may prescribe for this visit")

        prescription = self.repo.create(doctor.id, visit.patient_id, visit.family_member_id, data)
        self._label(prescription)
        notify(self.db, visit.patient_id, f"{prescription.doctor_name} sent you a prescription",
               f"{len(prescription.medications)} medication(s). Download it from your dashboard.",
               "/dashboard#prescriptions")
        return prescription

    def get_for_user(self, prescription_id: str, current_user) -> PrescriptionModel:
        prescription = self.repo.get_by_id(prescription_id)
        if not prescription:
            raise ValueError("Prescription not found")
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        is_owner = prescription.patient_id == current_user.id
        is_prescriber = doctor is not None and doctor.id == prescription.doctor_profile_id
        if not (is_owner or is_prescriber or current_user.is_admin):
            raise PermissionError("Not allowed to view this prescription")
        return self._label(prescription)

    def list_for_patient(self, patient_id: str) -> list[PrescriptionModel]:
        return [self._label(p) for p in self.repo.list_for_patient(patient_id)]

    def list_for_current_doctor(self, current_user) -> list[PrescriptionModel]:
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        if not doctor:
            raise PermissionError("No doctor application found for this account")
        return [self._label(p) for p in self.repo.list_for_doctor(doctor.id)]

    def list_for_appointment(self, appointment_id: str, current_user) -> list[PrescriptionModel]:
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
        self._require_visit_access(current_user, appointment)
        return [self._label(p) for p in self.repo.list_for_appointment(appointment_id)]

    def list_for_consultation(self, consultation_id: str, current_user) -> list[PrescriptionModel]:
        consultation = self.consultation_repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        self._require_visit_access(current_user, consultation)
        return [self._label(p) for p in self.repo.list_for_consultation(consultation_id)]

    def _require_visit_access(self, current_user, visit) -> None:
        if visit.patient_id == current_user.id:
            return
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        if doctor and doctor.id == visit.doctor_profile_id:
            return
        raise PermissionError("Not allowed to view these prescriptions")

    def _label(self, prescription: PrescriptionModel) -> PrescriptionModel:
        doctor = prescription.doctor_profile
        prescription.doctor_name = self._doctor_display_name(doctor) if doctor else None
        prescription.doctor_specialization = doctor.specialization if doctor else None
        if prescription.family_member and prescription.family_member.full_name:
            prescription.patient_name = prescription.family_member.full_name
        elif prescription.patient:
            prescription.patient_name = f"{prescription.patient.first_name} {prescription.patient.last_name}".strip()
        else:
            prescription.patient_name = None
        prescription.synced_to_medplum = prescription.medplum_medication_request_id is not None
        return prescription

    @staticmethod
    def _doctor_display_name(doctor) -> str | None:
        if not doctor or not doctor.user:
            return None
        return f"Dr. {doctor.user.first_name} {doctor.user.last_name}"


def prescription_pdf(p: PrescriptionModel) -> bytes:
    lines = [
        ("Symptora e-Prescription", 20), ("", 0),
        (f"Doctor: {p.doctor_name or '-'}" + (f"  ({p.doctor_specialization})" if p.doctor_specialization else ""), 11),
        (f"Patient: {p.patient_name or '-'}", 11),
        (f"Date: {p.created_at:%d %b %Y}", 11),
        (f"Prescription ID: {p.id}", 9), ("", 0),
        ("Medications", 14),
    ]
    for i, med in enumerate(p.medications, 1):
        lines.append((f"{i}. {med['name']} - {med['dosage']}, {med['frequency']}, for {med['duration']}", 11))
        if med.get("instructions"):
            lines.append((f"     {med['instructions']}", 10))
    if p.notes:
        lines += [("", 0), ("Notes", 14), (p.notes, 11)]
    lines += [("", 0), ("Issued digitally via Symptora. Valid without signature.", 8)]
    return text_pdf(lines)


def medication_requests(prescription: PrescriptionModel, patient_id: str, practitioner_id: str) -> list[dict]:
    """The prescription as one FHIR MedicationRequest per medication line."""
    requests = []
    for med in prescription.medications:
        note = med.get("instructions")
        requests.append({
            "resourceType": "MedicationRequest",
            "status": "active",
            "intent": "order",
            "medicationCodeableConcept": {"text": med["name"]},
            "subject": {"reference": f"Patient/{patient_id}"},
            "requester": {"reference": f"Practitioner/{practitioner_id}"},
            "dosageInstruction": [{
                "text": f"{med['dosage']} · {med['frequency']} · {med['duration']}",
            }],
            **({"note": [{"text": note}]} if note else {}),
        })
    return requests


def sync_prescription_to_medplum(prescription_id: str, medplum: MedplumIntegration) -> None:
    """Background task: record each medication as a FHIR MedicationRequest.

    Best effort — Medplum being down never blocks or unwinds the
    prescription itself, same as every other Medplum sync in this app."""
    db = SessionLocal()
    try:
        prescription = db.get(PrescriptionModel, prescription_id)
        if prescription is None or prescription.doctor_profile is None:
            return
        practitioner_id = prescription.doctor_profile.medplum_practitioner_id
        if not practitioner_id:
            logger.warning("Prescription %s not sent to Medplum: doctor has no Medplum id", prescription_id)
            return

        if prescription.family_member is not None:
            patient_id = FamilyMemberService(db, medplum).ensure_medplum_patient(
                prescription.family_member, prescription.patient
            )
        else:
            patient_id = prescription.patient.medplum_patient_id
        if not patient_id:
            logger.warning("Prescription %s not sent to Medplum: patient has no Medplum id", prescription_id)
            return

        created_ids = []
        for resource in medication_requests(prescription, patient_id, practitioner_id):
            created = medplum.create_resource(resource)
            created_ids.append(created.get("id"))
        prescription.medplum_medication_request_id = ",".join(filter(None, created_ids)) or None
        db.commit()
    except Exception:
        logger.exception("Prescription %s not sent to Medplum", prescription_id)
    finally:
        db.close()
