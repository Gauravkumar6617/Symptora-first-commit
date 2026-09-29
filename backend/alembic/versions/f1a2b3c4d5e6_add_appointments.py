"""add appointments table

Revision ID: f1a2b3c4d5e6
Revises: d4a8c2f6e1b9
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd4a8c2f6e1b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'appointments',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('patient_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('family_member_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('doctor_profile_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('clinic_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('patient_name', sa.String(length=80), nullable=False),
        sa.Column('patient_email', sa.String(length=100), nullable=False),
        sa.Column('patient_phone', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('appointment_date', sa.Date(), nullable=False),
        # 'timeslot' enum type already exists (created for doctor_availability) — reuse it.
        # Plain sa.Enum(create_type=False) doesn't reliably suppress CREATE TYPE
        # here since alembic's create_table calls with checkfirst=False; the
        # postgres-specific ENUM does honor create_type regardless.
        sa.Column('slot', postgresql.ENUM('AM', 'PM', name='timeslot', create_type=False), nullable=False),
        sa.Column(
            'status',
            sa.Enum('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', name='appointment_status'),
            nullable=False,
            server_default='SCHEDULED',
        ),
        sa.Column('meet_link', sa.String(), nullable=True),
        sa.Column('google_event_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id']),
        sa.ForeignKeyConstraint(['doctor_profile_id'], ['doctor_profiles.id']),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinic.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_appointments_id'), 'appointments', ['id'], unique=False)
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_family_member_id'), 'appointments', ['family_member_id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_profile_id'), 'appointments', ['doctor_profile_id'], unique=False)
    op.create_index(op.f('ix_appointments_clinic_id'), 'appointments', ['clinic_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_appointments_clinic_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_doctor_profile_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_family_member_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_id'), table_name='appointments')
    op.drop_table('appointments')
    sa.Enum(name='appointment_status').drop(op.get_bind(), checkfirst=True)
