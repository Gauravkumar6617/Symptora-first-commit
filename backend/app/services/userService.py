import json
import logging

from app.core.config import settings
from app.core.security import hashed_pasword
from app.repositories.userRepositories import UserRepository
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.schemas.userSchema import (
    CurrentUserResponse,
    FamilyInviteAccept,
    UserCreate,
    UserLogin,
    UserUpdate,
)
from app.utils.integration.cloudflarR2.index import delete_key, upload_avatar
from app.utils.integration.medplum.index import MedplumIntegration
from app.utils.otp.index import discard_otp , generate_store_otp, verify_otp
from app.utils.otp.send_otp import send_otp_email
from app.core.security import verify_password,create_access_token,decode_token 


logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    pass

class InvalidCredentialsError(Exception):
    pass

class InactiveUserError(Exception):
    pass

class UserAlreadyExistsError(Exception):
    pass

class OTPDeliveryError(Exception):
    pass

class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        redis_user,
        medplum_integration: MedplumIntegration,
    ):
        self.user_repository = user_repository
        self.redis_user = redis_user
        self.medplum = medplum_integration

    @staticmethod
    def _pending_registration_key(email: str) -> str:
        return f"registration:pending:{email.strip().lower()}"

    def request_registration_otp(self, user_data: UserCreate, avatar=None) -> None:
        """Store a pending registration and email its one-time code.

        ``avatar`` is an optional UploadFile. It is pushed to R2 here and only
        its object key travels through Redis and into the user row.
        """
        # Only a verified account claims an email/number for good. A row left
        # behind by a registration that never completed must not lock its own
        # owner out forever; verify_registration_otp replaces it.
        existing = self.user_repository.find_by_email_or_number(
            user_data.email, user_data.number
        )
        if existing and existing.is_active:
            raise ValueError("User with this email or number already exists.")

        otp, error = generate_store_otp(user_data.email)
        if error:
            raise ValueError(error)

        avatar_key = None
        if avatar is not None and avatar.filename:
            avatar_key = upload_avatar(avatar)
            user_data = user_data.model_copy(update={"avatar": avatar_key})

        # The payload lives no longer than the OTP and is consumed only after
        # successful verification. Store the password hash, never the password.
        self.redis_user.setex(
            self._pending_registration_key(user_data.email),
            settings.OTP_EXPIRY_SECONDS,
            json.dumps(
                {
                    "user": user_data.model_dump(mode="json", exclude={"password"}),
                    "password_hash": hashed_pasword(user_data.password),
                }
            ),
        )
        try:
            send_otp_email(user_data.email, otp)
        except Exception:
            # Do not leave a code that was never delivered usable, nor an
            # avatar object that no registration will ever claim.
            self.redis_user.delete(self._pending_registration_key(user_data.email))
            discard_otp(user_data.email)
            if avatar_key:
                try:
                    delete_key(avatar_key)
                except Exception:
                    pass
            raise OTPDeliveryError(
                "Unable to send verification email. Please try again later."
            )

    def verify_registration_otp(self, email: str, otp: str):
        valid, message = verify_otp(email, otp)
        if not valid:
            raise ValueError(message)

        pending_key = self._pending_registration_key(email)
        pending_user = self.redis_user.get(pending_key)
        if not pending_user:
            raise ValueError("Registration expired. Please request a new OTP.")

        pending_data = json.loads(pending_user)
        password_hash = pending_data.get("password_hash")
        if not password_hash:
            raise ValueError("Registration data is invalid. Please request a new OTP.")

        # UserCreate is reused for its validated profile fields. The placeholder
        # is never stored; ``password_hash`` is passed directly to the repository.
        user_data = UserCreate.model_validate(
            {**pending_data["user"], "password": "verified-registration"}
        )
        # The OTP just proved the address, so the account starts active and
        # can log in immediately.
        user = self.create_user(
            user_data, password_hash=password_hash, is_active=True
        )
        self.redis_user.delete(pending_key)
        self._link_family_rows(user)
        return user

    def create_fhir_patient(self, user_data, local_user_id: str | int) -> dict:
        telecom_list = []
        if getattr(user_data, "email", None):
            telecom_list.append({"system": "email", "value": user_data.email})
        if getattr(user_data, "number", None):
            telecom_list.append({"system": "phone", "value": str(user_data.number)})

        name_list = []
        has_first_name = (
            hasattr(user_data, "first_name") and user_data.first_name
        )
        has_last_name = hasattr(user_data, "last_name") and user_data.last_name

        if has_first_name or has_last_name:
            name_entry = {"use": "official"}
            if has_first_name:
                name_entry["given"] = [user_data.first_name]
            if has_last_name:
                name_entry["family"] = user_data.last_name  # In FHIR, family is a string, not a list
            name_list.append(name_entry)

        return {
            "resourceType": "Patient",
            "identifier": [
                {
                    "system": "http://localhost:8000/api/v1/users",
                    "value": str(local_user_id),
                }
            ],
            "name": name_list,
            "telecom": telecom_list,
        }

    def create_user(
        self, user_data, password_hash: str | None = None, is_active: bool = False
    ):
        # 1. A verified account blocks the address; an unverified leftover is
        # dropped so this registration can take its place.
        existing_user = self.user_repository.find_by_email_or_number(
            user_data.email, user_data.number
        )
        if existing_user:
            if existing_user.is_active:
                raise ValueError("User with this email or number already exists.")
            stale_avatar = existing_user.avatar
            self.user_repository.delete_user(existing_user.id)
            if stale_avatar and not stale_avatar.startswith("http"):
                try:
                    delete_key(stale_avatar)
                except Exception:
                    pass

        # 2. Save user to database
        new_user = self.user_repository.create_user(
            user_data, password_hash=password_hash, is_active=is_active
        )

        # 3. Create patient in Medplum. A failure here would otherwise leave a
        # row that blocks the user from ever retrying, so it is rolled back.
        try:
            fhir_patient_data = self.create_fhir_patient(user_data, new_user.id)
            medplum_patient = self.medplum.create_patient(fhir_patient_data)
        except Exception:
            self.user_repository.delete_user(new_user.id)
            raise

        # 4. Save Medplum ID into user record
        new_user.medplum_patient_id = medplum_patient.get("id")
        if hasattr(self.user_repository, "db"):
            self.user_repository.db.commit()
            self.user_repository.db.refresh(new_user)

        # 5. Cache user in Redis
        cache_value = (
            new_user.json() if hasattr(new_user, "json") else str(new_user)
        )
        self.redis_user.set(f"user:{new_user.id}", cache_value)

        return new_user

    def login_user(self, user_data: UserLogin):
        """Exchange email + password for an access token."""
        identifier = user_data.email.strip()
        # Family members often only know the phone number the owner added.
        user = (
            self.user_repository.get_user_by_email(identifier.lower())
            if "@" in identifier
            else self.user_repository.get_active_user_by_number(identifier)
        )
        # The same error for a missing user and a wrong password, so the
        # response cannot be used to discover which emails are registered.
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise InvalidCredentialsError("Incorrect email/phone or password.")

        if not user.is_active:
            raise InactiveUserError(
                "Account is not verified. Please complete email verification."
            )

        # ``sub`` is the user id because that is what deps/auth.py looks up.
        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}

    # ------------------------------------------------------------ family invites

    def _family_repo(self) -> FamilyMemberRepository:
        return FamilyMemberRepository(self.user_repository.db)

    def _link_family_rows(self, user) -> None:
        """Link every family-member row with this email to the account."""
        rows = self._family_repo().unlinked_by_email(user.email)
        for row in rows:
            if row.account_owner_id != user.id:
                row.linked_user_id = user.id
        if rows:
            self.user_repository.db.commit()

    def request_family_invite(self, email: str) -> None:
        """Member side of the invite: send a fresh activation code.

        Stays silent when no family added this email, so the endpoint can't be
        used to find out who is on Symptora.
        """
        from app.services.familyMemberService import FamilyMemberService

        rows = self._family_repo().unlinked_by_email(email)
        if not rows:
            return
        existing = self.user_repository.get_user_by_email(email.strip().lower())
        if existing and existing.is_active:
            self._link_family_rows(existing)
            raise ValueError("You already have a Symptora account. Log in with it instead.")
        FamilyMemberService(self.user_repository.db).send_invite_code(rows[0], rows[0].account_owner)

    def accept_family_invite(self, data: FamilyInviteAccept) -> dict:
        """Create the member's own login from the family profile; returns a token."""
        from app.services.familyMemberService import invite_otp_key

        valid, message = verify_otp(invite_otp_key(data.email), data.otp)
        if not valid:
            raise ValueError(message)

        rows = self._family_repo().unlinked_by_email(data.email)
        if not rows:
            raise ValueError("This invite is no longer available.")
        member = rows[0]
        number = (data.number or member.number or "").strip()
        if not number:
            raise ValueError("Add your phone number to finish.")

        clash = self.user_repository.find_by_email_or_number(data.email, number)
        if clash and clash.is_active:
            raise ValueError("An account with this email or phone number already exists. Log in instead.")
        if clash:
            self.user_repository.delete_user(clash.id)  # unverified leftover signup

        first, _, last = member.full_name.strip().partition(" ")
        user_data = UserCreate(
            first_name=first[:24],
            last_name=last[:24],
            email=data.email,
            number=number,
            date_of_birth=member.date_of_birth,
            gender=member.gender,
            password=data.password,
        )
        user = self.user_repository.create_user(
            user_data, password_hash=hashed_pasword(data.password), is_active=True
        )

        # Reuse the member's FHIR Patient so their records stay in one place.
        patient_id = member.medplum_patient_id
        if not patient_id:
            try:
                patient_id = self.medplum.create_patient(self.create_fhir_patient(user_data, user.id)).get("id")
            except Exception:
                logger.exception("Medplum patient for invited user %s not created", user.id)
        user.medplum_patient_id = patient_id
        self.user_repository.db.commit()
        self._link_family_rows(user)

        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}

    @staticmethod
    def to_current_user(user) -> CurrentUserResponse:
        """The caller's account plus their doctor application, if any."""
        response = CurrentUserResponse.model_validate(user)
        profile = user.doctor_profile
        if profile is not None:
            response.doctor_status = profile.status
            response.specialization = profile.specialization
        return response

    def update_profile(self, user, updates: UserUpdate, avatar=None):
        """Apply a self-service profile edit, optionally replacing the avatar."""
        if updates.number and updates.number != user.number:
            clash = self.user_repository.find_by_email_or_number(user.email, updates.number)
            if clash and clash.id != user.id:
                raise ValueError("This phone number is already in use.")

        old_avatar = user.avatar
        new_avatar = None
        if avatar is not None and avatar.filename:
            new_avatar = upload_avatar(avatar)
            updates = updates.model_copy(update={"avatar": new_avatar})

        try:
            updated = self.user_repository.update_user(user.id, updates)
        except Exception:
            if new_avatar:
                try:
                    delete_key(new_avatar)
                except Exception:
                    pass
            raise

        if new_avatar and old_avatar and not old_avatar.startswith("http"):
            try:
                delete_key(old_avatar)
            except Exception:
                pass

        self.redis_user.delete(f"user:{updated.id}")
        return self.to_current_user(updated)
