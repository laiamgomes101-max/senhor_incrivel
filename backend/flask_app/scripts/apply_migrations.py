import os
import sys
from alembic.config import Config as AlembicConfig
from alembic import command

# Ajusta o path para importar a configuração da app
ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

# Força uso do SQLite local para evitar aplicar migrações inadvertidamente em MySQL
os.environ['DB_TYPE'] = 'sqlite'
os.environ['FLASK_ENV'] = 'development'

from config import Config
# Importa a app Flask para fornecer o application context às migrações
try:
    from app import app as flask_app
except Exception:
    flask_app = None


def main():
    db_uri = getattr(Config, 'SQLALCHEMY_DATABASE_URI', None)
    if not db_uri:
        print('SQLALCHEMY_DATABASE_URI não encontrado em Config.')
        return 1

    base_dir = ROOT
    alembic_ini = os.path.join(base_dir, 'alembic.ini')
    migrations_dir = os.path.join(base_dir, 'migrations')

    if not os.path.exists(alembic_ini):
        print(f'Arquivo alembic.ini não encontrado em {alembic_ini}')
        return 1

    alembic_cfg = AlembicConfig(alembic_ini)
    # Força a URL do banco (override em alembic.ini)
    alembic_cfg.set_main_option('sqlalchemy.url', db_uri)
    alembic_cfg.set_main_option('script_location', migrations_dir)

    print('Aplicando migrações em:', db_uri)
    try:
        if flask_app:
            with flask_app.app_context():
                command.upgrade(alembic_cfg, 'head')
        else:
            command.upgrade(alembic_cfg, 'head')
        print('Migrações aplicadas com sucesso.')
        return 0
    except Exception as e:
        print('Erro ao aplicar migrações:', str(e))
        return 2


if __name__ == '__main__':
    sys.exit(main())
