from typing import Optional

from app.schemas.common import ORMReadBase


class NotificationRead(ORMReadBase):
    title: str
    body: str
    link: Optional[str] = None
    read: bool
