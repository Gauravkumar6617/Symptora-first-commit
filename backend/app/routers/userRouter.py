from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_client
from app.repositories.userRepositories import UserRepository
from app.schemas.userSchema import UserCreate, UserResponse
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


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    # The router delegates the actual work to the controller
    return UserController.create_user(user_data=user_data, service=service)