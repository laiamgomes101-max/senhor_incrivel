#!/usr/bin/env python3
"""
Script para testar a API de comentários do Flask
"""
import requests
import json
import time

base = 'http://127.0.0.1:5000'
timestamp = int(time.time() * 1000)

print("=" * 60)
print("TESTE DE API DE COMENTÁRIOS")
print("=" * 60)

# 1. Registrar um candidato
print("\n1. Registrando candidato de teste...")
try:
    r = requests.post(
        f'{base}/api/auth/register/candidato',
        json={
            'email': f'test+comment+{timestamp}@example.com',
            'password': 'secret123',
            'nome': 'Test Comment User'
        },
        timeout=5
    )
    print(f"   Status: {r.status_code}")
    if r.status_code in (200, 201):
        data = r.json()
        token = data.get('token') or data.get('data', {}).get('token')
        if token:
            print(f"   ✓ Token obtido com sucesso")
        else:
            print(f"   ✗ Nenhum token na resposta: {data}")
            exit(1)
    else:
        print(f"   ✗ Falha: {r.text}")
        exit(1)
except Exception as e:
    print(f"   ✗ Erro: {e}")
    exit(1)

# 2. Buscar candidato info
print("\n2. Buscando informações do candidato...")
try:
    hdr = {'Authorization': f'Bearer {token}'}
    r2 = requests.get(f'{base}/api/candidatos/me', headers=hdr, timeout=5)
    print(f"   Status: {r2.status_code}")
    if r2.status_code == 200:
        candidato_data = r2.json()
        print(f"   ✓ Candidato: {candidato_data}")
    else:
        print(f"   ✗ Falha: {r2.text}")
except Exception as e:
    print(f"   ✗ Erro: {e}")

# 3. Criar um post
print("\n3. Criando um post...")
try:
    hdr = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    r3 = requests.post(
        f'{base}/api/posts-feed/',
        headers=hdr,
        json={'conteudo': 'Este é um post de teste para comentários', 'tipo': 'texto'},
        timeout=5
    )
    print(f"   Status: {r3.status_code}")
    if r3.status_code in (200, 201):
        post_data = r3.json()
        post_id = post_data.get('post', {}).get('id')
        print(f"   ✓ Post criado: ID={post_id}")
    else:
        print(f"   ✗ Falha: {r3.text}")
        exit(1)
except Exception as e:
    print(f"   ✗ Erro: {e}")
    exit(1)

# 4. Testar adição de comentário
print(f"\n4. Adicionando comentário ao post {post_id}...")
try:
    hdr = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    r4 = requests.post(
        f'{base}/api/posts-feed/{post_id}/comentarios',
        headers=hdr,
        json={'conteudo': 'Este é um comentário de teste!'},
        timeout=5
    )
    print(f"   Status: {r4.status_code}")
    print(f"   Response: {r4.text[:200]}")
    if r4.status_code in (200, 201):
        comment_data = r4.json()
        print(f"   ✓ Comentário adicionado com sucesso!")
        print(f"   Resposta completa: {json.dumps(comment_data, indent=2)}")
    else:
        print(f"   ✗ Falha ao adicionar comentário: {r4.text}")
except Exception as e:
    print(f"   ✗ Erro: {e}")
    import traceback
    traceback.print_exc()

# 5. Listar comentários
print(f"\n5. Listando comentários do post {post_id}...")
try:
    hdr = {'Authorization': f'Bearer {token}'}
    r5 = requests.get(
        f'{base}/api/posts-feed/{post_id}/comentarios',
        headers=hdr,
        timeout=5
    )
    print(f"   Status: {r5.status_code}")
    if r5.status_code == 200:
        comments_data = r5.json()
        print(f"   ✓ Comentários encontrados: {len(comments_data.get('comentarios', []))}")
        print(f"   Resposta: {json.dumps(comments_data, indent=2)}")
    else:
        print(f"   ✗ Falha: {r5.text}")
except Exception as e:
    print(f"   ✗ Erro: {e}")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
