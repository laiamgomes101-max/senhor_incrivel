import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'flask_app')))

from app import app

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client


def test_analyze_profile_endpoint_requires_auth(client):
    response = client.post('/api/curriculos/ia/analyze-profile', json={'profile': {}})
    assert response.status_code == 401


def test_analyze_profile_endpoint_returns_analysis_with_token(client):
    # Cria token falso de candidato para permitir rota JWT
    with app.app_context():
        from flask_jwt_extended import create_access_token
        token = create_access_token(identity=1, additional_claims={'tipo': 'candidato', 'candidato_id': 1})

    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/api/curriculos/ia/analyze-profile', headers=headers, json={
        'profile': {
            'curriculo': {
                'habilidades': ['React', 'Python'],
                'idiomas': ['Inglês'],
                'experiencia': [{'titulo': 'Desenvolvedor Frontend', 'empresa': 'Empresa X'}],
                'educacao': ['Bacharel em Sistemas']
            },
            'headline': 'Desenvolvedor Frontend',
            'sobre': 'Tenho experiência em aplicações web.'
        }
    })

    assert response.status_code == 200
    data = response.get_json()
    assert 'analysis' in data
    assert 'suggestions' in data
    assert isinstance(data['suggestions'], list)
