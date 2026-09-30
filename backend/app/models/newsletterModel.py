import secrets
import uuid

from sqlalchemy import Boolean, Column, String
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


def gen_uuid():
    return str(uuid.uuid4())


class NewsletterSubscriberModel(BaseModel):
    """A newsletter signup from the website footer/home page."""

    __tablename__ = "newsletter_subscribers"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)
    email = Column(String(255), nullable=False, unique=True, index=True)  # stored lower-case
    # Secret for the one-click unsubscribe link put in every newsletter email.
    unsubscribe_token = Column(String(64), nullable=False, unique=True, default=lambda: secrets.token_urlsafe(32))
    active = Column(Boolean, nullable=False, default=True, server_default="true")
