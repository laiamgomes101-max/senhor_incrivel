from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import Candidato, Curriculo
import logging

logger = logging.getLogger(__name__)
MAX_BASE64_IMAGE_LENGTH = 1000000

candidatos_bp = Blueprint('candidatos', __name__)

@candidatos_bp.route('/me', methods=['GET', 'PUT'])
@jwt_required()
def meu_perfil():
    claims = get_jwt()
    if claims.get('tipo') != 'candidato':
        return jsonify({'error': 'Acesso negado'}), 403

    candidato = db.get_or_404(Candidato, claims['candidato_id'])

    if request.method == 'GET':
        data = {
            'id': candidato.id, 'nome': candidato.nome, 'headline': candidato.headline,
            'localizacao': candidato.localizacao, 'sobre': candidato.sobre, 'foto_url': candidato.foto_url
        }
        if candidato.curriculo:
            data['curriculo'] = {
                'id': candidato.curriculo.id,
                'experiencia': candidato.curriculo.experiencia,
                'educacao': candidato.curriculo.educacao,
                'habilidades': candidato.curriculo.habilidades,
                'idiomas': candidato.curriculo.idiomas,
                'arquivo_url': candidato.curriculo.arquivo_url
            }
        return jsonify(data)


    data = request.get_json(silent=True) or {}
    logger.info(f"PUT /api/candidatos/me payload keys: {list(data.keys()) if data else None}")

    if 'foto_url' in data and isinstance(data['foto_url'], str) and len(data['foto_url']) > MAX_BASE64_IMAGE_LENGTH:
        logger.warning('Foto de perfil excede o tamanho máximo permitido')
        return jsonify({'error': 'A imagem é muito grande. Envie uma foto menor ou de menor qualidade.'}), 413

    for field in ['nome', 'headline', 'localizacao', 'sobre', 'foto_url']:
        if field in data:
            setattr(candidato, field, data[field])

    if 'curriculo' in data:
        cur = data['curriculo']
        if not candidato.curriculo:
            curriculo = Curriculo(candidato_id=candidato.id)
            db.session.add(curriculo)
            db.session.flush()
            candidato.curriculo = curriculo
        for field in ['experiencia', 'educacao', 'habilidades', 'idiomas']:
            if field in cur:
                setattr(candidato.curriculo, field, cur[field])

    try:
        db.session.commit()
    except Exception as err:
        logger.exception('Erro ao atualizar perfil do candidato')
        db.session.rollback()
        return jsonify({'error': 'Não foi possível atualizar o perfil. Tente novamente.'}), 500

    return jsonify({'message': 'Perfil atualizado'})

@candidatos_bp.route('/', methods=['GET'])
def listar_candidatos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = db.paginate(db.select(Candidato).order_by(Candidato.id), page=page, per_page=per_page)
    candidatos = [{
        'id': c.id, 'nome': c.nome, 'headline': c.headline,
        'localizacao': c.localizacao, 'foto_url': c.foto_url
    } for c in pagination.items]
    return jsonify({'candidatos': candidatos, 'total': pagination.total})

@candidatos_bp.route('/<int:id>', methods=['GET'])
def obter_candidato(id):
    candidato = db.get_or_404(Candidato, id)
    data = {
        'id': candidato.id, 'nome': candidato.nome, 'headline': candidato.headline,
        'localizacao': candidato.localizacao, 'sobre': candidato.sobre, 'foto_url': candidato.foto_url
    }
    if candidato.curriculo:
        data['curriculo'] = {
            'id': candidato.curriculo.id,
            'experiencia': candidato.curriculo.experiencia,
            'educacao': candidato.curriculo.educacao,
            'habilidades': candidato.curriculo.habilidades,
            'idiomas': candidato.curriculo.idiomas,
            'arquivo_url': candidato.curriculo.arquivo_url
        }
    return jsonify(data)