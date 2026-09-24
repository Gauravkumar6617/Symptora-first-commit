from fastapi import HTTPException, status

from app.models.userModel import UserModel
from app.schemas.family_member import FamilyMemberCreate, FamilyMemberUpdate
from app.services.familyMemberService import FamilyMemberNotFoundError, FamilyMemberService

NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found."
)


class FamilyMemberController:

    @staticmethod
    def list_members(owner: UserModel, service: FamilyMemberService):
        return service.list_members(owner)

    @staticmethod
    def add_member(owner: UserModel, data: FamilyMemberCreate, service: FamilyMemberService):
        try:
            return service.add_member(owner, data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def update_member(
        owner: UserModel, member_id: str, data: FamilyMemberUpdate, service: FamilyMemberService
    ):
        try:
            return service.update_member(owner, member_id, data)
        except FamilyMemberNotFoundError:
            raise NOT_FOUND
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def remove_member(owner: UserModel, member_id: str, service: FamilyMemberService):
        try:
            service.remove_member(owner, member_id)
        except FamilyMemberNotFoundError:
            raise NOT_FOUND
