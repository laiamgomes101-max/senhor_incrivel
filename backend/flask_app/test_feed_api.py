"""
Script de testes para o sistema de Feed e Notificações
Executar: python test_feed_api.py
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = 'http://localhost:5000/api'
TOKEN = None  # Será preenchido após login

# Cores para output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name, passed):
    status = f"{GREEN}✅ PASSOU{RESET}" if passed else f"{RED}❌ FALHOU{RESET}"
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Teste: {name}")
    print(f"Status: {status}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_response(response):
    print(f"{YELLOW}Status Code: {response.status_code}{RESET}")
    try:
        print(f"{YELLOW}Response:{RESET}")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)
    print()

def test_criar_conta_candidato():
    """Teste 1: Criar conta de candidato"""
    print(f"\n{BLUE}🧪 TESTE 1: Criar conta de candidato{RESET}")
    
    data = {
        "email": f"candidato_{int(time.time())}@test.com",
        "password": "senha123",
        "tipo": "candidato",
        "nome": "João Silva"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print_response(response)
        passed = response.status_code == 201
        print_test("Criar candidato", passed)
        return response.json().get('user', {}).get('id') if passed else None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Criar candidato", False)
        return None

def test_login_candidato(email, password):
    """Teste 2: Fazer login"""
    print(f"\n{BLUE}🧪 TESTE 2: Fazer login{RESET}")
    
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print_response(response)
        passed = response.status_code == 200
        print_test("Login", passed)
        
        if passed:
            global TOKEN
            TOKEN = response.json().get('access_token')
            return TOKEN
        return None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Login", False)
        return None

def test_listar_posts_publicos():
    """Teste 3: Listar posts públicos"""
    print(f"\n{BLUE}🧪 TESTE 3: Listar posts públicos{RESET}")
    
    try:
        response = requests.get(f"{BASE_URL}/posts-feed/feed")
        print_response(response)
        passed = response.status_code == 200
        print_test("Listar posts públicos", passed)
        return response.json() if passed else None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Listar posts públicos", False)
        return None

def test_criar_post():
    """Teste 4: Criar um novo post"""
    print(f"\n{BLUE}🧪 TESTE 4: Criar um novo post{RESET}")
    
    if not TOKEN:
        print(f"{RED}❌ Token não disponível{RESET}")
        print_test("Criar post", False)
        return None
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    data = {
        "conteudo": f"Olá comunidade! Este é um post de teste - {datetime.now().isoformat()}",
        "tipo": "texto"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/posts-feed/", json=data, headers=headers)
        print_response(response)
        passed = response.status_code == 201
        print_test("Criar post", passed)
        
        if passed:
            return response.json().get('post', {}).get('id')
        return None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Criar post", False)
        return None

def test_curtir_post(post_id):
    """Teste 5: Curtir um post"""
    print(f"\n{BLUE}🧪 TESTE 5: Curtir um post (ID: {post_id}){RESET}")
    
    if not TOKEN:
        print(f"{RED}❌ Token não disponível{RESET}")
        print_test("Curtir post", False)
        return False
    
    if not post_id:
        print(f"{RED}❌ Post ID não disponível{RESET}")
        print_test("Curtir post", False)
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.post(f"{BASE_URL}/posts-feed/{post_id}/curtir", headers=headers)
        print_response(response)
        passed = response.status_code == 201
        print_test("Curtir post", passed)
        return passed
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Curtir post", False)
        return False

def test_comentar_post(post_id):
    """Teste 6: Comentar em um post"""
    print(f"\n{BLUE}🧪 TESTE 6: Comentar em um post (ID: {post_id}){RESET}")
    
    if not TOKEN:
        print(f"{RED}❌ Token não disponível{RESET}")
        print_test("Comentar post", False)
        return None
    
    if not post_id:
        print(f"{RED}❌ Post ID não disponível{RESET}")
        print_test("Comentar post", False)
        return None
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    data = {
        "conteudo": f"Excelente post! Comentário de teste - {datetime.now().isoformat()}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/posts-feed/{post_id}/comentarios",
            json=data,
            headers=headers
        )
        print_response(response)
        passed = response.status_code == 201
        print_test("Comentar post", passed)
        
        if passed:
            return response.json().get('comentario', {}).get('id')
        return None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Comentar post", False)
        return None

def test_listar_comentarios(post_id):
    """Teste 7: Listar comentários de um post"""
    print(f"\n{BLUE}🧪 TESTE 7: Listar comentários (Post ID: {post_id}){RESET}")
    
    if not post_id:
        print(f"{RED}❌ Post ID não disponível{RESET}")
        print_test("Listar comentários", False)
        return None
    
    try:
        response = requests.get(f"{BASE_URL}/posts-feed/{post_id}/comentarios")
        print_response(response)
        passed = response.status_code == 200
        print_test("Listar comentários", passed)
        
        if passed:
            return response.json() if passed else None
        return None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Listar comentários", False)
        return None

def test_listar_notificacoes():
    """Teste 8: Listar notificações"""
    print(f"\n{BLUE}🧪 TESTE 8: Listar notificações{RESET}")
    
    if not TOKEN:
        print(f"{RED}❌ Token não disponível{RESET}")
        print_test("Listar notificações", False)
        return None
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.get(f"{BASE_URL}/notificacoes/", headers=headers)
        print_response(response)
        passed = response.status_code == 200
        print_test("Listar notificações", passed)
        return response.json() if passed else None
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Listar notificações", False)
        return None

def test_descurtir_post(post_id):
    """Teste 9: Remover curtida de um post"""
    print(f"\n{BLUE}🧪 TESTE 9: Remover curtida (Post ID: {post_id}){RESET}")
    
    if not TOKEN:
        print(f"{RED}❌ Token não disponível{RESET}")
        print_test("Descurtir post", False)
        return False
    
    if not post_id:
        print(f"{RED}❌ Post ID não disponível{RESET}")
        print_test("Descurtir post", False)
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.post(f"{BASE_URL}/posts-feed/{post_id}/descurtir", headers=headers)
        print_response(response)
        passed = response.status_code == 200
        print_test("Descurtir post", passed)
        return passed
    except Exception as e:
        print(f"{RED}Erro: {e}{RESET}")
        print_test("Descurtir post", False)
        return False

def run_all_tests():
    """Executar todos os testes"""
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{GREEN}🚀 TESTES DO SISTEMA DE FEED E NOTIFICAÇÕES{RESET}")
    print(f"{GREEN}{'='*60}{RESET}")
    
    # Teste 1: Listar posts (sem autenticação)
    test_listar_posts_publicos()
    
    # Teste 2: Criar conta
    # email = f"candidato_{int(time.time())}@test.com"
    # test_criar_conta_candidato()
    # Usar credenciais pré-existentes para testes
    email = "candidato@test.com"
    password = "senha123"
    
    # Teste 3: Login
    token = test_login_candidato(email, password)
    if not token:
        print(f"{RED}Teste de login falhou, parando testes{RESET}")
        return
    
    # Teste 4: Criar post
    post_id = test_criar_post()
    if post_id:
        # Teste 5: Curtir post
        test_curtir_post(post_id)
        
        # Teste 6: Comentar post
        comentario_id = test_comentar_post(post_id)
        
        # Teste 7: Listar comentários
        test_listar_comentarios(post_id)
        
        # Teste 8: Listar notificações
        test_listar_notificacoes()
        
        # Teste 9: Descurtir post
        test_descurtir_post(post_id)
    
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{GREEN}✅ TESTES CONCLUÍDOS{RESET}")
    print(f"{GREEN}{'='*60}{RESET}\n")

if __name__ == '__main__':
    print(f"{YELLOW}Conectando a: {BASE_URL}{RESET}")
    print(f"{YELLOW}Aguarde...{RESET}\n")
    
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{RED}Testes interrompidos pelo usuário{RESET}")
    except Exception as e:
        print(f"{RED}Erro geral: {e}{RESET}")
