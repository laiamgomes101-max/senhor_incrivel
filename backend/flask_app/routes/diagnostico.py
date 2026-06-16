"""Rota de diagnóstico para debugar problemas de produção"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from extensions import db
from models import Candidato, Curriculo, User
import logging
import sys

logger = logging.getLogger(__name__)

diag_bp = Blueprint('diagnostico', __name__)

@diag_bp.route('/health', methods=['GET'])
def health():
    """Verificação básica de saúde"""
    try:
        # Testar conexão com banco de dados
        result = db.session.execute(db.text("SELECT 1"))
        db_ok = result.fetchone() is not None
    except Exception as e:
        logger.error(f"DB Health check failed: {e}")
        db_ok = False
    
    return jsonify({
        'status': 'healthy' if db_ok else 'unhealthy',
        'database': 'connected' if db_ok else 'disconnected',
        'environment': 'production' if 'onrender.com' in request.host else 'development'
    }), 200 if db_ok else 503

@diag_bp.route('/jwt-check', methods=['POST'])
def jwt_check():
    """Verifica se o JWT está sendo validado corretamente"""
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        return jsonify({
            'jwt_valid': True,
            'identity': claims.get('sub'),
            'tipo': claims.get('tipo'),
            'candidato_id': claims.get('candidato_id'),
            'empresa_id': claims.get('empresa_id'),
            'all_claims': claims
        })
    except Exception as e:
        logger.error(f"JWT validation failed: {e}")
        return jsonify({
            'jwt_valid': False,
            'error': str(e)
        }), 401

@diag_bp.route('/candidato-info', methods=['GET'])
@jwt_required()
def candidato_info():
    """Retorna informações detalhadas sobre o candidato logado"""
    try:
        claims = get_jwt()
        candidato_id = claims.get('candidato_id')
        
        logger.info(f"Diagnóstico: Buscando candidato {candidato_id}")
        
        # Tentar buscar o candidato
        candidato = db.session.query(Candidato).filter_by(id=candidato_id).first()
        
        if not candidato:
            logger.warning(f"Candidato {candidato_id} não encontrado no banco")
            return jsonify({
                'found': False,
                'candidato_id': candidato_id,
                'message': 'Candidato não encontrado no banco de dados'
            }), 404
        
        # Verificar relacionamento com User
        user = db.session.query(User).filter_by(id=candidato.user_id).first()
        
        # Verificar currículo
        curriculo = db.session.query(Curriculo).filter_by(candidato_id=candidato_id).first()
        
        return jsonify({
            'found': True,
            'candidato': {
                'id': candidato.id,
                'nome': candidato.nome,
                'user_id': candidato.user_id,
                'user_found': user is not None,
                'created_at': str(candidato.created_at),
                'updated_at': str(candidato.updated_at),
                'fields': {
                    'nome': candidato.nome is not None,
                    'headline': candidato.headline is not None,
                    'localizacao': candidato.localizacao is not None,
                    'sobre': candidato.sobre is not None,
                    'foto_url': candidato.foto_url is not None,
                }
            },
            'curriculo': {
                'found': curriculo is not None,
                'fields': {
                    'experiencia': curriculo.experiencia is not None if curriculo else None,
                    'educacao': curriculo.educacao is not None if curriculo else None,
                    'habilidades': curriculo.habilidades is not None if curriculo else None,
                    'idiomas': curriculo.idiomas is not None if curriculo else None,
                    'certificados': curriculo.certificados is not None if curriculo else None,
                }
            }
        })
    except Exception as e:
        logger.exception(f"Erro em candidato-info: {e}")
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@diag_bp.route('/models-check', methods=['GET'])
def models_check():
    """Verifica se os modelos estão sincronizados com o banco"""
    try:
        # Verificar tabelas
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        curriculos_cols = []
        if 'curriculos' in tables:
            curriculos_cols = [col['name'] for col in inspector.get_columns('curriculos')]
        
        return jsonify({
            'tables': tables,
            'curriculos_columns': curriculos_cols,
            'has_certificados': 'certificados' in curriculos_cols,
            'expected_columns': ['id', 'candidato_id', 'experiencia', 'educacao', 'habilidades', 'idiomas', 'certificados', 'arquivo_url', 'created_at', 'updated_at']
        })
    except Exception as e:
        logger.exception(f"Erro em models-check: {e}")
        return jsonify({
            'error': str(e)
        }), 500

@diag_bp.route('/cors-test', methods=['OPTIONS', 'GET'])
def cors_test():
    """Testa configuração CORS"""
    origin = request.headers.get('Origin', 'sem-origem')
    return jsonify({
        'origin': origin,
        'host': request.host,
        'cors_expected_origins': ['https://apwemi.vercel.app', 'https://senhor-incrivel.vercel.app']
    })
