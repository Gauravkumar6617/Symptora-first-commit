import httpx #as this hel to communiate with outer api
from fastapi import HTTPException
from app.core.config import settings

"""
create_event() called
    ↓
get_access_token() runs
    ↓
Sends your refresh_token to Google → "give me a new access_token"
    ↓
Google replies with a NEW access_token (valid ~1 hour)
    ↓
That access_token is used ONCE to create the event
    ↓
Function returns, access_token is discarded from memory
"""

class GoogleCalenderIntegration:

    def __init__(self,client_id:str,client_secret:str,refresh_token:str):
        self.client_id=client_id
        self.client_secret=client_secret
        self.refresh_token=refresh_token
        self.access_token=None


    def get_access_token(self):
        #to get access_token its required for every calender is made
        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token",
        }    

        response = httpx.post(url,data=data)
        if response.status_code==200:
            self.access_token=response.json().get("access_token")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to obtain access token from Google Calendar.",
            )
        return self.access_token



    def create_event(self,event_data:dict):
        acces_token=self.access_token
        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        header={
            "Authorisation":f"Bearer {acces_token}",
            "Content-Type": "application/json",
        }

        params={"conferenceDataVersion",1}
        response = httpx.post(json=event_data,acces_token=acces_token,params=params)
        if response.status_code in (200, 201):
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create calendar event.",
            )