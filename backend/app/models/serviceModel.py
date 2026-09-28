from sqlalchemy import String, Column, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class ServiceModel(BaseModel):
    """A bookable service (e.g. "Regular Health Checkup"), tagged to the
    doctor specialization it should be booked under."""

    __tablename__ = "services"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)

    name = Column(String(80), nullable=False, unique=True)
    specialization = Column(String(80), nullable=False)
    description = Column(String(255), nullable=True)
    fee = Column(Numeric(8, 2), nullable=True)
    # Lower sorts first among the service pills on the booking page.
    display_order = Column(Integer, nullable=False, default=0, server_default="0")
