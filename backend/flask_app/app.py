import logging
import os
import sys
from flask import Flask, jsonify
from config import Config
from extensions import db, migrate, jwt
from flask_cors import CORS

# Configuração limpa e direta para produção e desenvolvimento
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Carrega as configurações da classe Config
app.config.from_object(Config)

# Validação obrigatória das variáveis de ambiente
Config.validate()

db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)


# Configura origens permitidas para CORS com base em variáveis de ambiente
cors_origins = [origin.strip() for origin in 
    os.getenv('ALLOWED_ORIGINS', '').split(',') if origin.strip()]
if not cors_origins:
    cors_origins = [
        'http://localhost:5173',
        'https://senhor-incrivel.vercel.app'
    ]

CORS(app, 
    resources={r"/api/*": {
        "origins": cors_origins,
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600,
        "supports_credentials": True
    }}
)

from models import User, Candidato, Empresa
from routes.auth import auth_bp
from routes.curriculos import curriculos_bp
from routes.vagas import vagas_bp
from routes.candidatos import candidatos_bp
from routes.empresas import empresas_bp
from routes.notificacoes import notificacoes_bp
from routes.posts import posts_bp
from routes.posts_simple import posts_simple_bp
from routes.posts_feed import posts_feed_bp
from routes.ia_service import ia_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(curriculos_bp, url_prefix='/api/curriculos')
app.register_blueprint(vagas_bp, url_prefix='/api/vagas')
app.register_blueprint(candidatos_bp, url_prefix='/api/candidatos')
app.register_blueprint(empresas_bp, url_prefix='/api/empresas')
app.register_blueprint(notificacoes_bp, url_prefix='/api/notificacoes')
app.register_blueprint(posts_bp, url_prefix='/api/posts')
app.register_blueprint(posts_simple_bp, url_prefix='/api/posts-simple')
app.register_blueprint(posts_feed_bp, url_prefix='/api/posts-feed')
app.register_blueprint(ia_bp, url_prefix='/api/ia')


from utils.errors import BusinessError

# Tratador de exceções de negócio para retornar mensagens amigáveis
@app.errorhandler(BusinessError)
def handle_business_error(error):
    logger.warning(f'{error.__class__.__name__}: {error.message}')
    return jsonify({'error': error.message}), error.status_code

@app.errorhandler(Exception)
def handle_unexpected_error(error):
    logger.error(f'Erro inesperado: {str(error)}', exc_info=True)
    if os.getenv('FLASK_ENV') == 'development':
        return jsonify({'error': str(error)}), 500
    return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/health')
def health_check():

    import psutil
    import time

    try:

        db.session.execute(db.text('SELECT 1'))

        memory = psutil.virtual_memory()
        return jsonify({
            'status': 'healthy',
            'timestamp': time.time(),
            'uptime': time.time() - psutil.boot_time(),
            'memory': {
                'used_percent': memory.percent,
                'available_mb': memory.available / 1024 / 1024
            },
            'database': 'connected',
            'service': 'flask-ia'
        })
    except Exception as e:
        logger.error(f'Health check failed: {str(e)}')
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 503

@app.route('/')
def home():
    return {
        'message': 'Rodando!'
    }

@app.route('/test', methods=['GET'])
def test():
    return {'test': 'Funcionando!'}

@app.route('/db-status', methods=['GET'])
def db_status():
    try:
        db.session.execute(db.text('SELECT 1'))
        return {'database': 'conectado', 'status': 'ok'}
    except Exception as e:
        return {'database': 'erro', 'error': str(e)}, 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True, port=5000, host='0.0.0.0')