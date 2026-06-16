from extensions import db
from datetime import datetime

class Curtida(db.Model):
    __tablename__ = 'curtidas'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'))
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relacionamentos
    post = db.relationship('Post', backref=db.backref('curtidas', lazy='dynamic', cascade='all, delete-orphan'))
    candidato = db.relationship('Candidato', backref=db.backref('curtidas', lazy='dynamic'))
    empresa = db.relationship('Empresa', backref=db.backref('curtidas', lazy='dynamic'))

    @property
    def autor(self):
        return self.candidato or self.empresa

    @property
    def autor_id_relacionado(self):
        return self.candidato_id or self.empresa_id

    @property
    def tipo_autor(self):
        return 'candidato' if self.candidato_id else 'empresa'

    __table_args__ = (db.UniqueConstraint('post_id', 'candidato_id', 'empresa_id', name='uq_post_candidato_empresa'),)
