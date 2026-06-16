from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import Empresa, Vaga
import logging

logger = logging.getLogger(__name__)
empresas_bp = Blueprint('empresas', __name__)
MAX_BASE64_IMAGE_LENGTH = 1000000

@empresas_bp.route('/me', methods=['GET', 'PUT'])
@jwt_required()
def minha_empresa():
    claims = get_jwt()
    if claims.get('tipo') != 'empresa':
        return jsonify({'error': 'Acesso negado'}), 403

    empresa = db.get_or_404(Empresa, claims['empresa_id'])

    if request.method == 'GET':
        vagas = [{'id': v.id, 'titulo': v.titulo, 'tipo_contrato': v.tipo_contrato}
                 for v in empresa.vagas.filter_by(ativa=True).all()]
        return jsonify({
            'id': empresa.id, 'nome': empresa.nome, 'setor': empresa.setor,
            'localizacao': empresa.localizacao, 'sobre': empresa.sobre,
            'logo_url': empresa.logo_url, 'site_url': empresa.site_url,
            'vagas': vagas
        })


    data = request.get_json(silent=True) or {}

    if 'logo_url' in data and isinstance(data['logo_url'], str) and len(data['logo_url']) > MAX_BASE64_IMAGE_LENGTH:
        logger.warning('Logo da empresa excede o tamanho máximo permitido')
        return jsonify({'error': 'A imagem é muito grande. Envie um logo menor ou de menor qualidade.'}), 413

    for field in ['nome', 'setor', 'localizacao', 'sobre', 'logo_url', 'site_url']:
        if field in data:
            setattr(empresa, field, data[field])
    try:
        db.session.commit()
    except Exception as err:
        logger.exception('Erro ao atualizar dados da empresa')
        db.session.rollback()
        return jsonify({'error': 'Não foi possível atualizar a empresa. Tente novamente.'}), 500
    return jsonify({'message': 'Empresa atualizada'})

@empresas_bp.route('/', methods=['GET'])
def listar_empresas():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = db.paginate(db.select(Empresa).order_by(Empresa.id), page=page, per_page=per_page)
    empresas = [{
        'id': e.id, 'nome': e.nome, 'setor': e.setor,
        'localizacao': e.localizacao, 'logo_url': e.logo_url
    } for e in pagination.items]
    return jsonify({'empresas': empresas, 'total': pagination.total})

@empresas_bp.route('/<int:id>', methods=['GET'])
def obter_empresa(id):
    empresa = db.get_or_404(Empresa, id)
    vagas = [{'id': v.id, 'titulo': v.titulo, 'tipo_contrato': v.tipo_contrato} 
             for v in empresa.vagas.filter_by(ativa=True).all()]
    return jsonify({
        'id': empresa.id, 'nome': empresa.nome, 'setor': empresa.setor,
        'localizacao': empresa.localizacao, 'sobre': empresa.sobre,
        'logo_url': empresa.logo_url, 'site_url': empresa.site_url,
        'vagas': vagas
    })