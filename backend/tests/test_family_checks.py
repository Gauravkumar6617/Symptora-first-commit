"""Medplum payloads and invite email for family members / saved checks (no DB needed)."""

import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.familyMemberService import invite_otp_key, member_fhir_patient
from app.services.symptomCheckService import risk_assessment
from app.utils.otp.send_otp import _family_invite_html


def owner():
    return SimpleNamespace(first_name="Gaurav", last_name="Kumar", email="g@example.com")


def member(**kw):
    values = dict(
        id="m-1", full_name="Sita Devi", email="sita@example.com", number="9876543210",
        date_of_birth=datetime(1960, 5, 1), gender="female", relationship_to_owner="mother",
    )
    values.update(kw)
    return SimpleNamespace(**values)


def test_member_patient_has_details_and_owner_contact():
    patient = member_fhir_patient(member(), owner())
    assert patient["resourceType"] == "Patient"
    assert patient["name"][0] == {"use": "official", "given": ["Sita"], "family": "Devi"}
    assert patient["birthDate"] == "1960-05-01"
    assert patient["gender"] == "female"
    assert {"system": "phone", "value": "9876543210"} in patient["telecom"]
    assert patient["contact"][0]["relationship"] == [{"text": "mother"}]


def test_member_patient_skips_unknown_gender_and_single_name():
    patient = member_fhir_patient(member(full_name="Sita", gender="prefer_not_to_say", number=None), owner())
    assert "gender" not in patient
    assert patient["name"][0] == {"use": "official", "given": ["Sita"]}
    assert all(t["system"] != "phone" for t in patient["telecom"])


def test_risk_assessment_payload():
    check = SimpleNamespace(
        created_at=datetime(2026, 9, 25, 10, 0, tzinfo=timezone.utc),
        subject_name="Sita Devi",
        predictions=[{"disease": "migraine", "label": "Migraine", "probability": 0.8}],
        urgency="medium",
        urgency_reasons=["Adults 65 and over are at higher risk."],
        symptoms=["headache", "nausea"],
    )
    resource = risk_assessment(check, "pat-1")
    assert resource["subject"]["reference"] == "Patient/pat-1"
    assert resource["prediction"][0]["probabilityDecimal"] == 0.8
    assert resource["prediction"][0]["outcome"] == {"text": "Migraine"}
    assert resource["note"][0]["text"] == "Symptoms: Headache, Nausea"
    assert "65" in resource["mitigation"]


def test_invite_key_is_case_insensitive_and_separate_from_signup():
    assert invite_otp_key(" Sita@Example.com ") == "family-invite:sita@example.com"


def test_invite_email_escapes_names():
    html = _family_invite_html("123456", "<script>", "Sita")
    assert "<script>" not in html and "123456" in html
