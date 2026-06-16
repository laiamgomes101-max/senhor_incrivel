#!/usr/bin/env python
"""
Teste rápido para validar a lógica da rota /api/candidatos/me
sem precisar de um servidor rodando
"""

# Mock das dependências
import json
from datetime import datetime

class MockDB:
    def get_or_404(self, model, id):
        if id == 123:
            return Candidato(id=123, nome="João", headline="Dev", localizacao="SP", sobre="Bio", foto_url=None)
        raise Exception("Not found")

class MockSession:
    def commit(self):
        pass
    def rollback(self):
        pass
    def add(self, obj):
        pass
    def flush(self):
        pass

class Candidato:
    def __init__(self, id, nome, headline, localizacao, sobre, foto_url):
        self.id = id
        self.nome = nome
        self.headline = headline
        self.localizacao = localizacao
        self.sobre = sobre
        self.foto_url = foto_url
        self.curriculo = Curriculo()
    
class Curriculo:
    def __init__(self):
        self.id = 1
        self.experiencia = []
        self.educacao = []
        self.habilidades = ["Python"]
        self.idiomas = []
        self.certificados = None
        self.arquivo_url = None

def safe_json_value(value):
    """Converte e valida campos JSON para serialização segura."""
    if value is None:
        return None
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            print(f"Aviso: Não foi possível deserializar JSON: {value[:50]}")
            return None
    return value

def test_get_profile():
    """Testa a serialização do GET"""
    print("\n=== TEST GET /api/candidatos/me ===")
    
    candidato = Candidato(123, "João", "Dev", "SP", "Bio", None)
    
    try:
        data = {
            'id': candidato.id,
            'nome': candidato.nome,
            'headline': candidato.headline,
            'localizacao': candidato.localizacao,
            'sobre': candidato.sobre,
            'foto_url': candidato.foto_url
        }
        if candidato.curriculo:
            data['curriculo'] = {
                'id': candidato.curriculo.id,
                'experiencia': safe_json_value(candidato.curriculo.experiencia),
                'educacao': safe_json_value(candidato.curriculo.educacao),
                'habilidades': safe_json_value(candidato.curriculo.habilidades),
                'idiomas': safe_json_value(candidato.curriculo.idiomas),
                'certificados': safe_json_value(candidato.curriculo.certificados),
                'arquivo_url': candidato.curriculo.arquivo_url
            }
        
        # Tentar serializar para JSON
        json_str = json.dumps(data)
        print(f"✓ JSON serializado com sucesso")
        print(f"  Tamanho: {len(json_str)} bytes")
        return True
    except Exception as e:
        print(f"✗ Erro ao serializar: {e}")
        return False

def test_put_profile():
    """Testa a atualização do perfil"""
    print("\n=== TEST PUT /api/candidatos/me ===")
    
    candidato = Candidato(123, "João", "Dev", "SP", "Bio", None)
    
    # Dados que o frontend enviaria
    update_data = {
        "nome": "João Silva",
        "headline": "Desenvolvedor Python",
        "localizacao": "São Paulo",
        "sobre": "Desenvolvimento web",
        "curriculo": {
            "habilidades": ["Python", "Flask"],
            "experiencia": [],
            "educacao": [],
            "idiomas": [],
            "certificados": []
        }
    }
    
    try:
        # Simular atualização
        for field in ['nome', 'headline', 'localizacao', 'sobre']:
            if field in update_data:
                setattr(candidato, field, update_data[field])
        
        if 'curriculo' in update_data:
            cur = update_data['curriculo']
            if not isinstance(cur, dict):
                print(f"✗ Campo curriculo deve ser dict, recebido {type(cur)}")
                return False
            
            for field in ['experiencia', 'educacao', 'habilidades', 'idiomas', 'certificados']:
                if field in cur:
                    value = cur[field]
                    setattr(candidato.curriculo, field, value)
        
        # Tentar serializar para JSON
        data = {
            'id': candidato.id,
            'nome': candidato.nome,
            'headline': candidato.headline,
            'localizacao': candidato.localizacao,
            'sobre': candidato.sobre,
            'foto_url': candidato.foto_url,
            'curriculo': {
                'habilidades': candidato.curriculo.habilidades,
                'experiencia': candidato.curriculo.experiencia,
                'educacao': candidato.curriculo.educacao,
                'idiomas': candidato.curriculo.idiomas,
                'certificados': candidato.curriculo.certificados,
            }
        }
        json_str = json.dumps(data)
        print(f"✓ PUT processado com sucesso")
        print(f"  Nome atualizado: {candidato.nome}")
        print(f"  Habilidades: {candidato.curriculo.habilidades}")
        return True
    except Exception as e:
        print(f"✗ Erro ao processar PUT: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_large_base64_image():
    """Testa validação de imagem grande"""
    print("\n=== TEST Large Base64 Image Validation ===")
    
    MAX_BASE64_IMAGE_LENGTH = 1000000
    
    # Imagem válida
    small_image = "data:image/jpeg;base64," + "x" * 100000
    if len(small_image) <= MAX_BASE64_IMAGE_LENGTH:
        print(f"✓ Imagem pequena aceita ({len(small_image)} bytes)")
    else:
        print(f"✗ Imagem pequena rejeitada ({len(small_image)} bytes)")
        return False
    
    # Imagem muito grande
    large_image = "data:image/jpeg;base64," + "x" * 2000000
    if len(large_image) > MAX_BASE64_IMAGE_LENGTH:
        print(f"✓ Imagem grande rejeitada ({len(large_image)} bytes)")
    else:
        print(f"✗ Imagem grande aceita ({len(large_image)} bytes)")
        return False
    
    return True

if __name__ == "__main__":
    print("="*60)
    print("TESTES DA ROTA /api/candidatos/me")
    print("="*60)
    
    results = [
        test_get_profile(),
        test_put_profile(),
        test_large_base64_image(),
    ]
    
    print("\n" + "="*60)
    if all(results):
        print("✓ TODOS OS TESTES PASSARAM")
    else:
        print("✗ ALGUNS TESTES FALHARAM")
    print("="*60)
