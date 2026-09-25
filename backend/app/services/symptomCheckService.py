import logging
from datetime import timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.familyMemeberModel import FamilyMemberModel
from app.models.symptomCheckModel import SymptomCheckModel
from app.models.userModel import UserModel
from app.services.familyMemberService import FamilyMemberService
from app.services.predictionService import PredictionService, to_label
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)


class SymptomCheckService:
    """Saves symptom-checker results and decides who may see them.

    A check is visible to whoever ran it and to the patient: the owner sees
    checks their linked member ran for themselves, and the member sees checks
    the owner ran for them.
    """

    def __init__(self, db: Session, medplum: MedplumIntegration | None = None):
        self.db = db
        self.medplum = medplum
        self.family = FamilyMemberService(db, medplum)

    def member_for(self, user: UserModel, member_id: str | None) -> FamilyMemberModel | None:
        """The owned family member a check is for; raises FamilyMemberNotFoundError."""
        return self.family.get_owned(user, member_id) if member_id else None

    def save(
        self, user: UserModel, member: FamilyMemberModel | None, request, result: dict
    ) -> SymptomCheckModel:
        check = SymptomCheckModel(
            created_by_id=user.id,
            family_member_id=member.id if member else None,
            subject_name=(member.full_name if member else f"{user.first_name} {user.last_name}".strip())[:80],
            age=request.age,
            gender=request.gender,
            duration=request.duration,
            description=request.description,
            symptoms=result["symptoms"],
            predictions=[
                {"disease": p["disease"], "label": p["label"], "probability": p["probability"]}
                for p in result["predictions"]
            ],
            urgency=result["urgency"],
            urgency_reasons=result["urgency_reasons"],
        )
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        return check

    def visible_to(self, user: UserModel, member_id: str | None = None) -> list[SymptomCheckModel]:
        mine_elsewhere = [r.id for r in self.db.query(FamilyMemberModel.id).filter(
            FamilyMemberModel.linked_user_id == user.id
        )]
        my_members = self.db.query(FamilyMemberModel).filter(
            FamilyMemberModel.account_owner_id == user.id
        ).all()
        linked_users = [m.linked_user_id for m in my_members if m.linked_user_id]

        query = self.db.query(SymptomCheckModel)
        if member_id:
            member = self.family.get_owned(user, member_id)
            about_member = [SymptomCheckModel.family_member_id == member.id]
            if member.linked_user_id:
                about_member.append(and_(
                    SymptomCheckModel.created_by_id == member.linked_user_id,
                    SymptomCheckModel.family_member_id.is_(None),
                ))
            query = query.filter(or_(*about_member))
        else:
            conditions = [SymptomCheckModel.created_by_id == user.id]
            if mine_elsewhere:
                conditions.append(SymptomCheckModel.family_member_id.in_(mine_elsewhere))
            if linked_users:
                conditions.append(and_(
                    SymptomCheckModel.created_by_id.in_(linked_users),
                    SymptomCheckModel.family_member_id.is_(None),
                ))
            query = query.filter(or_(*conditions))
        return query.order_by(SymptomCheckModel.created_at.desc()).limit(100).all()

    def viewer_member_ids(self, viewer: UserModel) -> dict[str, str]:
        """linked user id -> the viewer's family-member row for them."""
        rows = self.db.query(FamilyMemberModel).filter(
            FamilyMemberModel.account_owner_id == viewer.id,
            FamilyMemberModel.linked_user_id.isnot(None),
        )
        return {m.linked_user_id: m.id for m in rows}

    def to_read(
        self,
        check: SymptomCheckModel,
        viewer: UserModel,
        predictor: PredictionService,
        member_ids: dict[str, str] | None = None,
    ) -> dict:
        creator = check.created_by
        member = check.family_member
        # Which of the viewer's family profiles this is about: set directly when the
        # viewer ran it for them, or found via the member's own login.
        if member is not None and member.account_owner_id == viewer.id:
            viewer_member_id = member.id
        elif check.family_member_id is None:
            viewer_member_id = (member_ids or {}).get(check.created_by_id)
        else:
            viewer_member_id = None
        return {
            "id": check.id,
            "created_at": check.created_at,
            "subject_name": check.subject_name,
            "family_member_id": viewer_member_id,
            "run_by_name": f"{creator.first_name} {creator.last_name}".strip() if creator else "",
            "is_mine": check.created_by_id == viewer.id,
            "about_me": (check.created_by_id == viewer.id and check.family_member_id is None)
            or (member is not None and member.linked_user_id == viewer.id),
            "age": check.age,
            "gender": check.gender,
            "duration": check.duration,
            "symptoms": [
                {"id": s, "label": to_label(s), "weight": predictor.weights.get(s, 1)} for s in check.symptoms
            ],
            "predictions": check.predictions,
            "urgency": check.urgency,
            "urgency_reasons": check.urgency_reasons,
            "synced_to_medplum": check.medplum_risk_assessment_id is not None,
        }


def risk_assessment(check: SymptomCheckModel, patient_id: str) -> dict:
    """The check as a FHIR RiskAssessment on the patient's record."""
    occurred = check.created_at.astimezone(timezone.utc).isoformat()
    resource = {
        "resourceType": "RiskAssessment",
        "status": "final",
        "subject": {"reference": f"Patient/{patient_id}", "display": check.subject_name},
        "occurrenceDateTime": occurred,
        "method": {"text": "Symptora symptom checker (machine-learning model)"},
        "prediction": [
            {
                "outcome": {"text": p["label"]},
                "probabilityDecimal": p["probability"],
                "qualitativeRisk": {"text": check.urgency},
            }
            for p in check.predictions
        ],
        "note": [{"text": "Symptoms: " + ", ".join(to_label(s) for s in check.symptoms)}],
    }
    if check.urgency_reasons:
        resource["mitigation"] = " ".join(check.urgency_reasons)
    return resource


def sync_check_to_medplum(check_id: str, medplum: MedplumIntegration) -> None:
    """Background task: record the check on the patient's Medplum record.

    Runs after the response with its own DB session; failures are only logged
    so the symptom checker never waits on (or breaks because of) Medplum.
    """
    db = SessionLocal()
    try:
        check = db.get(SymptomCheckModel, check_id)
        if check is None:
            return
        member = check.family_member
        if member is not None:
            owner = member.account_owner
            patient_id = FamilyMemberService(db, medplum).ensure_medplum_patient(member, owner)
        else:
            patient_id = check.created_by.medplum_patient_id
        if not patient_id:
            logger.warning("Check %s not sent to Medplum: patient has no Medplum id", check_id)
            return
        created = medplum.create_resource(risk_assessment(check, patient_id))
        check.medplum_risk_assessment_id = created.get("id")
        db.commit()
    except Exception:
        logger.exception("Check %s not sent to Medplum", check_id)
    finally:
        db.close()
