
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

    def create_resource(self, resource: dict) -> dict:
        """POST any FHIR resource (e.g. RiskAssessment); returns the created resource."""
        access_token = self.get_access_token()
        url = f"{self.base_url.rstrip('/')}/fhir/R4/{resource['resourceType']}"
        response = httpx.post(
            url,
            json=resource,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/fhir+json"},
            timeout=15,
        )
        if response.status_code == 201:
            return response.json()
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create {resource['resourceType']} in Medplum.",
        )

    def update_organisation(self, organisation_id: str, clinic) -> dict:
        """Replace the clinic's Organization with its current details."""
        access_token = self.get_access_token()
        url = f"{self.base_url.rstrip('/')}/fhir/R4/Organization/{organisation_id}"
        payload = self._organisation_payload(clinic)
        payload["id"] = organisation_id
        response = httpx.put(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/fhir+json"},
            timeout=15,
        )
        if response.status_code in (200, 201):
            return response.json()
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to update Organisation in Medplum.",
        )

    def delete_resource(self, resource_type: str, resource_id: str) -> None:
        """Delete a FHIR resource; one that is already gone counts as deleted."""
        access_token = self.get_access_token()
        url = f"{self.base_url.rstrip('/')}/fhir/R4/{resource_type}/{resource_id}"
        response = httpx.delete(url, headers={"Authorization": f"Bearer {access_token}"}, timeout=15)
        if response.status_code not in (200, 204, 404, 410):
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to delete {resource_type} in Medplum.",
            )

    @staticmethod
    def _organisation_payload(clinic) -> dict:
        return {
            "resourceType": "Organization",
            "name": clinic.name,
            "telecom": [{"system": "phone", "value": clinic.phone}] if clinic.phone else [],
            "address": [{"text": clinic.address}] if clinic.address else [],
        }

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

            payload = self._organisation_payload(clinic_data)

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


