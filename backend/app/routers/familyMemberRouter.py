from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.controllers.familyMemberController import FamilyMemberController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.deps.medplum import get_medplum_integration
from app.models.userModel import UserModel
from app.schemas.family_member import (
    FamilyInviteResponse,
    FamilyMemberCreate,
    FamilyMemberRead,
    FamilyMemberUpdate,
)
from app.services.familyMemberService import FamilyMemberService
from app.utils.integration.medplum.index import MedplumIntegration

router = APIRouter(prefix="/family-members", tags=["Family members"])


def get_family_service(
    db: Session = Depends(get_db),
    medplum: MedplumIntegration = Depends(get_medplum_integration),
) -> FamilyMemberService:
    return FamilyMemberService(db, medplum)


@router.get("", response_model=List[FamilyMemberRead])
def list_family_members(
    current_user: UserModel = Depends(get_current_user),
    service: FamilyMemberService = Depends(get_family_service),
):
    """Family profiles linked to the caller's account, oldest first."""
    return FamilyMemberController.list_members(current_user, service)


@router.post("", response_model=FamilyMemberRead, status_code=status.HTTP_201_CREATED)
def add_family_member(
    data: FamilyMemberCreate,
    current_user: UserModel = Depends(get_current_user),
    service: FamilyMemberService = Depends(get_family_service),
):
    return FamilyMemberController.add_member(current_user, data, service)


@router.patch("/{member_id}", response_model=FamilyMemberRead)
def update_family_member(
    member_id: str,
    data: FamilyMemberUpdate,
    current_user: UserModel = Depends(get_current_user),
    service: FamilyMemberService = Depends(get_family_service),
):
    return FamilyMemberController.update_member(current_user, member_id, data, service)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_family_member(
    member_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: FamilyMemberService = Depends(get_family_service),
):
    FamilyMemberController.remove_member(current_user, member_id, service)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{member_id}/invite", response_model=FamilyInviteResponse)
def invite_family_member(
    member_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: FamilyMemberService = Depends(get_family_service),
):
    """Email the member a code so they can activate their own login."""
    return FamilyMemberController.invite_member(current_user, member_id, service)
