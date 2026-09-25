import json
import re
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

from app.services.symptomParser import SymptomParser

BASE = Path(__file__).resolve().parents[2]
ARTIFACT = BASE / "ml" / "artifact"
PROCESSED = BASE / "data" / "processed"

TOP_K = 3
LEVELS = ["low", "medium", "high"]
DISCLAIMER = (
    "This is not a medical diagnosis. It suggests possible conditions based on "
    "the symptoms entered. Please consult a doctor for proper advice."
)


class UnknownSymptomError(Exception):
    def __init__(self, unknown: list[str]):
        self.unknown = unknown
        super().__init__(f"Unknown symptoms: {', '.join(unknown)}")


def normalise(name: str) -> str:
    """Same rule as ml/clean.py: 'High Fever ' -> 'high_fever'."""
    name = str(name).strip().lower().replace(" ", "_")
    return re.sub(r"_+", "_", name)


def to_label(name: str) -> str:
    return name.replace("_", " ").strip().capitalize()


class PredictionService:
    """Loads the trained model and lookup tables once; answers symptom-checker queries."""

    def __init__(self, artifact_dir: Path = ARTIFACT, processed_dir: Path = PROCESSED):
        self.model = joblib.load(artifact_dir / "model.joblib")
        self.symptoms: list[str] = json.loads((artifact_dir / "symptoms.json").read_text())
        self.parser = SymptomParser(self.symptoms)

        severity = pd.read_csv(processed_dir / "severity.csv")
        self.weights = dict(zip(severity["symptom"], severity["weight"].astype(int)))

        description = pd.read_csv(processed_dir / "description.csv")
        self.descriptions = dict(zip(description["disease"], description["description"]))

        precaution = pd.read_csv(processed_dir / "precaution.csv").set_index("disease")
        self.precautions = {
            disease: [p.capitalize() for p in row.dropna()]
            for disease, row in precaution.iterrows()
        }

    def _symptom(self, s: str) -> dict:
        return {"id": s, "label": to_label(s), "weight": self.weights.get(s, 1)}

    def list_symptoms(self) -> list[dict]:
        return [self._symptom(s) for s in self.symptoms]

    def parse(self, text: str) -> dict:
        """Free text -> matched symptoms, 'did you mean' choices, duration, red flags."""
        parsed = self.parser.parse(text)
        return {
            "symptoms": [self._symptom(s) for s in parsed["symptoms"]],
            "suggestions": [
                {"phrase": s["phrase"], "options": [self._symptom(o) for o in s["options"]]}
                for s in parsed["suggestions"]
            ],
            "duration": parsed["duration"],
            "red_flags": parsed["red_flags"],
        }

    def predict(
        self,
        symptoms: list[str],
        age: int | None = None,
        duration: str | None = None,
        description: str | None = None,
    ) -> dict:
        given = list(dict.fromkeys(normalise(s) for s in symptoms))  # dedupe, keep order
        known = set(self.symptoms)
        unknown = [s for s in given if s not in known]
        if unknown:
            raise UnknownSymptomError(unknown)

        row = pd.DataFrame([[int(s in given) for s in self.symptoms]], columns=self.symptoms)
        probs = self.model.predict_proba(row)[0]
        top = probs.argsort()[::-1][:TOP_K]

        predictions = [
            {
                "disease": disease,
                "label": to_label(disease),
                "probability": round(float(probs[i]), 4),
                "description": self.descriptions.get(disease, ""),
                "precautions": self.precautions.get(disease, []),
            }
            for i in top
            for disease in [self.model.classes_[i]]
        ]
        urgency, reasons = self.urgency(given, age, duration)
        red_flags = self.parser.parse(description)["red_flags"] if description else []
        if red_flags:
            urgency, reasons = "high", red_flags + reasons
        return {
            "symptoms": given,
            "predictions": predictions,
            "urgency": urgency,
            "urgency_reasons": reasons,
            "disclaimer": DISCLAIMER,
        }

    def urgency(
        self, symptoms: list[str], age: int | None = None, duration: str | None = None
    ) -> tuple[str, list[str]]:
        """Rough flag for the UI, not a triage decision.

        Base level from severity weights (1-7): one very serious symptom or many
        moderate ones means 'high'. Then one step up (capped at 'high') for
        higher-risk patients: infants, older adults, or symptoms lasting over a week.
        """
        weights = {s: self.weights.get(s, 1) for s in symptoms}
        highest, total = max(weights.values()), sum(weights.values())
        reasons = []

        if highest >= 7 or total >= 20:
            level = 2
        elif highest >= 5 or total >= 10:
            level = 1
        else:
            level = 0
        serious = [to_label(s).lower() for s, w in weights.items() if w >= 7]
        if serious:
            reasons.append(f"Serious symptom: {', '.join(serious)}.")
        elif total >= 10:
            reasons.append("Several symptoms together.")

        risk = []
        if age is not None and age < 2:
            risk.append("Children under 2 should be seen sooner.")
        if age is not None and age >= 65:
            risk.append("Adults 65 and over are at higher risk.")
        if duration in ("week", "longer"):
            risk.append("Symptoms lasting over a week should be checked by a doctor.")
        if risk:
            level = min(level + 1, 2)
            reasons += risk

        return LEVELS[level], reasons


@lru_cache
def get_prediction_service() -> PredictionService:
    """Shared instance: the model is loaded on first use (or at startup) and reused."""
    return PredictionService()
