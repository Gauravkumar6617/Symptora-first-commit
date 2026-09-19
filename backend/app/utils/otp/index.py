from app.core.redis import redis_client
import redis
from app.core.config import settings
import pyotp

def _secret_key(indentifier:str):
    return f"OTP : {indentifier}"

def _cooldown_key(identifier:str):
    return f"OTP Cooldown: {identifier}"

def _secret_atttempt(identifier:str):
    return f"OTP Attempt : {identifier}"

def _set_cooldown(identifier:str):
    redis_client.setex(_cooldown_key(identifier),settings.OTP_COOLDOWN_TIME,"1")

def generate_store_otp(identifier:str):
    secret = pyotp.random_base32()
    totp = pyotp.totp(secret,interval=settings.OTP_EXPIRY_SECOND)
    otp = totp.now()

     # Store secret with expiry — once this expires, OTP is dead regardless of verify logic
    redis_client.setex(_secret_key(identifier), settings.OTP_EXPIRY_SECONDS, secret)
    redis_client.delete(_secret_atttempt(identifier)) 

    return otp

def verify_otp(identifier: str, otp: str) -> tuple[bool, str]:
    secret = redis_client.get(_secret_key(identifier))
    if not secret:
        return False, "OTP expired or not requested"

    attempts_key = _secret_atttempt(identifier)
    attempts = int(redis_client.get(attempts_key) or 0)

    if attempts >= settings.OTP_MAX_ATTEMPTS:
        redis_client.delete(_secret_key(identifier))
        return False, "Too many failed attempts. Please request a new OTP"

    totp = pyotp.TOTP(secret, interval=settings.OTP_EXPIRY_SECONDS)
    if totp.verify(otp, valid_window=1):
        redis_client.delete(_secret_key(identifier))
        redis_client.delete(attempts_key)
        return True, "OTP verified successfully"

    redis_client.incr(attempts_key)
    redis_client.expire(attempts_key, settings.OTP_EXPIRY_SECONDS)
    return False, "Invalid OTP"

def discard_otp(identifier: str) -> None:
    redis_client.delete(
        _secret_key(identifier),
        _cooldown_key(identifier),
        _secret_atttempt(identifier),
    )