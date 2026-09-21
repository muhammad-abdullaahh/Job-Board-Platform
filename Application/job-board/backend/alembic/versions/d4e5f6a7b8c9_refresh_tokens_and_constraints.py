"""Add refresh_tokens table and database check constraints

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-21 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token_id')
    )
    op.create_index(op.f('ix_refresh_tokens_token_id'), 'refresh_tokens', ['token_id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_refresh_tokens_active "
        "ON refresh_tokens (user_id, expires_at) "
        "WHERE revoked_at IS NULL"
    )

    # 2. Add check constraints on users and jobs
    op.create_check_constraint(
        'chk_user_years_experience',
        'users',
        'years_experience >= 0'
    )
    op.create_check_constraint(
        'chk_job_salary_min',
        'jobs',
        'salary_min IS NULL OR salary_min >= 0'
    )
    op.create_check_constraint(
        'chk_job_salary_max',
        'jobs',
        'salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min'
    )


def downgrade() -> None:
    op.drop_constraint('chk_job_salary_max', 'jobs', type_='check')
    op.drop_constraint('chk_job_salary_min', 'jobs', type_='check')
    op.drop_constraint('chk_user_years_experience', 'users', type_='check')
    op.execute("DROP INDEX IF EXISTS ix_refresh_tokens_active")
    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_token_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
