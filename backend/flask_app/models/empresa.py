from extensions import db
from sqlalchemy.dialects.mysql import LONGTEXT

class Empresa(db.Model):
    __tablename__ = 'empresas'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    logo_url = db.Column(db.Text().with_variant(LONGTEXT(), 'mysql'))
    setor = db.Column(db.String(100))
    localizacao = db.Column(db.String(100))
    sobre = db.Column(db.Text)
    site_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    user = db.relationship('User', backref=db.backref('empresa', uselist=False))
    vagas = db.relationship('Vaga', backref='empresa', lazy='dynamic')
    posts = db.relationship('Post', backref='autor_empresa', lazy='dynamic')


class Vaga(db.Model):
    __tablename__ = 'vagas'

    id = db.Column(db.Integer, primary_key=True, index=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False, index=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    requisitos = db.Column(db.JSON)  
    tipo_contrato = db.Column(db.String(50))  
    localizacao = db.Column(db.String(100))
    salario_min = db.Column(db.Numeric(10, 2))
    salario_max = db.Column(db.Numeric(10, 2))
    ativa = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    candidaturas = db.relationship('Candidatura', backref='vaga', lazy='dynamic')


class Candidatura(db.Model):
    __tablename__ = 'candidaturas'

    id = db.Column(db.Integer, primary_key=True)
    vaga_id = db.Column(db.Integer, db.ForeignKey('vagas.id'), nullable=False)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'), nullable=False)
    status = db.Column(db.String(50), default='pendente')  
    score_analise = db.Column(db.Numeric(5, 2))  
    feedback = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())