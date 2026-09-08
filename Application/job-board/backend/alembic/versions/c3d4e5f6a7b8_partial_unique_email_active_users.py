"""Replace global unique email with partial unique index for active users

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-08 18:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop existing global unique constraint and indexes on users.email
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key")
    op.execute("DROP INDEX IF EXISTS ix_users_email")
    op.execute("DROP INDEX IF EXISTS idx_users_email")

    # 2. Create standard non-unique index on email for general lookup performance
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")

    # 3. Create partial unique index on lower(email) for active users only
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique "
        "ON users (lower(email)) "
        "WHERE deleted_at IS NULL"
    )


def downgrade() -> None:
    # 1. Drop the partial unique index
    op.execute("DROP INDEX IF EXISTS users_email_active_unique")
    op.execute("DROP INDEX IF EXISTS ix_users_email")

    # 2. Re-create global unique constraint/index on email
    op.execute("ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")
