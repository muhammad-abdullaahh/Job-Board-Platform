"""Add created_by to companies table
Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-08 11:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True))
    op.create_index(op.f('ix_companies_created_by'), 'companies', ['created_by'], unique=False)
    # Backfill created_by from updated_by for existing companies
    op.execute("UPDATE companies SET created_by = updated_by WHERE created_by IS NULL AND updated_by IS NOT NULL")


def downgrade() -> None:
    op.drop_index(op.f('ix_companies_created_by'), table_name='companies')
    op.drop_column('companies', 'created_by')
