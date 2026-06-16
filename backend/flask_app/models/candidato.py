from extensions import db
from sqlalchemy.dialects.mysql import LONGTEXT

class Candidato(db.Model):
    __tablename__ = 'candidatos'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    foto_url = db.Column(db.Text().with_variant(LONGTEXT(), 'mysql'))
    headline = db.Column(db.String(200))
    localizacao = db.Column(db.String(100))
    sobre = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    user = db.relationship('User', backref=db.backref('candidato', uselist=False))
    curriculo = db.relationship('Curriculo', backref='candidato', uselist=False)
    candidaturas = db.relationship('Candidatura', backref='candidato', lazy='dynamic')
    posts = db.relationship('Post', backref='autor_candidato', lazy='dynamic')


class Curriculo(db.Model):
    __tablename__ = 'curriculos'

    id = db.Column(db.Integer, primary_key=True)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'), nullable=False)
    experiencia = db.Column(db.JSON)  
    educacao = db.Column(db.JSON)  
    habilidades = db.Column(db.JSON)  
    idiomas = db.Column(db.JSON)  
    certificados = db.Column(db.JSON)  # Novo campo para certificados
    arquivo_url = db.Column(db.String(255))  
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())