#!/usr/bin/env python
"""
Script para testar o endpoint de diagnóstico usando apenas bibliotecas padrão
"""

import urllib.request
import urllib.error
import json
import sys
from datetime import datetime

# URLs de teste
RENDER_BACKEND_URL = "https://backend-plataforma-3h2p.onrender.com"

def make_request(url, method="GET", headers=None, data=None):
    """Faz uma requisição HTTP básica"""
    if headers is None:
        headers = {}
    
    try:
        if data:
            data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, resp.headers, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            data = json.loads(body)
        except:
            data = body
        return e.code, e.headers, data
    except Exception as e:
        return None, None, str(e)

def run_diagnostics():
    """Executa diagnósticos no backend"""
    
    print(f"\n{'='*70}")
    print(f"DIAGNÓSTICO: {RENDER_BACKEND_URL}")
    print(f"{'='*70}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # 1. Health check
    print("[1] HEALTH CHECK")
    print("-" * 70)
    status, headers, data = make_request(f"{RENDER_BACKEND_URL}/api/diagnostico/health")
    if status:
        print(f"Status: {status}")
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"✗ ERRO: {data}")
    print()
    
    # 2. Models check
    print("[2] MODELS CHECK")
    print("-" * 70)
    status, headers, data = make_request(f"{RENDER_BACKEND_URL}/api/diagnostico/models-check")
    if status:
        print(f"Status: {status}")
        if isinstance(data, dict):
            print(f"Tabelas: {data.get('tables', [])}")
            print(f"Colunas 'curriculos': {data.get('curriculos_columns', [])}")
            print(f"Tem 'certificados'? {data.get('has_certificados', False)}")
        else:
            print(data)
    else:
        print(f"✗ ERRO: {data}")
    print()
    
    # 3. CORS test
    print("[3] CORS TEST")
    print("-" * 70)
    cors_headers = {
        "Origin": "https://apwemi.vercel.app",
        "Access-Control-Request-Method": "GET"
    }
    status, headers, data = make_request(f"{RENDER_BACKEND_URL}/api/diagnostico/cors-test",
                                         method="OPTIONS",
                                         headers=cors_headers)
    if status:
        print(f"Status: {status}")
        cors_response_headers = {k: v for k, v in headers.items() if "Access-Control" in k.lower()}
        print(f"CORS Headers: {cors_response_headers}")
        if "Access-Control-Allow-Origin" in cors_response_headers:
            print(f"✓ CORS permitido para {cors_response_headers['Access-Control-Allow-Origin']}")
        else:
            print("✗ CORS não permitido")
    else:
        print(f"✗ ERRO: {data}")
    print()
    
    print(f"{'='*70}\n")

if __name__ == "__main__":
    run_diagnostics()
