"""Add user table

Revision ID: cb940614ee73
Revises: c0e4e798eb24
Create Date: 2026-09-18 16:48:13.752417

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'cb940614ee73'
down_revision: Union[str, Sequence[str], None] = 'c0e4e798eb24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("first_name", sa.String(length=24), nullable=False),
        sa.Column("last_name", sa.String(length=24), nullable=False),
        sa.Column("email", sa.String(length=50), nullable=False),
        sa.Column("number", sa.String(length=15), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("avatar", sa.String(), nullable=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("date_of_birth", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("id_doctor", sa.Boolean(), nullable=False),
        sa.Column("medplum_patient_id", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_number", "users", ["number"])
    op.create_index("ix_users_medplum_patient_id", "users", ["medplum_patient_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_users_medplum_patient_id", table_name="users")
    op.drop_index("ix_users_number", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
