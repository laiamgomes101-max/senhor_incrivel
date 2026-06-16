"""Rota de diagnóstico para debugar problemas de produção"""

from flask import Blueprint, jsonify, request
import logging

logger = logging.getLogger(__name__)

diag_bp = Blueprint('diagnostico', __name__)

@diag_bp.route('/health', methods=['GET'])
def health():
    """Verificação básica de saúde"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend está respondendo'
    }), 200

@diag_bp.route('/version', methods=['GET'])
def version():
    """Retorna versão do backend"""
    return jsonify({
        'version': '1.0.0',
        'host': request.host,
        'environment': 'production' if 'onrender.com' in request.host else 'development'
    }), 200

