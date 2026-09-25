import logging
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.familyMemeberModel import FamilyMemberModel
from app.models.userModel import UserModel
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.schemas.family_member import FamilyMemberCreate, FamilyMemberUpdate
from app.utils.integration.medplum.index import MedplumIntegration
from app.utils.otp.index import discard_otp, generate_store_otp
from app.utils.otp.send_otp import send_family_invite_email

logger = logging.getLogger(__name__)


def invite_otp_key(email: str) -> str:
    """OTP identifier for family invites, kept apart from registration codes."""
    return f"family-invite:{email.strip().lower()}"


class FamilyMemberNotFoundError(Exception):
    pass


class InviteDeliveryError(Exception):
    pass


def member_fhir_patient(member: FamilyMemberModel, owner: UserModel) -> dict:
    """FHIR Patient for a family member, with the account owner as a contact."""
    first, _, last = member.full_name.strip().partition(" ")
    name = {"use": "official", "given": [first]}
    if last:
        name["family"] = last
    telecom = []
    if member.email:
        telecom.append({"system": "email", "value": member.email})
    if member.number:
        telecom.append({"system": "phone", "value": member.number})
    patient = {
        "resourceType": "Patient",
        "identifier": [
            {"system": "http://localhost:8000/api/v1/family-members", "value": str(member.id)}
        ],
        "name": [name],
        "telecom": telecom,
        "birthDate": member.date_of_birth.date().isoformat(),
        "contact": [
            {
                "relationship": [{"text": member.relationship_to_owner or "family"}],
                "name": {"given": [owner.first_name], "family": owner.last_name},
                "telecom": [{"system": "email", "value": owner.email}],
            }
        ],
    }
    if member.gender in ("male", "female", "other"):
        patient["gender"] = member.gender
    return patient


class FamilyMemberService:

    def __init__(self, db: Session, medplum: MedplumIntegration | None = None):
        self.db = db
        self.repo = FamilyMemberRepository(db)
        self.medplum = medplum

    def list_members(self, owner: UserModel) -> list[FamilyMemberModel]:
        return self.repo.list_for_owner(owner.id)

    def add_member(self, owner: UserModel, data: FamilyMemberCreate) -> FamilyMemberModel:
        if data.email:
            self._check_email(owner, data.email)
        member = self.repo.create(owner.id, data)
        self.ensure_medplum_patient(member, owner)
        # Someone who already has their own account is linked straight away.
        if member.email:
            self._link_existing_user(member)
        return member

    def update_member(
        self, owner: UserModel, member_id: str, data: FamilyMemberUpdate
    ) -> FamilyMemberModel:
        member = self._get_owned(owner, member_id)
        changes = data.model_dump(exclude_unset=True)
        if "relationship_to_owner" in changes and changes["relationship_to_owner"]:
            changes["relationship_to_owner"] = changes["relationship_to_owner"].value
        if changes.get("email"):
            if member.linked_user_id and changes["email"].lower() != (member.email or "").lower():
                raise ValueError("This member has their own account; their email can't be changed here.")
            self._check_email(owner, changes["email"], exclude_id=member.id)
        return self.repo.update(member, changes)

    def remove_member(self, owner: UserModel, member_id: str) -> None:
        self.repo.delete(self._get_owned(owner, member_id))

    def get_owned(self, owner: UserModel, member_id: str) -> FamilyMemberModel:
        return self._get_owned(owner, member_id)

    def send_invite(self, owner: UserModel, member_id: str) -> bool:
        """Email the member a code to activate their login. Returns True if already linked."""
        member = self._get_owned(owner, member_id)
        if member.linked_user_id:
            return True
        if not member.email:
            raise ValueError("Add an email address for this member first.")
        if self._link_existing_user(member):
            return True
        self.send_invite_code(member, owner)
        return False

    def send_invite_code(self, member: FamilyMemberModel, owner: UserModel) -> None:
        key = invite_otp_key(member.email)
        otp, error = generate_store_otp(key)
        if error:
            raise ValueError(error)
        try:
            send_family_invite_email(
                member.email, otp, f"{owner.first_name} {owner.last_name}", member.full_name
            )
        except Exception:
            discard_otp(key)  # let them retry straight away
            logger.exception("Failed to send family invite")
            raise InviteDeliveryError("Unable to send the invite email. Please try again later.")

    def ensure_medplum_patient(self, member: FamilyMemberModel, owner: UserModel) -> str | None:
        """Create the member's FHIR Patient if missing. Best effort: Medplum being
        down must not block adding family; it is retried on the next check."""
        if member.medplum_patient_id or self.medplum is None:
            return member.medplum_patient_id
        try:
            created = self.medplum.create_patient(member_fhir_patient(member, owner))
        except Exception:
            logger.exception("Medplum patient for family member %s not created", member.id)
            return None
        member.medplum_patient_id = created.get("id")
        self.db.commit()
        return member.medplum_patient_id

    def _link_existing_user(self, member: FamilyMemberModel) -> bool:
        user = (
            self.db.query(UserModel)
            .filter(func.lower(UserModel.email) == member.email.lower(), UserModel.is_active.is_(True))
            .first()
        )
        if user is None or user.id == member.account_owner_id:
            return False
        member.linked_user_id = user.id
        self.db.commit()
        return True

    def _check_email(self, owner: UserModel, email: str, exclude_id: str | None = None) -> None:
        if email.strip().lower() == owner.email.lower():
            raise ValueError("That's your own email. Use a different one for this member.")
        if self.repo.email_taken(owner.id, email, exclude_id=exclude_id):
            raise ValueError("You already added a family member with this email.")

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
