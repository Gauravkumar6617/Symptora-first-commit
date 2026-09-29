from pydantic import BaseModel, Field

from app.schemas.common import ORMReadBase


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageRead(ORMReadBase):
    appointment_id: str | None = None
    consultation_id: str | None = None
    sender_id: str
    sender_name: str | None = None
    body: str
