from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models import Candidato, Curriculo
import logging
import json

logger = logging.getLogger(__name__)
MAX_BASE64_IMAGE_LENGTH = 1000000

candidatos_bp = Blueprint('candidatos', __name__)

def safe_json_value(value):
    """Converte e valida campos JSON para serialização segura."""
    if value is None:
        return None
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            logger.warning(f"Não foi possível deserializar JSON: {value[:50]}")
            return None
    return value


@candidatos_bp.route('/me', methods=['GET', 'PUT'])
@jwt_required()
def meu_perfil():
    auth_header_present = bool(request.headers.get('Authorization'))
    logger.info(f"===== REQUEST /api/candidatos/me =====")
    logger.info(f"Method: {request.method}, Auth present: {auth_header_present}")

    try:
        claims = get_jwt()
        logger.info(f"JWT Claims - tipo: {claims.get('tipo')}, candidato_id: {claims.get('candidato_id')}")
    except Exception as e:
        logger.exception(f"Erro ao extrair JWT claims: {e}")
        return jsonify({'error': 'Token inválido'}), 401

    if claims.get('tipo') != 'candidato':
        logger.warning(f"Acesso negado: tipo não é 'candidato' mas '{claims.get('tipo')}'")
        return jsonify({'error': 'Acesso negado'}), 403

    candidato_id = claims.get('candidato_id')
    if not candidato_id:
        logger.error(f"JWT claims sem candidato_id: {claims}")
        return jsonify({'error': 'Token inválido'}), 401

    try:
        logger.info(f"Buscando candidato com ID: {candidato_id}")
        candidato = db.get_or_404(Candidato, candidato_id)
        logger.info(f"Candidato encontrado: {candidato.nome}")
    except Exception as e:
        logger.error(f"Erro ao carregar candidato {candidato_id}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Candidato não encontrado'}), 404

    if request.method == 'GET':
        try:
            data = {
                'id': candidato.id, 'nome': candidato.nome, 'headline': candidato.headline,
                'localizacao': candidato.localizacao, 'sobre': candidato.sobre, 'foto_url': candidato.foto_url
            }
            if candidato.curriculo:
                data['curriculo'] = {
                    'id': candidato.curriculo.id,
                    'experiencia': safe_json_value(candidato.curriculo.experiencia),
                    'educacao': safe_json_value(candidato.curriculo.educacao),
                    'habilidades': safe_json_value(candidato.curriculo.habilidades),
                    'idiomas': safe_json_value(candidato.curriculo.idiomas),
                    'arquivo_url': candidato.curriculo.arquivo_url
                }
            logger.info(f"GET /api/candidatos/me retornado com sucesso para candidato {candidato_id}")
            return jsonify(data)
        except Exception as e:
            logger.exception(f'GET: Erro ao serializar /candidatos/me: {str(e)}')
            return jsonify({'error': f'Erro ao carregar perfil: {str(e)[:100]}'}), 500

    # PUT
    try:
        data = request.get_json(silent=True) or {}
        logger.info(f"PUT /api/candidatos/me - payload keys: {list(data.keys())}")
        
        if 'foto_url' in data and isinstance(data['foto_url'], str) and len(data['foto_url']) > MAX_BASE64_IMAGE_LENGTH:
            logger.warning('Foto de perfil excede o tamanho máximo permitido')
            return jsonify({'error': 'A imagem é muito grande. Envie uma foto menor ou de menor qualidade.'}), 413

        for field in ['nome', 'headline', 'localizacao', 'sobre', 'foto_url']:
            if field in data:
                value = data[field]
                setattr(candidato, field, value)
                logger.debug(f"PUT: Campo {field} atualizado")

        if 'curriculo' in data:
            cur = data['curriculo']
            if not isinstance(cur, dict):
                logger.error(f"PUT: Campo curriculo deve ser dict, recebido {type(cur)}")
                return jsonify({'error': 'Campo curriculo inválido'}), 400
            if not candidato.curriculo:
                logger.info(f"PUT: Criando novo currículo para candidato {candidato_id}")
                curriculo = Curriculo(candidato_id=candidato_id)
                db.session.add(curriculo)
                db.session.flush()
                candidato.curriculo = curriculo

            for field in ['experiencia', 'educacao', 'habilidades', 'idiomas']:
                if field in cur:
                    value = cur[field]
                    if not isinstance(value, (list, dict, type(None))):
                        logger.warning(f"PUT: Campo {field} esperava list/dict, recebido {type(value)}")
                        value = safe_json_value(value)
                    setattr(candidato.curriculo, field, value)
                    logger.debug(f"PUT: Currículo.{field} atualizado")

        logger.info(f"PUT: Commitando mudanças do candidato {candidato_id}")
        db.session.commit()
        logger.info(f"PUT: Perfil de candidato {candidato_id} atualizado com sucesso")
        return jsonify({'message': 'Perfil atualizado'})
    except Exception as err:
        logger.exception(f'PUT: Erro ao atualizar perfil do candidato {candidato_id}: {type(err).__name__}: {str(err)}')
        db.session.rollback()
        import traceback
        tb = traceback.format_exc()
        logger.error(f"PUT: Stack trace:\n{tb}")
        return jsonify({'error': f'Erro ao atualizar perfil: {str(err)[:100]}'}), 500

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