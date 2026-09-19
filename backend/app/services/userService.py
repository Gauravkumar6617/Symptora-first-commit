import json

from app.core.config import settings
from app.core.security import hashed_pasword
from app.repositories.userRepositories import UserRepository
from app.schemas.userSchema import UserCreate , UserLogin
from app.utils.integration.cloudflarR2.index import delete_key, upload_avatar
from app.utils.integration.medplum.index import MedplumIntegration
from app.utils.otp.index import discard_otp , generate_store_otp, verify_otp
from app.utils.otp.send_otp import send_otp_email
from app.core.security import verify_password,create_access_token,decode_token 


class UserNotFoundError(Exception):
    pass

class InvalidCredentialsError(Exception):
    pass

class InactiveUserError(Exception):
    pass

class UserAlreadyExistsError(Exception):
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
        if self.user_repository.check_user_exists(user_data.email, user_data.number):
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
            raise

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
        # 1. Check if user already exists
        existing_user = self.user_repository.check_user_exists(
            user_data.email, user_data.number
        )
        if existing_user:
            raise ValueError("User with this email or number already exists.")

        # 2. Save user to database
        new_user = self.user_repository.create_user(
            user_data, password_hash=password_hash, is_active=is_active
        )

        # 3. Create patient in Medplum
        fhir_patient_data = self.create_fhir_patient(user_data, new_user.id)
        medplum_patient = self.medplum.create_patient(fhir_patient_data)

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
        user = self.user_repository.get_user_by_email(
            user_data.email.strip().lower()
        )
        # The same error for a missing user and a wrong password, so the
        # response cannot be used to discover which emails are registered.
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise InvalidCredentialsError("Incorrect email or password.")

        if not user.is_active:
            raise InactiveUserError(
                "Account is not verified. Please complete email verification."
            )

        # ``sub`` is the user id because that is what deps/auth.py looks up.
        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}