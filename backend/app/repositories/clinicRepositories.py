from app.models.clinicModel import CliniModel
from app.schemas.clinic import ClinicCreate
from sqlalchemy import func
from sqlalchemy.orm import Session
class ClinicRepository:

    def __init__(self,db:Session):
        self.db=db

    def createClinic(self,clinic_data:ClinicCreate) -> CliniModel:
            clinic=CliniModel(
                name=clinic_data.name,
                picture=clinic_data.picture,
                description=clinic_data.description,
                address=clinic_data.address,
                phone=clinic_data.phone,
                medplum_organisation_id=clinic_data.medplum_organisation_id,
            )

            self.db.add(clinic)
            self.db.commit()
            self.db.refresh(clinic)
            return clinic

    def get_by_id(self, clinic_id: str) -> CliniModel | None:
        return (
            self.db.query(CliniModel)
            .filter(CliniModel.id == clinic_id)
            .first()
        )

    def get_by_name(self, name: str) -> CliniModel | None:
        # Case-insensitive, so "City Care" and "city care" can't both exist.
        return (
            self.db.query(CliniModel)
            .filter(func.lower(CliniModel.name) == name.strip().lower())
            .first()
        )

    def list_all(self) -> list[CliniModel]:
        return self.db.query(CliniModel).order_by(CliniModel.name).all()

    def update(self, clinic: CliniModel, changes: dict) -> CliniModel:
        for field, value in changes.items():
            setattr(clinic, field, value)
        self.db.commit()
        self.db.refresh(clinic)
        return clinic

    def delete(self, clinic: CliniModel) -> None:
        self.db.delete(clinic)
        self.db.commit()
