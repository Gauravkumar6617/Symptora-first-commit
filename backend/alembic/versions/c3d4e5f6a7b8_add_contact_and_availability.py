"""add clinic/doctor contact fields and clinic_availability table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-28 00:00:00.000002

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('clinic', sa.Column('contact_person_name', sa.String(length=100), nullable=True))
    op.add_column('clinic', sa.Column('contact_email', sa.String(length=120), nullable=True))
    op.add_column('clinic', sa.Column('contact_phone', sa.String(length=30), nullable=True))

    op.add_column('doctor_profiles', sa.Column('contact_person_name', sa.String(length=100), nullable=True))
    op.add_column('doctor_profiles', sa.Column('contact_email', sa.String(length=120), nullable=True))
    op.add_column('doctor_profiles', sa.Column('contact_phone', sa.String(length=30), nullable=True))

    op.create_table(
        'clinic_availability',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('clinic_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('days', postgresql.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', name='dayofweek', create_type=False), nullable=False),
        sa.Column('slot', postgresql.ENUM('AM', 'PM', name='timeslot', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinic.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_clinic_availability_id'), 'clinic_availability', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_clinic_availability_id'), table_name='clinic_availability')
    op.drop_table('clinic_availability')

    op.drop_column('doctor_profiles', 'contact_phone')
    op.drop_column('doctor_profiles', 'contact_email')
    op.drop_column('doctor_profiles', 'contact_person_name')

    op.drop_column('clinic', 'contact_phone')
    op.drop_column('clinic', 'contact_email')
    op.drop_column('clinic', 'contact_person_name')
