
import httpx
from fastapi import HTTPException
from app.schemas.doctor import DoctorProfileCreate
from app.schemas.clinic import ClinicBase

class MedplumIntegration:

    def __init__(
        self,
        base_url: str,
        client_id: str,
        client_secret: str,
        project_id: str
    ):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.project_id = project_id
        self.access_token = None

    def get_access_token(self):
        if not self.access_token:
            url = f"{self.base_url}/oauth2/token"

            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": f"project/{self.project_id}/.default"
            }

            response = httpx.post(url, data=data)

            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to obtain access token from Medplum."
                )

        return self.access_token

    def create_patient(self, patient_data: dict):
        access_token = self.get_access_token()

        url = f"{self.base_url.rstrip('/')}/fhir/R4/Patient"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        response = httpx.post(
            url,
            json=patient_data,
            headers=headers
        )

        if response.status_code == 201:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create patient in Medplum."
            )

    def create_practitioner(
        self,
        doctor_profile: DoctorProfileCreate,
        first_name: str,
        last_name: str
    ):
        access_token = self.get_access_token()

        url = f"{self.base_url.rstrip('/')}/fhir/R4/Practitioner"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "resourceType": "Practitioner",
            "name": [
                {
                    "given": [first_name],
                    "family": last_name
                }
            ],
            "qualification": [
                {
                    "identifier": [
                        {
                            "value": doctor_profile.license_number
                        }
                    ],
                    "code": {
                        "text": doctor_profile.specialization
                    }
                }
            ]
        }

        response = httpx.post(
            url,
            json=payload,
            headers=headers
        )

        if response.status_code == 201:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create practitioner in Medplum."
            )

    def create_practitioner_role(self, practitioner_id: str, organization_id: str) -> dict:
        access_token = self.get_access_token()

        url = f"{self.base_url.rstrip('/')}/fhir/R4/PractitionerRole"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "resourceType": "PractitionerRole",
            "active": True,
            "practitioner": {"reference": f"Practitioner/{practitioner_id}"},
            "organization": {"reference": f"Organization/{organization_id}"}
        }

        response = httpx.post(
            url,
            json=payload,
            headers=headers
        )

        if response.status_code == 201:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create practitioner role in Medplum."
            )

    def create_organisation(self, clinic_data: ClinicBase):
        try:
            access_token = self.get_access_token()
            url = f"{self.base_url.rstrip('/')}/fhir/R4/Organization"

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }

            payload = {
                "resourceType": "Organization",
                "name": clinic_data.name,
                "telecom": [
                    {
                        "system": "phone",
                        "value": clinic_data.phone,
                    }
                ] if clinic_data.phone else [],
                "address": [
                    {
                        "text": clinic_data.address,
                    }
                ] if clinic_data.address else [],
            }

            response = httpx.post(
                url,
                json=payload,
                headers=headers,
            )

            if response.status_code == 201:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to create Organisation in Medplum.",
                )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create Organisation: {str(e)}",
            )


