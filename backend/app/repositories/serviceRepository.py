from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.serviceModel import ServiceModel
from app.schemas.service import ServiceCreate


class ServiceRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: ServiceCreate) -> ServiceModel:
        service = ServiceModel(
            name=data.name,
            specialization=data.specialization,
            description=data.description,
            fee=data.fee,
            display_order=data.display_order,
        )
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        return service

    def get_by_id(self, service_id: str) -> ServiceModel | None:
        return self.db.query(ServiceModel).filter(ServiceModel.id == service_id).first()

    def get_by_name(self, name: str) -> ServiceModel | None:
        return (
            self.db.query(ServiceModel)
            .filter(func.lower(ServiceModel.name) == name.strip().lower())
            .first()
        )

    def list_all(self) -> list[ServiceModel]:
        return self.db.query(ServiceModel).order_by(ServiceModel.display_order, ServiceModel.name).all()

    def update(self, service: ServiceModel, changes: dict) -> ServiceModel:
        for field, value in changes.items():
            setattr(service, field, value)
        self.db.commit()
        self.db.refresh(service)
        return service

    def delete(self, service: ServiceModel) -> None:
        self.db.delete(service)
        self.db.commit()
