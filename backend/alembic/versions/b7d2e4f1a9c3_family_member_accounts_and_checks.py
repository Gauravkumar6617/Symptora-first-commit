"""family member accounts, medplum ids and saved symptom checks

Revision ID: b7d2e4f1a9c3
Revises: a3f1c9d2e7b4
Create Date: 2026-09-25 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d2e4f1a9c3'
down_revision: Union[str, Sequence[str], None] = 'a3f1c9d2e7b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Email was unique across every account and capped at 40 characters.
    op.drop_constraint('family_members_email_key', 'family_members', type_='unique')
    op.alter_column('family_members', 'email', type_=sa.String(length=255), existing_nullable=True)
    op.create_index(op.f('ix_family_members_email'), 'family_members', ['email'], unique=False)
    op.add_column('family_members', sa.Column('number', sa.String(length=15), nullable=True))
    op.add_column('family_members', sa.Column('medplum_patient_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_family_members_medplum_patient_id'), 'family_members', ['medplum_patient_id'], unique=False)
    op.add_column('family_members', sa.Column('linked_user_id', sa.UUID(as_uuid=False), nullable=True))
    op.create_index(op.f('ix_family_members_linked_user_id'), 'family_members', ['linked_user_id'], unique=False)
    op.create_foreign_key(
        'family_members_linked_user_id_fkey', 'family_members', 'users',
        ['linked_user_id'], ['id'], ondelete='SET NULL',
    )

    op.create_table('symptom_checks',
    sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('created_by_id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('family_member_id', sa.UUID(as_uuid=False), nullable=True),
    sa.Column('subject_name', sa.String(length=80), nullable=False),
    sa.Column('age', sa.Integer(), nullable=True),
    sa.Column('gender', sa.String(), nullable=True),
    sa.Column('duration', sa.String(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('symptoms', sa.JSON(), nullable=False),
    sa.Column('predictions', sa.JSON(), nullable=False),
    sa.Column('urgency', sa.String(length=10), nullable=False),
    sa.Column('urgency_reasons', sa.JSON(), nullable=False),
    sa.Column('medplum_risk_assessment_id', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_symptom_checks_id'), 'symptom_checks', ['id'], unique=False)
    op.create_index(op.f('ix_symptom_checks_created_by_id'), 'symptom_checks', ['created_by_id'], unique=False)
    op.create_index(op.f('ix_symptom_checks_family_member_id'), 'symptom_checks', ['family_member_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_symptom_checks_family_member_id'), table_name='symptom_checks')
    op.drop_index(op.f('ix_symptom_checks_created_by_id'), table_name='symptom_checks')
    op.drop_index(op.f('ix_symptom_checks_id'), table_name='symptom_checks')
    op.drop_table('symptom_checks')
    op.drop_constraint('family_members_linked_user_id_fkey', 'family_members', type_='foreignkey')
    op.drop_index(op.f('ix_family_members_linked_user_id'), table_name='family_members')
    op.drop_column('family_members', 'linked_user_id')
    op.drop_index(op.f('ix_family_members_medplum_patient_id'), table_name='family_members')
    op.drop_column('family_members', 'medplum_patient_id')
    op.drop_column('family_members', 'number')
    op.drop_index(op.f('ix_family_members_email'), table_name='family_members')
    op.alter_column('family_members', 'email', type_=sa.String(length=40), existing_nullable=True)
    op.create_unique_constraint('family_members_email_key', 'family_members', ['email'])
