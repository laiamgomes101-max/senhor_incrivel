import os
from dotenv import load_dotenv, find_dotenv

# Carrega variáveis de ambiente a partir de arquivos .env
load_dotenv()
local_env = find_dotenv('.env.local')
if local_env:
    load_dotenv(local_env, override=False)

custom_env = find_dotenv('.env.mysql')
if custom_env:
    load_dotenv(custom_env, override=False)

class Config:
    # Chaves secretas usadas pelo Flask e pelo JWT
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

    @staticmethod
    def validate():

        if not Config.SECRET_KEY:
            raise ValueError('SECRET_KEY não configurada em variáveis de ambiente')
        if not Config.JWT_SECRET_KEY:
            raise ValueError('JWT_SECRET_KEY não configurada em variáveis de ambiente')
        if len(Config.SECRET_KEY) < 32:
            raise ValueError('SECRET_KEY deve ter no mínimo 32 caracteres')
        if len(Config.JWT_SECRET_KEY) < 32:
            raise ValueError('JWT_SECRET_KEY deve ter no mínimo 32 caracteres')


    # Define qual banco de dados será utilizado
    db_type = os.getenv('DB_TYPE', 'mysql')
    flask_env = os.getenv('FLASK_ENV', 'development')

    database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')
    if database_url:
        database_url = database_url.strip()
        lower_url = database_url.lower()
        if lower_url.startswith('mysql://') and 'pymysql' not in lower_url:
            database_url = 'mysql+pymysql://' + database_url[len('mysql://'):]
        database_url = database_url.replace('ssl-mode=', 'ssl_mode=')
        database_url = database_url.replace('ssl-ca=', 'ssl_ca=')
        database_url = database_url.replace('ssl-cert=', 'ssl_cert=')
        database_url = database_url.replace('ssl-key=', 'ssl_key=')
        SQLALCHEMY_DATABASE_URI = database_url
    elif flask_env == 'development' and db_type == 'sqlite':

        instance_path = os.path.join(os.path.dirname(__file__), 'instance')
        os.makedirs(instance_path, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(instance_path, "plataforma_curriculos.db")}'
    elif db_type == 'mysql':

        db_host = os.getenv('DB_HOST', '127.0.0.1')
        db_port = os.getenv('DB_PORT', '3307') 
        db_user = os.getenv('DB_USER', 'root') 
        db_password = os.getenv('DB_PASSWORD', '') 
        db_name = os.getenv('DB_NAME', 'plataforma_curriculos')
        SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?charset=utf8mb4'
    else:

        instance_path = os.path.join(os.path.dirname(__file__), 'instance')
        os.makedirs(instance_path, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(instance_path, "plataforma_curriculos.db")}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 1800,
        'pool_size': 5,
        'max_overflow': 10,
    }
    JWT_ACCESS_TOKEN_EXPIRES = 86400
    MAX_CONTENT_LENGTH = 1024 * 1024 * 1024  # 1GB máximo por requisição de upload
