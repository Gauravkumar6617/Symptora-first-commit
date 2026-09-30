"""add notifications and telemedicine payment

Revision ID: c9e1f2a3b4d5
Revises: bdac6d14da54
Create Date: 2026-09-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9e1f2a3b4d5'
down_revision: Union[str, Sequence[str], None] = 'bdac6d14da54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('telemedicine_consultations', sa.Column('amount', sa.Integer(), nullable=True))
    op.add_column('telemedicine_consultations', sa.Column('payment_ref', sa.String(length=100), nullable=True))
    op.add_column('telemedicine_consultations', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))
    # Consultations from before payment existed count as paid, so they stay in the queue.
    op.execute("UPDATE telemedicine_consultations SET paid_at = created_at")

    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.String(length=500), nullable=False),
        sa.Column('link', sa.String(length=255), nullable=True),
        sa.Column('read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_column('telemedicine_consultations', 'paid_at')
    op.drop_column('telemedicine_consultations', 'payment_ref')
    op.drop_column('telemedicine_consultations', 'amount')
