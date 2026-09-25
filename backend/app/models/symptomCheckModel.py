from sqlalchemy import JSON, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.familyMemeberModel import gen_uuid


class SymptomCheckModel(BaseModel):
    """One symptom-checker result, kept so the owner and the member both see it."""

    __tablename__ = "symptom_checks"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)
    created_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # Null when the check was for the person who ran it.
    family_member_id = Column(
        UUID(as_uuid=False), ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Name at the time of the check, so history still reads right if the member is removed.
    subject_name = Column(String(80), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    symptoms = Column(JSON, nullable=False)  # symptom ids
    predictions = Column(JSON, nullable=False)  # [{disease, label, probability}]
    urgency = Column(String(10), nullable=False)
    urgency_reasons = Column(JSON, nullable=False)
    medplum_risk_assessment_id = Column(String, nullable=True)

    created_by = relationship("UserModel", foreign_keys=[created_by_id])
    family_member = relationship("FamilyMemberModel", foreign_keys=[family_member_id])
