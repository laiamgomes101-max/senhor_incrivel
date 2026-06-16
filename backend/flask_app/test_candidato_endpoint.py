#!/usr/bin/env python
"""Script para testar o endpoint /api/candidatos/me localmente"""

import requests
import json
import sys
import os

# Configurações
LOCAL_BACKEND_URL = "http://localhost:5000"
RENDER_BACKEND_URL = "https://backend-plataforma-3h2p.onrender.com"

# Credenciais de teste
TEST_EMAIL = "teste@test.com"
TEST_PASSWORD = "senha123"

def test_local():
    """Testa contra o servidor local"""
    print(f"\n{'='*60}")
    print(f"Testando contra BACKEND LOCAL: {LOCAL_BACKEND_URL}")
    print(f"{'='*60}")
    
    # 1. Registro
    print("\n[1] Registrando novo candidato...")
    register_data = {
        "email": f"candidato_test_{os.urandom(4).hex()}@test.com",
        "password": "senha123",
        "tipo": "candidato",
        "nome": "João da Silva"
    }
    try:
        resp = requests.post(f"{LOCAL_BACKEND_URL}/api/auth/register", json=register_data, timeout=10)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
        if resp.status_code != 201:
            print("   ERRO: Falha no registro")
            return False
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    # 2. Login
    print("\n[2] Fazendo login...")
    login_data = {"email": register_data["email"], "password": "senha123"}
    try:
        resp = requests.post(f"{LOCAL_BACKEND_URL}/api/auth/login", json=login_data, timeout=10)
        print(f"   Status: {resp.status_code}")
        data = resp.json()
        if resp.status_code != 200:
            print(f"   ERRO: {data}")
            return False
        token = data.get("access_token")
        print(f"   Token: {token[:50]}...")
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    # 3. GET /api/candidatos/me
    print("\n[3] GET /api/candidatos/me...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{LOCAL_BACKEND_URL}/api/candidatos/me", headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
        if resp.status_code != 200:
            print("   ERRO: Falha ao buscar perfil")
            return False
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    # 4. PUT /api/candidatos/me
    print("\n[4] PUT /api/candidatos/me...")
    update_data = {
        "nome": "João Silva Updated",
        "headline": "Desenvolvedor Python",
        "localizacao": "São Paulo",
        "sobre": "Desenvolvo aplicações web",
        "curriculo": {
            "habilidades": ["Python", "Flask", "SQL"],
            "experiencia": [],
            "educacao": [],
            "idiomas": []
        }
    }
    try:
        resp = requests.put(f"{LOCAL_BACKEND_URL}/api/candidatos/me", 
                          headers=headers, 
                          json=update_data, 
                          timeout=10)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
        if resp.status_code != 200:
            print("   ERRO: Falha ao atualizar perfil")
            return False
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    # 5. GET /api/candidatos/me novamente
    print("\n[5] GET /api/candidatos/me (verificação)...")
    try:
        resp = requests.get(f"{LOCAL_BACKEND_URL}/api/candidatos/me", headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        data = resp.json()
        if resp.status_code == 200:
            print(f"   Nome: {data.get('nome')}")
            print(f"   Headline: {data.get('headline')}")
            print("   OK: Perfil atualizado com sucesso")
        else:
            print(f"   ERRO: {data}")
            return False
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    return True

def test_production():
    """Testa contra o servidor de produção"""
    print(f"\n{'='*60}")
    print(f"Testando contra BACKEND PRODUÇÃO: {RENDER_BACKEND_URL}")
    print(f"{'='*60}")
    
    # 1. GET /api/candidatos/me (sem token, esperado 401)
    print("\n[1] GET /api/candidatos/me (sem token)...")
    try:
        resp = requests.get(f"{RENDER_BACKEND_URL}/api/candidatos/me", timeout=10)
        print(f"   Status: {resp.status_code}")
        print(f"   Esperado 401 (Unauthorized)")
    except Exception as e:
        print(f"   ERRO: {e}")
        return False
    
    # 2. Teste de CORS
    print("\n[2] Teste de CORS com apwemi.vercel.app...")
    headers = {
        "Origin": "https://apwemi.vercel.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"
    }
    try:
        resp = requests.options(f"{RENDER_BACKEND_URL}/api/candidatos/me", headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        cors_headers = {k: v for k, v in resp.headers.items() if "Access-Control" in k}
        print(f"   CORS Headers: {cors_headers}")
        if "Access-Control-Allow-Origin" in resp.headers:
            print(f"   ✓ CORS permitido para origem")
        else:
            print(f"   ✗ CORS NOT permitido")
    except Exception as e:
        print(f"   ERRO: {e}")
    
    return True

if __name__ == "__main__":
    # Testar localmente primeiro
    if test_local():
        print("\n" + "="*60)
        print("✓ TODOS OS TESTES LOCAIS PASSARAM")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("✗ FALHA NOS TESTES LOCAIS")
        print("="*60)
        sys.exit(1)
    
    # Depois testar produção
    test_production()
