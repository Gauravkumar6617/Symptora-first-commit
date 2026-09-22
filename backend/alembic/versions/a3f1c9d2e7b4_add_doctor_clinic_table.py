"""add doctor_clinic join table

Revision ID: a3f1c9d2e7b4
Revises: 2677d0603853
Create Date: 2026-09-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1c9d2e7b4'
down_revision: Union[str, Sequence[str], None] = '2677d0603853'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('doctor_clinic',
    sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('doctor_profile_id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('clinic_id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('medplum_practitioner_role_id', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['clinic_id'], ['clinic.id'], ),
    sa.ForeignKeyConstraint(['doctor_profile_id'], ['doctor_profiles.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('doctor_profile_id', 'clinic_id', name='uq_doctor_clinic_doctor_profile_id_clinic_id')
    )
    op.create_index(op.f('ix_doctor_clinic_id'), 'doctor_clinic', ['id'], unique=False)
    op.create_index(op.f('ix_doctor_clinic_doctor_profile_id'), 'doctor_clinic', ['doctor_profile_id'], unique=False)
    op.create_index(op.f('ix_doctor_clinic_clinic_id'), 'doctor_clinic', ['clinic_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_doctor_clinic_clinic_id'), table_name='doctor_clinic')
    op.drop_index(op.f('ix_doctor_clinic_doctor_profile_id'), table_name='doctor_clinic')
    op.drop_index(op.f('ix_doctor_clinic_id'), table_name='doctor_clinic')
    op.drop_table('doctor_clinic')
