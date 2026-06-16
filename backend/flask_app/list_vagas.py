from app import app
from extensions import db
from models import Vaga

with app.app_context():
    vagas = db.session.query(Vaga).all()
    print('found', len(vagas), 'vagas')
    for v in vagas:
        print('id', v.id, 'empresa_id', v.empresa_id, 'titulo', v.titulo)