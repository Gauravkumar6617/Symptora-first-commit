"""Password reset flow and blog helpers (fake Redis, no DB needed)."""

import sys
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app.services.userService as user_service_module
from app.core.security import verify_password
from app.schemas.blog import BlogPostRead
from app.services.blogService import slugify
from app.services.userService import UserService


class FakeRedis:
    def __init__(self):
        self.store = {}

    def setex(self, key, _ttl, value):
        self.store[key] = value

    def get(self, key):
        return self.store.get(key)

    def delete(self, *keys):
        for key in keys:
            self.store.pop(key, None)


class FakeRepo:
    def __init__(self, user):
        self.user = user
        self.db = SimpleNamespace(commit=lambda: None)

    def get_user_by_email(self, email):
        if self.user and self.user.email == email.strip().lower():
            return self.user
        return None


@pytest.fixture
def setup(monkeypatch):
    sent = []
    otps = {}
    monkeypatch.setattr(user_service_module, "send_password_reset_email", lambda to, otp: sent.append((to, otp)))
    monkeypatch.setattr(user_service_module, "generate_store_otp", lambda ident: (otps.setdefault(ident, "123456"), None))
    monkeypatch.setattr(
        user_service_module,
        "verify_otp",
        lambda ident, otp: (True, "ok") if otps.get(ident) == otp else (False, "Invalid OTP"),
    )
    user = SimpleNamespace(id="u-1", email="a@example.com", is_active=True, hashed_password="old")
    service = UserService(FakeRepo(user), FakeRedis(), medplum_integration=None)
    return service, user, sent


def test_reset_flow_changes_password(setup):
    service, user, sent = setup
    service.request_password_reset("A@example.com")
    assert sent == [("a@example.com", "123456")]

    token = service.verify_password_reset("a@example.com", "123456")
    service.reset_password("a@example.com", token, "new-password-1")
    assert verify_password("new-password-1", user.hashed_password)

    # The token is single-use.
    with pytest.raises(ValueError):
        service.reset_password("a@example.com", token, "another-pass-2")


def test_unknown_email_is_silent(setup):
    service, _, sent = setup
    service.request_password_reset("nobody@example.com")
    assert sent == []


def test_wrong_code_and_forged_token_are_rejected(setup):
    service, user, _ = setup
    service.request_password_reset("a@example.com")
    with pytest.raises(ValueError):
        service.verify_password_reset("a@example.com", "000000")
    with pytest.raises(ValueError):
        service.reset_password("a@example.com", "x" * 43, "new-password-1")
    assert user.hashed_password == "old"


def test_slugify():
    assert slugify("When Should You See a Doctor? (2026)") == "when-should-you-see-a-doctor-2026"
    assert slugify("???") == "post"


def test_blog_read_splits_paragraphs_and_estimates_read_time():
    post = BlogPostRead(
        id="p-1", created_at=datetime(2026, 1, 1), updated_at=datetime(2026, 1, 1),
        slug="s", title="Title", category="Wellness", excerpt="An excerpt here.",
        content="First paragraph.\r\n\r\nSecond " + "word " * 400, author="Admin",
    )
    assert post.paragraphs[0] == "First paragraph."
    assert len(post.paragraphs) == 2
    assert post.read_time == "3 min read"
