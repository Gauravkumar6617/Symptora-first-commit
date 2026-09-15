from uuid import UUID
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends ,HTTPException,status
from app.core.config import settings
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.userModel import UserModel
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
#take token fromt this url

def get_current_user(token : str = Depends(oauth2_scheme),db: Session = Depends(get_db),) -> UserModel: #takes token or db from session
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},       
    )

    payload=decode_token(token)#check is the token has valid access or not if not rasie execption
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    
    user_id=payload.get("sub")
    if user_id is None:#check the user if found ok if not rasie error
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.id == UUID(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception#find user id from db

    return user
