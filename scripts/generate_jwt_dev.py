#!/usr/bin/env python3
import argparse
import time
import json
import base64
import hmac
import hashlib
import os


def b64u_bytes(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode('utf-8').replace('=', '')


def b64u_obj(obj) -> str:
    return b64u_bytes(json.dumps(obj, separators=(',', ':')).encode('utf-8'))


def read_secret_from_env_or_file(path='config-local.env'):
    # Try env var first
    s = os.environ.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET')
    if s:
        return s
    # Fallback to parsing config-local.env
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() in ('JWT_SECRET_KEY', 'JWT_SECRET'):
                        return v.strip()
    return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gerar JWT de desenvolvimento (sem dependências).')
    parser.add_argument('--secret', '-s', help='Segredo (se omitido, tentará ler config-local.env ou variáveis de ambiente)')
    parser.add_argument('--sub', default='dev', help='Subject (sub)')
    parser.add_argument('--tipo', default='candidato', help='Claim tipo')
    parser.add_argument('--candidato_id', type=int, default=1, help='Claim candidato_id')
    parser.add_argument('--exp-hours', type=int, default=24, help='Validade em horas')
    parser.add_argument('--no-newline', action='store_true', help='Não imprimir newline final')
    args = parser.parse_args()

    secret = args.secret or read_secret_from_env_or_file()
    if not secret:
        print('Erro: segredo JWT não encontrado. Passe via --secret ou configure JWT_SECRET_KEY em config-local.env ou env var.')
        raise SystemExit(1)

    now = int(time.time())
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'sub': args.sub,
        'tipo': args.tipo,
        'candidato_id': args.candidato_id,
        'iat': now,
        'exp': now + args.exp_hours * 3600
    }

    header_b64 = b64u_obj(header)
    payload_b64 = b64u_obj(payload)
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')

    sig = hmac.new(secret.encode('utf-8'), signing_input, digestmod=hashlib.sha256).digest()
    sig_b64 = b64u_bytes(sig)

    token = f"{header_b64}.{payload_b64}.{sig_b64}"

    if args.no_newline:
        print(token, end='')
    else:
        print(token)
