"""add status_resultado to curriculos

Revision ID: d1a2b3c4d5e6
Revises: c8f7d6e5a9b1
Create Date: 2026-06-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd1a2b3c4d5e6'
down_revision = 'c8f7d6e5a9b1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('curriculos', sa.Column('status_resultado', sa.String(length=20), server_default='pendente', nullable=True))
    op.add_column('curriculos', sa.Column('status_motivo', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('curriculos', 'status_motivo')
    op.drop_column('curriculos', 'status_resultado')
