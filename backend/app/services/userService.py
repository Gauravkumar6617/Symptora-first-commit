from app.repositories.userRepositories import UserRepository
from app.utils.integration.medplum.index import MedplumIntegration


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

    def create_user(self, user_data):
        # 1. Check if user already exists
        existing_user = self.user_repository.check_user_exists(
            user_data.email, user_data.number
        )
        if existing_user:
            raise ValueError("User with this email or number already exists.")

        # 2. Save user to database
        new_user = self.user_repository.create_user(user_data)

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
