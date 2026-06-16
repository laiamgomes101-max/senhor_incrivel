#!/usr/bin/env python
"""
Script para testar o endpoint de diagnóstico e verificar o estado do servidor
Útil para debugar problemas em produção sem precisar de acesso ao Render
"""

import requests
import json
import sys
import os
from datetime import datetime

# URLs de teste
RENDER_BACKEND_URL = "https://backend-plataforma-3h2p.onrender.com"
LOCAL_BACKEND_URL = "http://localhost:5000"

def run_diagnostics(backend_url, token=None):
    """Executa diagnósticos no backend"""
    
    print(f"\n{'='*70}")
    print(f"DIAGNÓSTICO: {backend_url}")
    print(f"{'='*70}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # 1. Health check
    print("[1] HEALTH CHECK")
    print("-" * 70)
    try:
        resp = requests.get(f"{backend_url}/api/diagnostico/health", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2, ensure_ascii=False)}")
        print()
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
        return False
    
    # 2. Models check
    print("[2] MODELS CHECK (verificar se tabelas estão sincronizadas)")
    print("-" * 70)
    try:
        resp = requests.get(f"{backend_url}/api/diagnostico/models-check", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Tabelas: {data.get('tables', [])}")
        print(f"Colunas da tabela 'curriculos': {data.get('curriculos_columns', [])}")
        print(f"Tem 'certificados'? {data.get('has_certificados', False)}")
        print()
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
    
    # 3. CORS test
    print("[3] CORS TEST")
    print("-" * 70)
    try:
        headers = {"Origin": "https://apwemi.vercel.app"}
        resp = requests.options(f"{backend_url}/api/diagnostico/cors-test", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        cors_headers = {k: v for k, v in resp.headers.items() if "Access-Control" in k}
        print(f"CORS Headers: {cors_headers}")
        print()
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
    
    # 4. JWT check (se temos token)
    if token:
        print("[4] JWT VALIDATION")
        print("-" * 70)
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.post(f"{backend_url}/api/diagnostico/jwt-check", headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            data = resp.json()
            if resp.status_code == 200:
                print(f"✓ JWT válido")
                print(f"  Identity: {data.get('identity')}")
                print(f"  Tipo: {data.get('tipo')}")
                print(f"  Candidato ID: {data.get('candidato_id')}")
                print(f"  Empresa ID: {data.get('empresa_id')}")
            else:
                print(f"✗ JWT inválido: {data.get('error')}")
            print()
        except Exception as e:
            print(f"✗ ERRO: {e}\n")
        
        # 5. Candidato info
        print("[5] CANDIDATO INFO")
        print("-" * 70)
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.get(f"{backend_url}/api/diagnostico/candidato-info", headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
            print()
        except Exception as e:
            print(f"✗ ERRO: {e}\n")
    
    print(f"{'='*70}")
    return True

def test_candidate_endpoint(backend_url):
    """Testa o endpoint /api/candidatos/me"""
    print(f"\n{'='*70}")
    print(f"TESTE DE ENDPOINT /api/candidatos/me")
    print(f"Backend: {backend_url}")
    print(f"{'='*70}\n")
    
    # Registrar novo candidato
    print("[1] REGISTER CANDIDATO")
    print("-" * 70)
    email = f"teste_{os.urandom(4).hex()}@test.com"
    register_data = {
        "email": email,
        "password": "senha123",
        "tipo": "candidato",
        "nome": "Teste Candidato"
    }
    try:
        resp = requests.post(f"{backend_url}/api/auth/register", json=register_data, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 201:
            print("✓ Candidato registrado")
        else:
            print(f"✗ Falha: {resp.json()}")
            return
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
        return
    
    # Login
    print("\n[2] LOGIN")
    print("-" * 70)
    try:
        resp = requests.post(f"{backend_url}/api/auth/login", 
                           json={"email": email, "password": "senha123"},
                           timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            print(f"✓ Login bem-sucedido")
            print(f"Token: {token[:50]}...")
        else:
            print(f"✗ Falha: {resp.json()}")
            return
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
        return
    
    # GET /api/candidatos/me
    print("\n[3] GET /api/candidatos/me")
    print("-" * 70)
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{backend_url}/api/candidatos/me", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        if resp.status_code == 200:
            print("✓ GET bem-sucedido")
            print(f"Nome: {data.get('nome')}")
            print(f"Tem currículo? {data.get('curriculo') is not None}")
            if data.get('curriculo'):
                print(f"  Certificados: {data['curriculo'].get('certificados')}")
        else:
            print(f"✗ Falha: {data}")
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
    
    # PUT /api/candidatos/me
    print("\n[4] PUT /api/candidatos/me (com certificados)")
    print("-" * 70)
    update_data = {
        "nome": "Teste Atualizado",
        "headline": "Desenvolvedor",
        "curriculo": {
            "habilidades": ["Python"],
            "idiomas": [],
            "experiencia": [],
            "educacao": [],
            "certificados": ["Cert 1"]
        }
    }
    try:
        resp = requests.put(f"{backend_url}/api/candidatos/me", 
                          headers=headers, 
                          json=update_data,
                          timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("✓ PUT bem-sucedido")
            print(f"Message: {resp.json().get('message')}")
        else:
            print(f"✗ Falha: {resp.json()}")
    except Exception as e:
        print(f"✗ ERRO: {e}\n")
    
    print(f"{'='*70}")

if __name__ == "__main__":
    # Testar produção (sem token)
    run_diagnostics(RENDER_BACKEND_URL, token=None)
    
    # Testar localmente (com teste completo)
    # Descomente a linha abaixo para testar o local
    # test_candidate_endpoint(LOCAL_BACKEND_URL)
