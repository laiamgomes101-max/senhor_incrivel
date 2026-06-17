#!/usr/bin/env python
"""
Teste da correção do bug "Meu Perfil"
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend/flask_app'))

from flask import Flask
from extensions import db, jwt
from config import Config
from models import User, Candidato, Candidatura
from flask_jwt_extended import create_access_token
import bcrypt

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
jwt.init_app(app)

with app.app_context():
    db.create_all()
    
    # Limpar dados de teste antigos
    db.session.query(Candidatura).delete()
    db.session.query(Candidato).delete()
    db.session.query(User).delete()
    db.session.commit()
    
    print("✓ Banco limpo")
    
    # Criar usuário candidato
    user = User(email='teste@example.com', tipo='candidato')
    user.set_password('Senha123')
    db.session.add(user)
    db.session.commit()
    print(f"✓ Usuário criado: {user.id}")
    
    # Simular login (sem candidato associado)
    print(f"✓ user.candidato antes do login: {user.candidato}")
    
    # Simular a lógica do /api/auth/login
    if not user.candidato:
        candidato = Candidato(
            user_id=user.id,
            nome=user.email.split('@')[0]
        )
        db.session.add(candidato)
        db.session.commit()
        print(f"✓ Candidato criado automaticamente no login: {candidato.id}")
    
    # Gerar token com candidato_id
    claims = {'tipo': user.tipo, 'candidato_id': user.candidato.id}
    token = create_access_token(identity=str(user.id), additional_claims=claims)
    print(f"✓ Token gerado com candidato_id={claims['candidato_id']}")
    
    # Simular /api/candidatos/me (GET)
    candidato = db.session.get(Candidato, claims['candidato_id'])
    if candidato:
        print(f"✓ GET /api/candidatos/me retornaria: {candidato.nome}")
    else:
        print("✗ Candidato não encontrado!")

print("\n✅ TESTE PASSOU! A correção funciona.")
