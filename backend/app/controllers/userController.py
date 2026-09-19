from fastapi import HTTPException, status
from app.schemas.userSchema import RegistrationOTPVerify, UserCreate ,UserLogin
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
