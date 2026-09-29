from sqlalchemy.orm import Session

from app.models.enumModel import ConsultationStatus
from app.models.telemedicineModel import TelemedicineConsultationModel
from app.schemas.telemedicine import TelemedicineStart


class TelemedicineRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, patient_id: str, data: TelemedicineStart) -> TelemedicineConsultationModel:
        consultation = TelemedicineConsultationModel(
            patient_id=patient_id,
            family_member_id=data.family_member_id,
            reason=data.reason,
        )
        self.db.add(consultation)
        self.db.commit()
        self.db.refresh(consultation)
        return consultation

    def get_by_id(self, consultation_id: str) -> TelemedicineConsultationModel | None:
        return (
            self.db.query(TelemedicineConsultationModel)
            .filter(TelemedicineConsultationModel.id == consultation_id)
            .first()
        )

    def list_pending(self) -> list[TelemedicineConsultationModel]:
        return (
            self.db.query(TelemedicineConsultationModel)
            .filter(TelemedicineConsultationModel.status == ConsultationStatus.PENDING)
            .order_by(TelemedicineConsultationModel.created_at.asc())
            .all()
        )

    def list_for_patient(self, patient_id: str) -> list[TelemedicineConsultationModel]:
        return (
            self.db.query(TelemedicineConsultationModel)
            .filter(TelemedicineConsultationModel.patient_id == patient_id)
            .order_by(TelemedicineConsultationModel.created_at.desc())
            .all()
        )

    def list_for_doctor(self, doctor_profile_id: str) -> list[TelemedicineConsultationModel]:
        return (
            self.db.query(TelemedicineConsultationModel)
            .filter(TelemedicineConsultationModel.doctor_profile_id == doctor_profile_id)
            .order_by(TelemedicineConsultationModel.created_at.desc())
            .all()
        )

    def claim(self, consultation_id: str, doctor_profile_id: str) -> bool:
        """Atomically assign a doctor — only if still pending, so two doctors
        accepting at once can't both win. True if this call won the claim."""
        rows = (
            self.db.query(TelemedicineConsultationModel)
            .filter(
                TelemedicineConsultationModel.id == consultation_id,
                TelemedicineConsultationModel.status == ConsultationStatus.PENDING,
            )
            .update(
                {"doctor_profile_id": doctor_profile_id, "status": ConsultationStatus.IN_PROGRESS},
                synchronize_session=False,
            )
        )
        self.db.commit()
        return rows == 1

    def save(self, consultation: TelemedicineConsultationModel) -> TelemedicineConsultationModel:
        self.db.commit()
        self.db.refresh(consultation)
        return consultation
