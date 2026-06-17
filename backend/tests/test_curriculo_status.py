import io
import pytest
from flask import Flask

from extensions import db, jwt

from routes.curriculos import curriculos_bp
from routes.notificacoes import notificacoes_bp
from routes.auth import auth_bp

from models import User, Empresa, Candidato, Curriculo, Notificacao
from flask_jwt_extended import create_access_token


def create_test_app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'x' * 32
    app.config['JWT_SECRET_KEY'] = 'y' * 32
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(curriculos_bp, url_prefix='/api/curriculos')
    app.register_blueprint(notificacoes_bp, url_prefix='/api/notificacoes')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app


@pytest.fixture
def client():
    app = create_test_app()
    with app.app_context():
        db.create_all()
        yield app.test_client()


def test_update_curriculo_status_and_notification(client):
    # criar empresa/usuario/candidato/curriculo
    u = User(email='emp@test.com', tipo='empresa')
    u.set_password('pass1234')
    db.session.add(u)
    db.session.flush()

    empresa = Empresa(user_id=u.id, nome='Empresa Teste')
    db.session.add(empresa)
    db.session.flush()

    # criar candidato
    uc = User(email='cand@test.com', tipo='candidato')
    uc.set_password('pass1234')
    db.session.add(uc)
    db.session.flush()
    cand = Candidato(user_id=uc.id, nome='Candidato Teste')
    db.session.add(cand)
    db.session.flush()

    curr = Curriculo(candidato_id=cand.id)
    db.session.add(curr)
    db.session.commit()

    # gerar token de empresa
    token = create_access_token(identity=str(u.id), additional_claims={'tipo': 'empresa', 'empresa_id': empresa.id})

    # chamar endpoint para aprovar
    rv = client.put(f'/api/curriculos/{curr.id}/status', json={'status': 'aprovado'}, headers={'Authorization': f'Bearer {token}'})
    assert rv.status_code == 200
    data = rv.get_json()
    assert data.get('message') == 'Status do currículo atualizado'

    # verificar no banco
    updated = db.session.get(Curriculo, curr.id)
    assert updated.status_resultado == 'aprovado'

    # notificação criada
    nots = db.session.execute(db.select(Notificacao).where(Notificacao.user_id == cand.user_id)).scalars().all()
    assert len(nots) >= 1


def test_ia_upload_rejects_non_pdf(client):
    # criar usuário candidato e token
    u = User(email='cand2@test.com', tipo='candidato')
    u.set_password('pass1234')
    db.session.add(u)
    db.session.flush()
    cand = Candidato(user_id=u.id, nome='C2')
    db.session.add(cand)
    db.session.commit()

    token = create_access_token(identity=str(u.id), additional_claims={'tipo': 'candidato', 'candidato_id': cand.id})

    data = {
        'files': (io.BytesIO(b'hello world'), 'file.txt')
    }

    rv = client.post('/api/curriculos/ia/upload', content_type='multipart/form-data', data=data, headers={'Authorization': f'Bearer {token}'})
    assert rv.status_code == 400 or rv.status_code == 415
    j = rv.get_json()
    assert j is not None
    assert 'Arquivo' in (j.get('error') or j.get('message') or '')
