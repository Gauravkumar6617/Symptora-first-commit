from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMReadBase


class ServiceBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    # Must match a doctor's `specialization` for the booking filter to work.
    specialization: str = Field(min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=255)
    fee: Optional[float] = Field(default=None, ge=0)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    specialization: Optional[str] = Field(default=None, min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=255)
    fee: Optional[float] = Field(default=None, ge=0)


class ServiceRead(ServiceBase, ORMReadBase):
    pass
