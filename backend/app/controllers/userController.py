from fastapi import HTTPException, status
from app.schemas.userSchema import UserCreate
from app.services.userService import UserService


class UserController:
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
