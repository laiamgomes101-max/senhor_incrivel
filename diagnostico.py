





import os
import sys
import subprocess
import json
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*50}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'='*50}{Colors.END}\n")

def print_ok(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def check_python():
    print_header("Verificando Python")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_ok(f"Python {version.major}.{version.minor}.{version.micro} instalado")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} - Requer 3.8+")
        return False

def check_node():
    print_header("Verificando Node.js")
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()
        print_ok(f"Node.js {version} instalado")
        return True
    except FileNotFoundError:
        print_error("Node.js não encontrado - Download em nodejs.org")
        return False

def check_postgres():
    print_header("Verificando PostgreSQL")
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()
        print_ok(f"{version} instalado")
        return True
    except FileNotFoundError:
        print_warning("PostgreSQL não encontrado - Download em postgresql.org")
        return False

def check_flask_env():
    print_header("Verificando Configuração Flask")
    flask_dir = Path("backend/flask_app")


    env_file = flask_dir / ".env"
    if env_file.exists():
        print_ok("Arquivo .env encontrado")
        with open(env_file, 'r') as f:
            content = f.read()
            if "DATABASE_URL" in content:
                print_ok("DATABASE_URL configurado")
            else:
                print_warning("DATABASE_URL não configurado")
    else:
        print_error("Arquivo .env não encontrado")
        return False


    req_file = flask_dir / "requirements.txt"
    if req_file.exists():
        print_ok("requirements.txt encontrado")
    else:
        print_error("requirements.txt não encontrado")
        return False

    return True

def check_node_env():
    print_header("Verificando Configuração Node.js")
    node_dir = Path("backend/node_api")


    env_file = node_dir / ".env"
    if env_file.exists():
        print_ok("Arquivo .env encontrado")
        with open(env_file, 'r') as f:
            content = f.read()
            if "PORT=3001" in content:
                print_ok("Porta 3001 configurada")
            else:
                print_warning("Porta não está em 3001")
    else:
        print_error("Arquivo .env não encontrado")
        return False


    pkg_file = node_dir / "package.json"
    if pkg_file.exists():
        print_ok("package.json encontrado")
    else:
        print_error("package.json não encontrado")
        return False

    return True

def check_frontend_env():
    print_header("Verificando Configuração Frontend")
    frontend_dir = Path("frontend")


    vite_file = frontend_dir / "vite.config.js"
    if vite_file.exists():
        print_ok("vite.config.js encontrado")
    else:
        print_warning("vite.config.js não encontrado")


    api_file = frontend_dir / "src/api/client.js"
    if api_file.exists():
        print_ok("Arquivo src/api/client.js encontrado")
    else:
        print_error("Arquivo src/api/client.js não encontrado")
        return False


    pkg_file = frontend_dir / "package.json"
    if pkg_file.exists():
        print_ok("package.json encontrado")
    else:
        print_error("package.json não encontrado")
        return False

    return True

def check_database_connection():
    print_header("Verificando Conexão com Banco de Dados")
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            database="plataforma_curriculos",
            user="postgres",
            password="postgres"
        )
        print_ok("Conexão com PostgreSQL bem-sucedida")
        conn.close()
        return True
    except ImportError:
        print_warning("psycopg2 não instalado (instale após criar venv)")
        return False
    except Exception as e:
        print_error(f"Erro ao conectar: {str(e)}")
        print_warning("Certifique-se que PostgreSQL está rodando e banco criado")
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*50}{Colors.END}")
    print(f"{Colors.BLUE}DIAGNÓSTICO DA PLATAFORMA DE CURRÍCULOS{Colors.END}")
    print(f"{Colors.BLUE}{'='*50}{Colors.END}\n")

    results = {
        "Python": check_python(),
        "Node.js": check_node(),
        "PostgreSQL": check_postgres(),
        "Flask Config": check_flask_env(),
        "Node Config": check_node_env(),
        "Frontend Config": check_frontend_env(),
        "Database Connection": check_database_connection(),
    }


    print_header("RELATÓRIO FINAL")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for check, result in results.items():
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"{check}: {status}")

    print(f"\nResultado: {passed}/{total} verificações passaram")

    if passed == total:
        print_ok("Tudo está configurado corretamente!")
        return 0
    else:
        print_warning("Alguns problemas foram encontrados")
        print("\nPróximos passos:")
        print("1. Consulte SETUP.md para instruções de configuração")
        print("2. Instale as dependências faltantes")
        print("3. Execute este script novamente")
        return 1

if __name__ == "__main__":
    sys.exit(main())