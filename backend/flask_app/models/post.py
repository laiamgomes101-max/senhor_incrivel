from extensions import db

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    conteudo = db.Column(db.Text, nullable=False)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'))
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'))
    tipo = db.Column(db.String(50), default='texto')  
    vaga_id = db.Column(db.Integer, db.ForeignKey('vagas.id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    @property
    def autor(self):
        if self.candidato_id:
            return self.autor_candidato
        return self.autor_empresa