from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Gender = Literal["male", "female", "other", "prefer_not_to_say"]
# today | 1-6 days | 1-4 weeks | over a month
Duration = Literal["today", "few_days", "week", "longer"]


class SymptomRead(BaseModel):
    id: str  # value to send back in PredictRequest.symptoms, e.g. "high_fever"
    label: str  # human-readable, e.g. "High fever"
    weight: int  # severity 1 (mild) .. 7 (serious)


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)


class SymptomSuggestion(BaseModel):
    phrase: str  # the vague word in the text, e.g. "blood"
    options: List[SymptomRead]  # let the user pick which one they meant


class ParseResponse(BaseModel):
    symptoms: List[SymptomRead]  # confidently matched; pre-select these
    suggestions: List[SymptomSuggestion]
    duration: Optional[Duration] = None  # e.g. "for two days" -> few_days
    red_flags: List[str]  # urgent-care warnings to show straight away


class PredictRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1, max_length=20)
    # Patient details: the model was trained on symptoms only, so these feed
    # the urgency safety rules, not the list of conditions.
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[Gender] = None  # recorded for context; no rule uses it yet
    duration: Optional[Duration] = None
    # The free text the symptoms were parsed from, if any: red flags in it
    # (e.g. blood with vomiting) raise the urgency to high.
    description: Optional[str] = Field(None, max_length=1000)
    # Who the check is for; omitted means the caller. Saved to their history.
    family_member_id: Optional[str] = None


class DiseasePrediction(BaseModel):
    disease: str
    label: str
    probability: float  # 0..1
    description: str
    precautions: List[str]


class PredictResponse(BaseModel):
    symptoms: List[str]  # the normalised symptom ids that were used
    predictions: List[DiseasePrediction]  # most likely first
    urgency: Literal["low", "medium", "high"]
    urgency_reasons: List[str]  # why the urgency is what it is, for the UI
    disclaimer: str
    check_id: Optional[str] = None  # the saved history entry


class CheckPrediction(BaseModel):
    disease: str
    label: str
    probability: float


class SymptomCheckRead(BaseModel):
    id: str
    created_at: datetime
    subject_name: str  # who the check was about
    family_member_id: Optional[str] = None  # the viewer's family profile it's about, if any
    run_by_name: str  # who ran it
    is_mine: bool  # the viewer ran it
    about_me: bool  # the viewer is the patient
    age: Optional[int] = None
    gender: Optional[str] = None
    duration: Optional[str] = None
    symptoms: List[SymptomRead]
    predictions: List[CheckPrediction]
    urgency: Literal["low", "medium", "high"]
    urgency_reasons: List[str]
    synced_to_medplum: bool
