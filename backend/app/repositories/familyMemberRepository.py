from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.familyMemeberModel import FamilyMemberModel
from app.schemas.family_member import FamilyMemberCreate


class FamilyMemberRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, owner_id: str, data: FamilyMemberCreate) -> FamilyMemberModel:
        member = FamilyMemberModel(
            account_owner_id=owner_id,
            full_name=data.full_name,
            email=data.email.lower() if data.email else None,
            number=data.number,
            profile=data.profile,
            relationship_to_owner=(
                data.relationship_to_owner.value if data.relationship_to_owner else None
            ),
            date_of_birth=data.date_of_birth,
            gender=data.gender,
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def list_for_owner(self, owner_id: str) -> list[FamilyMemberModel]:
        return (
            self.db.query(FamilyMemberModel)
            .filter(FamilyMemberModel.account_owner_id == owner_id)
            .order_by(FamilyMemberModel.created_at)
            .all()
        )

    def get_for_owner(self, owner_id: str, member_id: str) -> FamilyMemberModel | None:
        return (
            self.db.query(FamilyMemberModel)
            .filter(
                FamilyMemberModel.id == member_id,
                FamilyMemberModel.account_owner_id == owner_id,
            )
            .first()
        )

    def email_taken(self, owner_id: str, email: str, exclude_id: str | None = None) -> bool:
        query = self.db.query(FamilyMemberModel).filter(
            FamilyMemberModel.account_owner_id == owner_id,
            func.lower(FamilyMemberModel.email) == email.strip().lower(),
        )
        if exclude_id:
            query = query.filter(FamilyMemberModel.id != exclude_id)
        return query.first() is not None

    def unlinked_by_email(self, email: str) -> list[FamilyMemberModel]:
        """Member rows (in any family) waiting for this person to activate."""
        return (
            self.db.query(FamilyMemberModel)
            .filter(
                func.lower(FamilyMemberModel.email) == email.strip().lower(),
                FamilyMemberModel.linked_user_id.is_(None),
            )
            .order_by(FamilyMemberModel.created_at)
            .all()
        )

    def linked_to_user(self, user_id: str) -> list[FamilyMemberModel]:
        """Rows in other people's families that are this user."""
        return self.db.query(FamilyMemberModel).filter(FamilyMemberModel.linked_user_id == user_id).all()

    def update(self, member: FamilyMemberModel, changes: dict) -> FamilyMemberModel:
        for field, value in changes.items():
            setattr(member, field, value)
        self.db.commit()
        self.db.refresh(member)
        return member

    def delete(self, member: FamilyMemberModel) -> None:
        self.db.delete(member)
        self.db.commit()
