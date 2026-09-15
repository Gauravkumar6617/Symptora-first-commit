from datetime import datetime, timedelta, timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hashed_pasword(password:str) ->str:
    return pwd_context.hash(password)

def verify_password(plain_password : str , hashed_password : str ) ->bool:
    return pwd_context.verify(plain_password,hashed_password)




#It creates a secure temporary ID card for the logged-in user. The ID card contains the user information, an expiry time, and a signature so the server can verify that it is genuine.
def create_access_token(data:dict)->str:
    expire=datetime.utcnow(timezone.utc)+timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None