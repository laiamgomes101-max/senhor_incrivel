#!/usr/bin/env python
"""
Script para debugar erros de import e inicialização do app
"""

import sys
import os

# Adicionar o diretório ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testando imports...")

try:
    print("  - Importando config...")
    from config import Config
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    sys.exit(1)

try:
    print("  - Importando extensions...")
    from extensions import db, migrate, jwt
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    sys.exit(1)

try:
    print("  - Importando models...")
    from models import User, Candidato, Empresa
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    sys.exit(1)

try:
    print("  - Importando routes.auth...")
    from routes.auth import auth_bp
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    sys.exit(1)

try:
    print("  - Importando routes.candidatos...")
    from routes.candidatos import candidatos_bp
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    sys.exit(1)

try:
    print("  - Importando routes.diagnostico...")
    from routes.diagnostico import diag_bp
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("  - Criando app Flask...")
    from flask import Flask
    from flask_cors import CORS
    import re
    
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(Config)
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    print("    ✓ OK")
except Exception as e:
    print(f"    ✗ ERRO: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✓ Todos os imports OK - aplicação deve funcionar")
