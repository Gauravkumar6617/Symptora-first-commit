from sqlalchemy.orm import Session

from app.models.prescriptionModel import PrescriptionModel
from app.schemas.prescription import PrescriptionCreate


class PrescriptionRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(
        self, doctor_profile_id: str, patient_id: str, family_member_id: str | None, data: PrescriptionCreate
    ) -> PrescriptionModel:
        prescription = PrescriptionModel(
            appointment_id=data.appointment_id,
            consultation_id=data.consultation_id,
            doctor_profile_id=doctor_profile_id,
            patient_id=patient_id,
            family_member_id=family_member_id,
            medications=[m.model_dump() for m in data.medications],
            notes=data.notes,
        )
        self.db.add(prescription)
        self.db.commit()
        self.db.refresh(prescription)
        return prescription

    def get_by_id(self, prescription_id: str) -> PrescriptionModel | None:
        return self.db.query(PrescriptionModel).filter(PrescriptionModel.id == prescription_id).first()

    def list_for_patient(self, patient_id: str) -> list[PrescriptionModel]:
        return (
            self.db.query(PrescriptionModel)
            .filter(PrescriptionModel.patient_id == patient_id)
            .order_by(PrescriptionModel.created_at.desc())
            .all()
        )

    def list_for_doctor(self, doctor_profile_id: str) -> list[PrescriptionModel]:
        return (
            self.db.query(PrescriptionModel)
            .filter(PrescriptionModel.doctor_profile_id == doctor_profile_id)
            .order_by(PrescriptionModel.created_at.desc())
            .all()
        )

    def list_for_appointment(self, appointment_id: str) -> list[PrescriptionModel]:
        return (
            self.db.query(PrescriptionModel)
            .filter(PrescriptionModel.appointment_id == appointment_id)
            .order_by(PrescriptionModel.created_at.desc())
            .all()
        )

    def list_for_consultation(self, consultation_id: str) -> list[PrescriptionModel]:
        return (
            self.db.query(PrescriptionModel)
            .filter(PrescriptionModel.consultation_id == consultation_id)
            .order_by(PrescriptionModel.created_at.desc())
            .all()
        )

    def save(self, prescription: PrescriptionModel) -> PrescriptionModel:
        self.db.commit()
        self.db.refresh(prescription)
        return prescription
