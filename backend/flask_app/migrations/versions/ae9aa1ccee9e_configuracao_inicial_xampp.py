






from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT



revision = 'ae9aa1ccee9e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():

    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('tipo', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('candidatos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('foto_url', sa.Text().with_variant(LONGTEXT(), 'mysql'), nullable=True),
    sa.Column('headline', sa.String(length=200), nullable=True),
    sa.Column('localizacao', sa.String(length=100), nullable=True),
    sa.Column('sobre', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('empresas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('logo_url', sa.Text().with_variant(LONGTEXT(), 'mysql'), nullable=True),
    sa.Column('setor', sa.String(length=100), nullable=True),
    sa.Column('localizacao', sa.String(length=100), nullable=True),
    sa.Column('sobre', sa.Text(), nullable=True),
    sa.Column('site_url', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('notificacoes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('tipo', sa.String(length=50), nullable=False),
    sa.Column('titulo', sa.String(length=200), nullable=False),
    sa.Column('mensagem', sa.Text(), nullable=True),
    sa.Column('link', sa.String(length=255), nullable=True),
    sa.Column('lida', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('curriculos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('candidato_id', sa.Integer(), nullable=False),
    sa.Column('experiencia', sa.JSON(), nullable=True),
    sa.Column('educacao', sa.JSON(), nullable=True),
    sa.Column('habilidades', sa.JSON(), nullable=True),
    sa.Column('idiomas', sa.JSON(), nullable=True),
    sa.Column('arquivo_url', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['candidato_id'], ['candidatos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('vagas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('titulo', sa.String(length=200), nullable=False),
    sa.Column('descricao', sa.Text(), nullable=True),
    sa.Column('requisitos', sa.JSON(), nullable=True),
    sa.Column('tipo_contrato', sa.String(length=50), nullable=True),
    sa.Column('localizacao', sa.String(length=100), nullable=True),
    sa.Column('salario_min', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('salario_max', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('ativa', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('vagas', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_vagas_ativa'), ['ativa'], unique=False)
        batch_op.create_index(batch_op.f('ix_vagas_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_vagas_empresa_id'), ['empresa_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_vagas_id'), ['id'], unique=False)

    op.create_table('candidaturas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('vaga_id', sa.Integer(), nullable=False),
    sa.Column('candidato_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('score_analise', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('feedback', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['candidato_id'], ['candidatos.id'], ),
    sa.ForeignKeyConstraint(['vaga_id'], ['vagas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('posts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('conteudo', sa.Text(), nullable=False),
    sa.Column('candidato_id', sa.Integer(), nullable=True),
    sa.Column('empresa_id', sa.Integer(), nullable=True),
    sa.Column('tipo', sa.String(length=50), nullable=True),
    sa.Column('vaga_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['candidato_id'], ['candidatos.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.ForeignKeyConstraint(['vaga_id'], ['vagas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )



def downgrade():

    op.drop_table('posts')
    op.drop_table('candidaturas')
    with op.batch_alter_table('vagas', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_vagas_id'))
        batch_op.drop_index(batch_op.f('ix_vagas_empresa_id'))
        batch_op.drop_index(batch_op.f('ix_vagas_created_at'))
        batch_op.drop_index(batch_op.f('ix_vagas_ativa'))

    op.drop_table('vagas')
    op.drop_table('curriculos')
    op.drop_table('notificacoes')
    op.drop_table('empresas')
    op.drop_table('candidatos')
    op.drop_table('users')