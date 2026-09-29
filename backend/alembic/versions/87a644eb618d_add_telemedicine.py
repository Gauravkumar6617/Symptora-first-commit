"""add telemedicine consultations + medplum appointment id

Revision ID: 87a644eb618d
Revises: f3a9b1c7d8e2
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87a644eb618d'
down_revision: Union[str, Sequence[str], None] = 'f3a9b1c7d8e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('appointments', sa.Column('medplum_appointment_id', sa.String(), nullable=True))

    op.create_table(
        'telemedicine_consultations',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('patient_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('family_member_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('doctor_profile_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='consultation_status'),
            nullable=False,
            server_default='PENDING',
        ),
        sa.Column(
            'trigger',
            sa.Enum('AUTO_ESCALATION', 'MANUAL_BOOKING', name='consultation_trigger'),
            nullable=False,
            server_default='MANUAL_BOOKING',
        ),
        sa.Column('medplum_encounter_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id']),
        sa.ForeignKeyConstraint(['doctor_profile_id'], ['doctor_profiles.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_telemedicine_consultations_id'), 'telemedicine_consultations', ['id'], unique=False
    )
    op.create_index(
        op.f('ix_telemedicine_consultations_patient_id'), 'telemedicine_consultations', ['patient_id'], unique=False
    )
    op.create_index(
        op.f('ix_telemedicine_consultations_family_member_id'),
        'telemedicine_consultations', ['family_member_id'], unique=False,
    )
    op.create_index(
        op.f('ix_telemedicine_consultations_doctor_profile_id'),
        'telemedicine_consultations', ['doctor_profile_id'], unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_telemedicine_consultations_doctor_profile_id'), table_name='telemedicine_consultations')
    op.drop_index(op.f('ix_telemedicine_consultations_family_member_id'), table_name='telemedicine_consultations')
    op.drop_index(op.f('ix_telemedicine_consultations_patient_id'), table_name='telemedicine_consultations')
    op.drop_index(op.f('ix_telemedicine_consultations_id'), table_name='telemedicine_consultations')
    op.drop_table('telemedicine_consultations')
    sa.Enum(name='consultation_trigger').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='consultation_status').drop(op.get_bind(), checkfirst=True)
    op.drop_column('appointments', 'medplum_appointment_id')
