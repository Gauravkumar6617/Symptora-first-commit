from fastapi import HTTPException, status
from app.schemas.userSchema import RegistrationOTPVerify, UserCreate
from app.services.userService import UserService


class UserController:
    @staticmethod
    def request_registration_otp(user_data: UserCreate, service: UserService):
        try:
            service.request_registration_otp(user_data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to send verification email. Please try again later.",
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
    def create_user(user_data: UserCreate, service: UserService):
        try:
            return service.create_user(user_data)
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
