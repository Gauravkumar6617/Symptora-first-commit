import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.deps.auth import get_current_user
from app.routers.predictionRouter import get_check_service, router
from app.services.predictionService import (
    PredictionService,
    UnknownSymptomError,
    get_prediction_service,
)

BASE = Path(__file__).resolve().parent.parent
pytestmark = pytest.mark.skipif(
    not (BASE / "ml" / "artifact" / "model.joblib").exists(),
    reason="model not trained; run `python ml/train.py`",
)


@pytest.fixture(scope="module")
def service() -> PredictionService:
    return get_prediction_service()


class FakeChecks:
    """Stands in for the DB-backed history: records saves instead."""

    medplum = None
    saved: list = []

    def member_for(self, user, member_id):
        from app.services.familyMemberService import FamilyMemberNotFoundError

        if member_id:
            raise FamilyMemberNotFoundError()
        return None

    def save(self, user, member, request, result):
        FakeChecks.saved.append(result)
        return type("Check", (), {"id": "check-1"})()


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: object()  # skip real login/DB
    app.dependency_overrides[get_check_service] = lambda: FakeChecks()
    return TestClient(app)


# ---------- Service ----------

def test_predicts_known_disease_from_full_symptoms(service):
    result = service.predict(["itching", "skin_rash", "nodal_skin_eruptions", "dischromic_patches"])
    assert result["predictions"][0]["disease"] == "fungal_infection"


def test_returns_top3_sorted_with_details(service):
    preds = service.predict(["fatigue", "high_fever", "chills", "headache"])["predictions"]
    assert len(preds) == 3
    probs = [p["probability"] for p in preds]
    assert probs == sorted(probs, reverse=True)
    assert all(0 <= p <= 1 for p in probs)
    assert all(p["description"] and p["precautions"] for p in preds)


def test_normalises_and_dedupes_input(service):
    result = service.predict(["  High Fever", "high_fever", "CHILLS"])
    assert result["symptoms"] == ["high_fever", "chills"]


def test_unknown_symptom_raises(service):
    with pytest.raises(UnknownSymptomError) as e:
        service.predict(["headache", "made_up_symptom"])
    assert e.value.unknown == ["made_up_symptom"]


def test_precautions_skip_blank_cells(service):
    # allergy has only 3 precautions in the source data
    assert all(isinstance(p, str) and p for p in service.precautions["allergy"])


def test_urgency_levels(service):
    assert service.urgency(["itching"]) == ("low", [])  # weight 1
    level, reasons = service.urgency(["chest_pain"])  # weight 7
    assert level == "high"
    assert "chest pain" in reasons[0]


@pytest.mark.parametrize(
    "age, duration, expected",
    [
        (30, "today", "low"),  # no risk factor
        (1, None, "medium"),  # infant
        (70, None, "medium"),  # older adult
        (30, "week", "medium"),  # long-lasting
        (80, "longer", "medium"),  # several factors still bump only one step
    ],
)
def test_urgency_risk_factors_bump_one_level(service, age, duration, expected):
    level, reasons = service.urgency(["itching"], age=age, duration=duration)
    assert level == expected
    assert bool(reasons) == (expected != "low")


def test_urgency_never_exceeds_high(service):
    assert service.urgency(["chest_pain"], age=90, duration="longer")[0] == "high"


def test_every_symptom_has_a_weight(service):
    assert all(s["weight"] >= 1 for s in service.list_symptoms())
    assert set(service.weights) >= set(service.symptoms)


def test_quality_with_three_symptoms(service):
    """Guard against a bad retrain: from 3 random symptoms of each known case, the right
    disease should usually be in the top 3. (Uses training rows, so it's a sanity floor,
    not a true test score; ml/train.py reports the held-out numbers.)"""
    table = pd.read_csv(BASE / "data" / "processed" / "training_table.csv")
    rng = np.random.default_rng(0)
    hits = 0
    for _, row in table.iterrows():
        present = [s for s in service.symptoms if row[s] == 1]
        picked = list(rng.choice(present, size=min(3, len(present)), replace=False))
        top3 = [p["disease"] for p in service.predict(picked)["predictions"]]
        hits += row["disease"] in top3
    assert hits / len(table) >= 0.90


# ---------- API ----------

def test_api_symptoms_list(client):
    res = client.get("/api/v1/symptoms")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 131
    assert {"id", "label", "weight"} <= body[0].keys()


def test_api_predict_ok(client):
    res = client.post("/api/v1/predict", json={"symptoms": ["fatigue", "high_fever", "chills"]})
    assert res.status_code == 200
    body = res.json()
    assert len(body["predictions"]) == 3
    assert body["urgency"] in {"low", "medium", "high"}
    assert isinstance(body["urgency_reasons"], list)
    assert body["disclaimer"]


def test_api_predict_with_patient_details(client):
    res = client.post(
        "/api/v1/predict",
        json={"symptoms": ["itching"], "age": 70, "gender": "female", "duration": "week"},
    )
    assert res.status_code == 200
    assert res.json()["urgency"] == "medium"


@pytest.mark.parametrize(
    "extra", [{"age": -1}, {"age": 121}, {"gender": "robot"}, {"duration": "forever"}]
)
def test_api_predict_rejects_bad_patient_details(client, extra):
    res = client.post("/api/v1/predict", json={"symptoms": ["itching"], **extra})
    assert res.status_code == 422


def test_api_predict_unknown_symptom(client):
    res = client.post("/api/v1/predict", json={"symptoms": ["headache", "banana"]})
    assert res.status_code == 422
    assert "banana" in res.json()["detail"]


def test_api_predict_empty_list(client):
    res = client.post("/api/v1/predict", json={"symptoms": []})
    assert res.status_code == 422


def test_api_parse_symptoms(client):
    res = client.post("/api/v1/symptoms/parse", json={"text": "vomiting for two days with blood"})
    assert res.status_code == 200
    body = res.json()
    assert body["symptoms"][0] == {"id": "vomiting", "label": "Vomiting", "weight": 5}
    assert body["suggestions"][0]["options"][0]["id"] == "stomach_bleeding"
    assert body["duration"] == "few_days"
    assert body["red_flags"]


def test_api_predict_red_flag_description_forces_high(client):
    res = client.post(
        "/api/v1/predict",
        json={"symptoms": ["vomiting"], "description": "vomiting with blood"},
    )
    assert res.status_code == 200
    assert res.json()["urgency"] == "high"
    assert "vomiting" in res.json()["urgency_reasons"][0]


def test_api_requires_login():
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    res = TestClient(app).post("/api/v1/predict", json={"symptoms": ["headache"]})
    assert res.status_code == 401


def test_predict_saves_the_check(client):
    FakeChecks.saved.clear()
    response = client.post("/api/v1/predict", json={"symptoms": ["itching", "skin_rash"]})
    assert response.status_code == 200
    assert response.json()["check_id"] == "check-1"
    assert len(FakeChecks.saved) == 1


def test_predict_for_unknown_family_member_is_404(client):
    response = client.post(
        "/api/v1/predict", json={"symptoms": ["itching"], "family_member_id": "not-mine"}
    )
    assert response.status_code == 404
