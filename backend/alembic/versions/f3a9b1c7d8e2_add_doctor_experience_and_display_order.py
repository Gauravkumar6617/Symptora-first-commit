"""add doctor experience, languages, and display order

Revision ID: f3a9b1c7d8e2
Revises: e5f6a7b8c9d0
Create Date: 2026-09-28 00:00:00.000005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a9b1c7d8e2'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('doctor_profiles', sa.Column('years_of_practice', sa.Integer(), nullable=True))
    op.add_column('doctor_profiles', sa.Column('languages', sa.String(255), nullable=True))
    op.add_column('doctor_profiles', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('services', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('services', 'display_order')
    op.drop_column('doctor_profiles', 'display_order')
    op.drop_column('doctor_profiles', 'languages')
    op.drop_column('doctor_profiles', 'years_of_practice')
