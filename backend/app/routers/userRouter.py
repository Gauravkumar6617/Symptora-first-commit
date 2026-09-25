from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_client
from app.deps.auth import get_current_user
from app.deps.medplum import get_medplum_integration
from app.models.userModel import UserModel
from app.repositories.userRepositories import UserRepository
from app.schemas.userSchema import (
    CurrentUserResponse,
    FamilyInviteAccept,
    FamilyInviteRequest,
    OTPRequestResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordResetVerifyResponse,
    RegistrationOTPVerify,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserLogin,
    UserUpdate,
)
from app.services.userService import UserService
from app.utils.integration.medplum.index import MedplumIntegration

# Import the controller
from app.controllers.userController import UserController

router = APIRouter(prefix="/users", tags=["Users"])


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


@router.post("/family-invite/request", response_model=OTPRequestResponse)
def request_family_invite(
    data: FamilyInviteRequest,
    service: UserService = Depends(get_user_service),
):
    """Family member asks for a (new) code to activate the profile someone added them with."""
    return UserController.request_family_invite(data, service)


@router.post("/family-invite/accept", response_model=TokenResponse)
def accept_family_invite(
    data: FamilyInviteAccept,
    service: UserService = Depends(get_user_service),
):
    """Code + new password -> the member's own account, logged in."""
    return UserController.accept_family_invite(data, service)


@router.post("/password/forgot", response_model=OTPRequestResponse, status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(
    data: PasswordResetRequest,
    service: UserService = Depends(get_user_service),
):
    """Email a 6-digit reset code. Same answer whether or not the email is registered."""
    return UserController.request_password_reset(data.email, service)


@router.post("/password/verify", response_model=PasswordResetVerifyResponse)
def verify_password_reset(
    data: PasswordResetVerify,
    service: UserService = Depends(get_user_service),
):
    """Check the emailed code; returns a short-lived token for /password/reset."""
    return UserController.verify_password_reset(data.email, data.otp, service)


@router.post("/password/reset", response_model=OTPRequestResponse)
def reset_password(
    data: PasswordResetConfirm,
    service: UserService = Depends(get_user_service),
):
    return UserController.reset_password(data, service)


@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_profile(current_user: UserModel = Depends(get_current_user)):
    """The caller's own account, identified by their bearer token.

    This is the source of truth for role: web and app both re-read it on
    launch, so an admin approving a doctor shows up everywhere.
    """
    return UserService.to_current_user(current_user)


@router.patch("/me", response_model=CurrentUserResponse)
def update_current_user_profile(
    updates: UserUpdate = Depends(UserUpdate.as_form),
    avatar: UploadFile = File(None),
    current_user: UserModel = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Edit your own profile. Send as multipart/form-data with an optional avatar file."""
    return UserController.update_profile(current_user, updates, service, avatar=avatar)


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
            detail="Incorrect email/phone or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserController.login_user(user_data=user_data, service=service)
