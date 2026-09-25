"""add doctor profile status

Revision ID: 2677d0603853
Revises: 028f6c994f4b
Create Date: 2026-09-22 13:00:42.983832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2677d0603853'
down_revision: Union[str, Sequence[str], None] = '028f6c994f4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


doctor_profile_status = sa.Enum(
    "PENDING", "APPROVED", "REJECTED", name="doctor_profile_status"
)


def upgrade() -> None:
    """Upgrade schema."""
    doctor_profile_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'doctor_profiles',
        sa.Column('status', doctor_profile_status, server_default='PENDING', nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('doctor_profiles', 'status')
    doctor_profile_status.drop(op.get_bind(), checkfirst=True)
