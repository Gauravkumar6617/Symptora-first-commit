from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel


def gen_uuid():
    return str(uuid.uuid4())


class NotificationModel(BaseModel):
    """An in-app notification (bell icon): someone joined your call, sent a
    message, issued a prescription, your payment went through, ..."""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(String(500), nullable=False, default="")
    link = Column(String(255), nullable=True)  # web path to open, e.g. /call/telemedicine/<id>
    read = Column(Boolean, nullable=False, default=False, server_default="false")
