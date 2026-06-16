from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT

revision = 'b7c9a8f6d4e2'
down_revision = 'ae9aa1ccee9e'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'candidatos',
        'foto_url',
        existing_type=sa.String(length=255),
        type_=sa.Text().with_variant(LONGTEXT(), 'mysql'),
        existing_nullable=True
    )
    op.alter_column(
        'empresas',
        'logo_url',
        existing_type=sa.String(length=255),
        type_=sa.Text().with_variant(LONGTEXT(), 'mysql'),
        existing_nullable=True
    )


def downgrade():
    op.alter_column(
        'candidatos',
        'foto_url',
        existing_type=sa.Text().with_variant(LONGTEXT(), 'mysql'),
        type_=sa.String(length=255),
        existing_nullable=True
    )
    op.alter_column(
        'empresas',
        'logo_url',
        existing_type=sa.Text().with_variant(LONGTEXT(), 'mysql'),
        type_=sa.String(length=255),
        existing_nullable=True
    )
