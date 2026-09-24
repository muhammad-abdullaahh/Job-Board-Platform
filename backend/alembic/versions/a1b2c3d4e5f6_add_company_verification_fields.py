"""Add company verification audit fields

Revision ID: a1b2c3d4e5f6
Revises: fe317b6c47ff
Create Date: 2026-08-28 16:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fe317b6c47ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('employee_count', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('hr_contact_email', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('cro_linkedin', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('registration_number', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'registration_number')
    op.drop_column('companies', 'cro_linkedin')
    op.drop_column('companies', 'hr_contact_email')
    op.drop_column('companies', 'employee_count')
