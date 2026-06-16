



import pytest
import json
import sys
import os


sys.path.insert(0, os.path.dirname(__file__))

from app_novo import app

class TestFlaskAPI:


    def setup_method(self):

        self.app = app
        self.client = app.test_client()
        self.app.config['TESTING'] = True

    def test_health_endpoint(self):

        response = self.client.get('/')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['status'] == 'ok'
        assert data['servico'] == 'análise de currículo'
        assert 'version' in data

    def test_analisar_endpoint_success(self):

        payload = {
            'curriculo_texto': 'Python developer with 5 years of experience in SQL and Django',
            'vaga_requisitos': ['Python', 'SQL', 'Django']
        }

        response = self.client.post('/api/analisar', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'compatibilidade_pct' in data
        assert 'skills_encontrados' in data
        assert 'skills_faltando' in data
        assert isinstance(data['compatibilidade_pct'], (int, float))

    def test_analisar_endpoint_empty_payload(self):

        response = self.client.post('/api/analisar', 
                                 data='',
                                 content_type='application/json')

        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Corpo da requisição vazio'

    def test_analisar_endpoint_missing_curriculo(self):

        payload = {'vaga_requisitos': ['Python', 'SQL']}

        response = self.client.post('/api/analisar', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data
        assert 'curriculo_texto é obrigatório' in data['error']

    def test_analisar_endpoint_invalid_requisitos(self):

        payload = {
            'curriculo_texto': 'Python developer',
            'vaga_requisitos': 'Python, SQL'  
        }

        response = self.client.post('/api/analisar', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data
        assert 'vaga_requisitos deve ser uma lista' in data['error']

    def test_extrair_skills_endpoint(self):

        payload = {
            'curriculo_texto': 'Experienced in Python, Java, Django, React, SQL, and MongoDB'
        }

        response = self.client.post('/api/extrair-skills', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'skills' in data
        assert 'total' in data
        assert isinstance(data['skills'], list)
        assert len(data['skills']) > 0

    def test_extrair_skills_empty_text(self):

        payload = {'curriculo_texto': ''}

        response = self.client.post('/api/extrair-skills', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data
        assert 'curriculo_texto é obrigatório' in data['error']

    def test_extrair_experiencia_endpoint(self):

        payload = {
            'curriculo_texto': 'Software Engineer with 7 years of experience in web development'
        }

        response = self.client.post('/api/extrair-experiencia', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'anos_experiencia' in data
        assert isinstance(data['anos_experiencia'], (int, float))

    def test_extrair_educacao_endpoint(self):

        payload = {
            'curriculo_texto': 'Bachelor in Computer Science, Master in Data Science'
        }

        response = self.client.post('/api/extrair-educacao', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'educacao' in data
        assert 'nivel_maximo' in data
        assert isinstance(data['educacao'], list)

    def test_extrair_tudo_endpoint(self):

        payload = {
            'curriculo_texto': 'Python developer with 5 years experience. Bachelor in CS. Skills: Python, SQL, Django.',
            'vaga_requisitos': ['Python', 'SQL']
        }

        response = self.client.post('/api/extrair-tudo', 
                                 data=json.dumps(payload),
                                 content_type='application/json')

        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'skills' in data
        assert 'experiencia_anos' in data
        assert 'educacao' in data
        assert 'palavras_chave' in data
        assert 'analise_compatibilidade' in data

    def test_404_endpoint(self):

        response = self.client.get('/endpoint-inexistente')
        assert response.status_code == 404

        data = json.loads(response.data)
        assert 'error' in data
        assert 'Endpoint não encontrado' in data['error']

    def test_405_method_not_allowed(self):

        response = self.client.get('/api/analisar')
        assert response.status_code == 405

        data = json.loads(response.data)
        assert 'error' in data
        assert 'Método HTTP não permitido' in data['error']

if __name__ == '__main__':
    pytest.main([__file__, '-v'])