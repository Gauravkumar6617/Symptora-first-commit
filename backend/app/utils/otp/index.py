"""Short-lived, Redis-backed OTPs used by account registration."""

import pyotp

from app.core.config import settings
from app.core.redis import redis_client


def _normalise_identifier(identifier: str) -> str:
    return identifier.strip().lower()


def _secret_key(identifier: str) -> str:
    return f"otp:secret:{_normalise_identifier(identifier)}"


def _cooldown_key(identifier: str) -> str:
    return f"otp:cooldown:{_normalise_identifier(identifier)}"


def _attempts_key(identifier: str) -> str:
    return f"otp:attempts:{_normalise_identifier(identifier)}"


def generate_store_otp(identifier: str) -> tuple[str | None, str | None]:
    """Create an OTP unless the recipient is still in the resend cooldown."""
    if redis_client.exists(_cooldown_key(identifier)):
        return None, "Please wait before requesting another OTP."

    secret = pyotp.random_base32()
    otp = pyotp.TOTP(secret, interval=settings.OTP_EXPIRY_SECONDS).now()
    redis_client.setex(_secret_key(identifier), settings.OTP_EXPIRY_SECONDS, secret)
    redis_client.setex(_cooldown_key(identifier), settings.OTP_COOLDOWN_SECONDS, "1")
    redis_client.delete(_attempts_key(identifier))
    return otp, None


def verify_otp(identifier: str, otp: str) -> tuple[bool, str]:
    """Verify a code and consume it on success or after too many attempts."""
    secret = redis_client.get(_secret_key(identifier))
    if not secret:
        return False, "OTP expired or was not requested."

    attempts_key = _attempts_key(identifier)
    attempts = int(redis_client.get(attempts_key) or 0)
    if attempts >= settings.OTP_MAX_ATTEMPTS:
        redis_client.delete(_secret_key(identifier))
        redis_client.delete(attempts_key)
        return False, "Too many failed attempts. Please request a new OTP."

    is_valid = pyotp.TOTP(secret, interval=settings.OTP_EXPIRY_SECONDS).verify(
        otp.strip(), valid_window=0
    )
    if is_valid:
        redis_client.delete(_secret_key(identifier))
        redis_client.delete(attempts_key)
        return True, "OTP verified successfully."

    redis_client.incr(attempts_key)
    redis_client.expire(attempts_key, settings.OTP_EXPIRY_SECONDS)
    return False, "Invalid OTP."


def discard_otp(identifier: str) -> None:
    """Remove an undelivered or abandoned OTP and its retry state."""
    redis_client.delete(
        _secret_key(identifier), _cooldown_key(identifier), _attempts_key(identifier)
    )
