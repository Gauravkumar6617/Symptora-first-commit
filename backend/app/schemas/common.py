from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMReadBase(BaseModel):
    """Common fields/config for every *Read schema, mirroring app.models.base.BaseModel."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
