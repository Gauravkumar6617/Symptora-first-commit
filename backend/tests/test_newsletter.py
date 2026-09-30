"""Newsletter signup: stored once per email, re-subscribe works, unsubscribe by token."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.models import *  # noqa: F401,F403 — register every table
from app.models.newsletterModel import NewsletterSubscriberModel
from main import app


def test_subscribe_and_unsubscribe():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    def test_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = test_db
    try:
        client = TestClient(app)
        for email in ["Reader@Example.com", "reader@example.com"]:  # twice, different case
            assert client.post("/api/v1/newsletter/subscribe", json={"email": email}).status_code == 200
        assert client.post("/api/v1/newsletter/subscribe", json={"email": "not-an-email"}).status_code == 422

        db = Session()
        [sub] = db.query(NewsletterSubscriberModel).all()
        assert sub.email == "reader@example.com" and sub.active

        assert client.post("/api/v1/newsletter/unsubscribe", json={"token": sub.unsubscribe_token}).status_code == 200
        db.refresh(sub)
        assert not sub.active

        client.post("/api/v1/newsletter/subscribe", json={"email": "reader@example.com"})  # comes back
        db.refresh(sub)
        assert sub.active
    finally:
        app.dependency_overrides.clear()
