"""add messages, prescriptions, and symptom-check escalation link

Revision ID: bdac6d14da54
Revises: 87a644eb618d
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bdac6d14da54'
down_revision: Union[str, Sequence[str], None] = '87a644eb618d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'telemedicine_consultations', sa.Column('symptom_check_id', sa.UUID(as_uuid=False), nullable=True)
    )
    op.create_index(
        op.f('ix_telemedicine_consultations_symptom_check_id'),
        'telemedicine_consultations', ['symptom_check_id'], unique=False,
    )
    op.create_foreign_key(
        'fk_telemedicine_consultations_symptom_check_id',
        'telemedicine_consultations', 'symptom_checks', ['symptom_check_id'], ['id'],
    )

    op.create_table(
        'messages',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('appointment_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('consultation_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('sender_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.ForeignKeyConstraint(['consultation_id'], ['telemedicine_consultations.id']),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.create_index(op.f('ix_messages_appointment_id'), 'messages', ['appointment_id'], unique=False)
    op.create_index(op.f('ix_messages_consultation_id'), 'messages', ['consultation_id'], unique=False)
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)

    op.create_table(
        'prescriptions',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('appointment_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('consultation_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('doctor_profile_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('patient_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('family_member_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('medications', sa.JSON(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('medplum_medication_request_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.ForeignKeyConstraint(['consultation_id'], ['telemedicine_consultations.id']),
        sa.ForeignKeyConstraint(['doctor_profile_id'], ['doctor_profiles.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_prescriptions_id'), 'prescriptions', ['id'], unique=False)
    op.create_index(op.f('ix_prescriptions_appointment_id'), 'prescriptions', ['appointment_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_consultation_id'), 'prescriptions', ['consultation_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_doctor_profile_id'), 'prescriptions', ['doctor_profile_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_family_member_id'), 'prescriptions', ['family_member_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_prescriptions_family_member_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_patient_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_doctor_profile_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_consultation_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_appointment_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_id'), table_name='prescriptions')
    op.drop_table('prescriptions')

    op.drop_index(op.f('ix_messages_sender_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_consultation_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_appointment_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')

    op.drop_constraint('fk_telemedicine_consultations_symptom_check_id', 'telemedicine_consultations', type_='foreignkey')
    op.drop_index(
        op.f('ix_telemedicine_consultations_symptom_check_id'), table_name='telemedicine_consultations'
    )
    op.drop_column('telemedicine_consultations', 'symptom_check_id')
