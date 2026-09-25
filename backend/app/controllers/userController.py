from fastapi import HTTPException, status
from app.schemas.userSchema import RegistrationOTPVerify, UserCreate, UserLogin, UserUpdate
from app.services.userService import (
    InactiveUserError,
    InvalidCredentialsError,
    OTPDeliveryError,
    UserService,
)



class UserController:
    @staticmethod
    def request_registration_otp(
        user_data: UserCreate, service: UserService, avatar=None
    ):
        try:
            service.request_registration_otp(user_data, avatar=avatar)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except OTPDeliveryError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
            )
        except HTTPException:
            # Upload errors (size, type, bad image, storage) keep their status.
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {e}",
            )

    @staticmethod
    def verify_registration_otp(
        verification: RegistrationOTPVerify, service: UserService
    ):
        try:
            return service.verify_registration_otp(verification.email, verification.otp)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
            )

    @staticmethod
    def login_user(user_data:UserLogin ,service:UserService):
        try:
            return service.login_user(user_data)
        except InvalidCredentialsError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )
        except InactiveUserError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except HTTPException:
            # Preserve a meaningful error returned by an upstream service.
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=str(e)
            )


    @staticmethod
    def update_profile(user, updates: UserUpdate, service: UserService, avatar=None):
        try:
            return service.update_profile(user, updates, avatar=avatar)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            # Upload errors (size, type, bad image, storage) keep their status.
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not update profile: {e}",
            )

    @staticmethod
    def request_family_invite(data, service: UserService):
        from app.services.familyMemberService import InviteDeliveryError

        try:
            service.request_family_invite(data.email)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except InviteDeliveryError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        return {"detail": "If a family member was added with this email, a code is on its way."}

    @staticmethod
    def accept_family_invite(data, service: UserService):
        try:
            return service.accept_family_invite(data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def request_password_reset(email: str, service: UserService):
        try:
            service.request_password_reset(email)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
        except OTPDeliveryError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        return {"detail": "If an account exists for this email, a reset code is on its way."}

    @staticmethod
    def verify_password_reset(email: str, otp: str, service: UserService):
        try:
            return {"reset_token": service.verify_password_reset(email, otp)}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def reset_password(data, service: UserService):
        try:
            service.reset_password(data.email, data.reset_token, data.password)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        return {"detail": "Your password has been reset. You can log in now."}
