from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_client
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.repositories.userRepositories import UserRepository
from app.schemas.userSchema import (
    OTPRequestResponse,
    RegistrationOTPVerify,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserLogin
)
from app.services.userService import UserService
from app.utils.integration.medplum.index import MedplumIntegration

# Import the controller
from app.controllers.userController import UserController

router = APIRouter(prefix="/users", tags=["Users"])


def get_medplum_integration() -> MedplumIntegration:
    return MedplumIntegration(
        base_url=settings.MEDPLUM_BASE_URL,
        client_id=settings.MEDPLUM_CLIENT_ID,
        client_secret=settings.MEDPLUM_CLIENT_SECRET,
        project_id=settings.MEDPLUM_PROJECT_ID,
    )


def get_user_service(
    db: Session = Depends(get_db),
    medplum: MedplumIntegration = Depends(get_medplum_integration),
) -> UserService:
    user_repo = UserRepository(db)
    return UserService(
        user_repository=user_repo,
        redis_user=redis_client,
        medplum_integration=medplum,
    )


@router.post(
    "/register/request-otp",
    response_model=OTPRequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def request_registration_otp(
    user_data: UserCreate = Depends(UserCreate.as_form),
    avatar: UploadFile = File(None),
    service: UserService = Depends(get_user_service),
):
    """Begin registration. Send as multipart/form-data with an optional avatar file."""
    UserController.request_registration_otp(
        user_data=user_data, service=service, avatar=avatar
    )
    return {"detail": "Verification code sent to your email address."}


@router.post(
    "/register/verify", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def verify_registration_otp(
    verification: RegistrationOTPVerify,
    service: UserService = Depends(get_user_service),
):
    return UserController.verify_registration_otp(verification=verification, service=service)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: UserModel = Depends(get_current_user)):
    """The caller's own account, identified by their bearer token."""
    return current_user


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(
    user_data: UserLogin,
    service: UserService = Depends(get_user_service),
):
    return UserController.login_user(user_data=user_data, service=service)


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: UserService = Depends(get_user_service),
):
    # Swagger's Authorize button sends form data (username/password),
    # so this maps it onto the normal JSON login. username = email.
    try:
        user_data = UserLogin(email=form_data.username, password=form_data.password)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserController.login_user(user_data=user_data, service=service)
