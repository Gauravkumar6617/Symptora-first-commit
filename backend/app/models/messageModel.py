from sqlalchemy import Text, Column, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel


def gen_uuid():
    return str(uuid.uuid4())


class MessageModel(BaseModel):
    """One chat message on an appointment's or instant consultation's thread
    — exactly one of appointment_id/consultation_id is set."""

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)

    appointment_id = Column(UUID(as_uuid=False), ForeignKey("appointments.id"), nullable=True, index=True)
    consultation_id = Column(
        UUID(as_uuid=False), ForeignKey("telemedicine_consultations.id"), nullable=True, index=True
    )
    sender_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)

    sender = relationship("UserModel", foreign_keys=[sender_id])
