import httpx
from fastapi import HTTPException


class MedplumIntegration:

    def __init__(self, base_url: str, client_id: str, client_secret: str, project_id: str):
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
                raise HTTPException(status_code=response.status_code, detail="Failed to obtain access token from Medplum.")
        return self.access_token
    
    def create_patient(self, patient_data: dict):
        access_token = self.get_access_token()
        url = f"{self.base_url}/Patient"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        response = httpx.post(url, json=patient_data, headers=headers)
        if response.status_code == 201:
            return response.json()
        else:   
            raise HTTPException(status_code=response.status_code, detail="Failed to create patient in Medplum.")