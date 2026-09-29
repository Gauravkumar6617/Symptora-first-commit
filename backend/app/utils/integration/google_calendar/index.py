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
        # a fresh access_token per call, calendar api tokens expire ~1hr
        access_token=self.get_access_token()
        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers={
            "Authorization":f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        # conferenceDataVersion=1 tells Google to actually create the Meet
        # link from event_data["conferenceData"], not just store the request.
        params={"conferenceDataVersion":1,"sendUpdates":"all"}
        response = httpx.post(url,json=event_data,headers=headers,params=params,timeout=15)
        if response.status_code in (200, 201):
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to create calendar event: {response.text}",
            )
