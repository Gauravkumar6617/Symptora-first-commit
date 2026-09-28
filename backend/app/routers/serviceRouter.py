from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.serviceRepository import ServiceRepository
from app.schemas.service import ServiceRead

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("", response_model=List[ServiceRead])
def list_services(db: Session = Depends(get_db)):
    """Public list of bookable services, for the appointment booking page."""
    return ServiceRepository(db).list_all()
