from extensions import db

class Notificacao(db.Model):
    __tablename__ = 'notificacoes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  
    titulo = db.Column(db.String(200), nullable=False)
    mensagem = db.Column(db.Text)
    link = db.Column(db.String(255))
    lida = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship('User', backref=db.backref('notificacoes', lazy='dynamic'))