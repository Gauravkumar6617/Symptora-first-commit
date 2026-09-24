from uuid import UUID

from sqlalchemy.orm import Session

from app.models.familyMemeberModel import FamilyMemberModel
from app.models.userModel import UserModel
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.schemas.family_member import FamilyMemberCreate, FamilyMemberUpdate


class FamilyMemberNotFoundError(Exception):
    pass


class FamilyMemberService:

    def __init__(self, db: Session):
        self.repo = FamilyMemberRepository(db)

    def list_members(self, owner: UserModel) -> list[FamilyMemberModel]:
        return self.repo.list_for_owner(owner.id)

    def add_member(self, owner: UserModel, data: FamilyMemberCreate) -> FamilyMemberModel:
        if data.email and self.repo.email_taken(data.email):
            raise ValueError("A family member with this email already exists.")
        return self.repo.create(owner.id, data)

    def update_member(
        self, owner: UserModel, member_id: str, data: FamilyMemberUpdate
    ) -> FamilyMemberModel:
        member = self._get_owned(owner, member_id)
        changes = data.model_dump(exclude_unset=True)
        if "relationship_to_owner" in changes and changes["relationship_to_owner"]:
            changes["relationship_to_owner"] = changes["relationship_to_owner"].value
        if changes.get("email") and self.repo.email_taken(changes["email"], exclude_id=member.id):
            raise ValueError("A family member with this email already exists.")
        return self.repo.update(member, changes)

    def remove_member(self, owner: UserModel, member_id: str) -> None:
        self.repo.delete(self._get_owned(owner, member_id))

    def _get_owned(self, owner: UserModel, member_id: str) -> FamilyMemberModel:
        # Someone else's member id looks exactly like a missing one, so
        # the endpoint can't be used to probe other accounts.
        try:
            UUID(member_id)
        except ValueError:
            raise FamilyMemberNotFoundError()
        member = self.repo.get_for_owner(owner.id, member_id)
        if member is None:
            raise FamilyMemberNotFoundError()
        return member
