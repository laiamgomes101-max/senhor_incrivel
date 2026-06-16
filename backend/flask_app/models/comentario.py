from extensions import db

class Comentario(db.Model):
    __tablename__ = 'comentarios'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'))
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'))
    conteudo = db.Column(db.Text, nullable=False)
    comentario_pai_id = db.Column(db.Integer, db.ForeignKey('comentarios.id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    # Relacionamentos
    post = db.relationship('Post', backref=db.backref('comentarios', lazy='dynamic', cascade='all, delete-orphan'))
    candidato = db.relationship('Candidato', backref=db.backref('comentarios', lazy='dynamic'))
    empresa = db.relationship('Empresa', backref=db.backref('comentarios', lazy='dynamic'))
    
    # Auto-relacionamento para respostas
    respostas = db.relationship(
        'Comentario',
        remote_side=[id],
        backref=db.backref('comentario_pai', remote_side=[comentario_pai_id]),
        cascade='all, delete-orphan',
        single_parent=True
    )
    curtidas_comentario = db.relationship('CurtidaComentario', backref='comentario', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def autor(self):
        return self.candidato or self.empresa

    @property
    def autor_id_relacionado(self):
        return self.candidato_id or self.empresa_id

    @property
    def tipo_autor(self):
        return 'candidato' if self.candidato_id else 'empresa'

    @property
    def total_curtidas(self):
        return self.curtidas_comentario.count()

    def serializar(self):
        return {
            'id': self.id,
            'conteudo': self.conteudo,
            'autor': {
                'id': self.autor.id,
                'nome': self.autor.nome,
                'tipo': self.tipo_autor,
                'foto': getattr(self.autor, 'foto_url', None) or getattr(self.autor, 'logo_url', None)
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'curtidas': self.total_curtidas
        }


class CurtidaComentario(db.Model):
    __tablename__ = 'curtidas_comentarios'

    id = db.Column(db.Integer, primary_key=True)
    comentario_id = db.Column(db.Integer, db.ForeignKey('comentarios.id'), nullable=False)
    candidato_id = db.Column(db.Integer, db.ForeignKey('candidatos.id'))
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    candidato = db.relationship('Candidato')
    empresa = db.relationship('Empresa')

    __table_args__ = (db.UniqueConstraint('comentario_id', 'candidato_id', 'empresa_id', name='uq_comentario_candidato_empresa'),)
