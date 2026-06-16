from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Notificacao

notificacoes_bp = Blueprint('notificacoes', __name__)

@notificacoes_bp.route('/', methods=['GET'])
@jwt_required()
def listar_notificacoes():
    user_id = get_jwt_identity()
    nao_lidas = request.args.get('nao_lidas', 'false').lower() == 'true'

    stmt = db.select(Notificacao).where(Notificacao.user_id == user_id)
    if nao_lidas:
        stmt = stmt.where(Notificacao.lida == False)
    stmt = stmt.order_by(Notificacao.created_at.desc()).limit(50)

    result = db.session.execute(stmt).scalars().all()
    notificacoes = [{
        'id': n.id, 'tipo': n.tipo, 'titulo': n.titulo,
        'mensagem': n.mensagem, 'link': n.link, 'lida': n.lida,
        'created_at': n.created_at.isoformat() if n.created_at else None
    } for n in result]

    return jsonify({'notificacoes': notificacoes})

@notificacoes_bp.route('/<int:id>/ler', methods=['PUT'])
@jwt_required()
def marcar_lida(id):
    user_id = get_jwt_identity()
    notif = db.one_or_404(db.select(Notificacao).where(Notificacao.id == id, Notificacao.user_id == user_id))
    notif.lida = True
    db.session.commit()
    return jsonify({'message': 'Notificação marcada como lida'})

@notificacoes_bp.route('/ler-todas', methods=['PUT'])
@jwt_required()
def marcar_todas_lidas():
    user_id = get_jwt_identity()
    for notif in db.session.execute(db.select(Notificacao).where(Notificacao.user_id == user_id, Notificacao.lida == False)).scalars().all():
        notif.lida = True
    db.session.commit()
    return jsonify({'message': 'Todas notificações marcadas como lidas'})