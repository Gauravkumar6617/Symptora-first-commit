from sqlalchemy.orm import Session
from app.models.doctorClinicModel import DoctorClinicModel


class DoctorClinicRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        doctor_profile_id: str,
        clinic_id: str,
        medplum_practitioner_role_id: str,
    ) -> DoctorClinicModel:
        doctor_clinic = DoctorClinicModel(
            doctor_profile_id=doctor_profile_id,
            clinic_id=clinic_id,
            medplum_practitioner_role_id=medplum_practitioner_role_id,
        )
        self.db.add(doctor_clinic)
        self.db.commit()
        self.db.refresh(doctor_clinic)
        return doctor_clinic

    def get_by_doctor_and_clinic(
        self, doctor_profile_id: str, clinic_id: str
    ) -> DoctorClinicModel | None:
        return (
            self.db.query(DoctorClinicModel)
            .filter(
                DoctorClinicModel.doctor_profile_id == doctor_profile_id,
                DoctorClinicModel.clinic_id == clinic_id,
            )
            .first()
        )

    def list_clinics_for_doctor(self, doctor_profile_id: str) -> list[DoctorClinicModel]:
        return (
            self.db.query(DoctorClinicModel)
            .filter(DoctorClinicModel.doctor_profile_id == doctor_profile_id)
            .all()
        )

    def list_doctors_for_clinic(self, clinic_id: str) -> list[DoctorClinicModel]:
        return (
            self.db.query(DoctorClinicModel)
            .filter(DoctorClinicModel.clinic_id == clinic_id)
            .all()
        )
