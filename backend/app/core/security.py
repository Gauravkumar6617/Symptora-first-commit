from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt,JWTError
from app.core.config import settings


def _password_bytes(password: str) -> bytes:
    """Encode a password for bcrypt, enforcing bcrypt's 72-byte limit."""
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        raise ValueError("Password must be at most 72 bytes long.")
    return encoded_password


def hashed_pasword(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            _password_bytes(plain_password), hashed_password.encode("utf-8")
        )
    except ValueError:
        return False




#It creates a secure temporary ID card for the logged-in user. The ID card contains the user information, an expiry time, and a signature so the server can verify that it is genuine.
def create_access_token(data:dict)->str:
    expire=datetime.now(timezone.utc)+timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
