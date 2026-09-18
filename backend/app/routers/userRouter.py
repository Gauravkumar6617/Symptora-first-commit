from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_client
from app.repositories.userRepositories import UserRepository
from app.schemas.userSchema import (
    OTPRequestResponse,
    RegistrationOTPVerify,
    UserCreate,
    UserResponse,
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
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    UserController.request_registration_otp(user_data=user_data, service=service)
    return {"detail": "Verification code sent to your email address."}


@router.post(
    "/register/verify", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def verify_registration_otp(
    verification: RegistrationOTPVerify,
    service: UserService = Depends(get_user_service),
):
    return UserController.verify_registration_otp(verification=verification, service=service)


@router.post("/", response_model=OTPRequestResponse, status_code=status.HTTP_202_ACCEPTED)
def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    """Begin registration. The user is created only by /register/verify."""
    UserController.request_registration_otp(user_data=user_data, service=service)
    return {"detail": "Verification code sent to your email address."}
