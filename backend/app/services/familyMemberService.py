import logging
from uuid import UUID

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.appointmentModel import AppointmentModel
from app.models.familyMemeberModel import FamilyMemberModel
from app.models.prescriptionModel import PrescriptionModel
from app.models.symptomCheckModel import SymptomCheckModel
from app.models.telemedicineModel import TelemedicineConsultationModel
from app.models.userModel import UserModel
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.schemas.family_member import FamilyMemberCreate, FamilyMemberUpdate
from app.services.notificationService import notify
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
        # Someone who already has an account gets a link request — never linked
        # without their approval, since linking shares their health checks.
        if member.email:
            self._request_link(member, owner)
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
        email_added = changes.get("email") and changes["email"].lower() != (member.email or "").lower()
        member = self.repo.update(member, changes)
        if email_added:
            self._request_link(member, owner)
        return member

    def remove_member(self, owner: UserModel, member_id: str) -> None:
        """Visit records (appointments, consultations, prescriptions) must be
        kept, so a member who has any can't be removed. Their health checks go
        with the profile — otherwise they'd show up as the owner's own."""
        member = self._get_owned(owner, member_id)
        for model in (AppointmentModel, TelemedicineConsultationModel, PrescriptionModel):
            if self.db.query(model.id).filter(model.family_member_id == member.id).first():
                raise ValueError(
                    f"{member.full_name} has appointments, consultations or prescriptions on record, "
                    "so their profile can't be removed."
                )
        self.db.query(SymptomCheckModel).filter(SymptomCheckModel.family_member_id == member.id).delete()
        self.repo.delete(member)

    def get_owned(self, owner: UserModel, member_id: str) -> FamilyMemberModel:
        return self._get_owned(owner, member_id)

    def send_invite(self, owner: UserModel, member_id: str) -> str:
        """"linked" (already), "requested" (they have an account: asked to
        approve the link), or "sent" (emailed a code to activate a login)."""
        member = self._get_owned(owner, member_id)
        if member.linked_user_id:
            return "linked"
        if not member.email:
            raise ValueError("Add an email address for this member first.")
        if self._request_link(member, owner):
            return "requested"
        self.send_invite_code(member, owner)
        return "sent"

    # --- the member's side: family who added me -------------------------------

    def links_for_user(self, user: UserModel) -> list[dict]:
        """Family profiles other people made for this user: pending requests
        (matching email, not yet approved) and approved links."""
        rows = self.db.query(FamilyMemberModel).filter(
            FamilyMemberModel.account_owner_id != user.id,
            or_(
                FamilyMemberModel.linked_user_id == user.id,
                and_(FamilyMemberModel.linked_user_id.is_(None),
                     func.lower(FamilyMemberModel.email) == user.email.lower()),
            ),
        ).order_by(FamilyMemberModel.created_at).all()
        return [
            {
                "id": row.id,
                "owner_name": f"{row.account_owner.first_name} {row.account_owner.last_name}".strip(),
                "relationship_to_owner": row.relationship_to_owner,
                "status": "linked" if row.linked_user_id else "pending",
            }
            for row in rows
        ]

    def accept_link(self, user: UserModel, member_id: str) -> None:
        row = self._link_row(user, member_id)
        if row.linked_user_id:
            return
        row.linked_user_id = user.id
        self.db.commit()
        notify(self.db, row.account_owner_id, f"{user.first_name} {user.last_name} accepted your family link",
               "You now share health checks with each other.", "/family")

    def decline_link(self, user: UserModel, member_id: str) -> None:
        """Decline a request or leave an approved link. The email is cleared so
        the request doesn't come back; the owner keeps the profile itself."""
        row = self._link_row(user, member_id)
        was_linked = row.linked_user_id is not None
        row.linked_user_id = None
        row.email = None
        self.db.commit()
        notify(self.db, row.account_owner_id,
               f"{user.first_name} {user.last_name} {'left' if was_linked else 'declined'} your family link",
               "Health checks are no longer shared.", "/family")

    def _link_row(self, user: UserModel, member_id: str) -> FamilyMemberModel:
        for link in self.links_for_user(user):
            if link["id"] == member_id:
                return self.db.get(FamilyMemberModel, member_id)
        raise FamilyMemberNotFoundError()

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

    def _request_link(self, member: FamilyMemberModel, owner: UserModel) -> bool:
        """If the email belongs to an existing account, ask them to approve the
        link (bell notification). True if such an account exists."""
        user = (
            self.db.query(UserModel)
            .filter(func.lower(UserModel.email) == member.email.lower(), UserModel.is_active.is_(True))
            .first()
        )
        if user is None or user.id == member.account_owner_id:
            return False
        notify(self.db, user.id, f"{owner.first_name} {owner.last_name} wants to add you as family",
               "Approve on your Family page to share health checks with each other.", "/family")
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
