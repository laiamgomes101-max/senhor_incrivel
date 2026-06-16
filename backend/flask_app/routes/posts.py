from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import Post, Candidato, Empresa

posts_bp = Blueprint('posts', __name__)

def _serializar_post(post):
    autor = post.autor_candidato if post.candidato_id else post.autor_empresa
    if not autor:
        autor_data = {'id': 0, 'nome': 'Desconhecido', 'tipo': 'candidato', 'foto': None}
    else:
        autor_data = {
            'id': autor.id,
            'nome': autor.nome,
            'tipo': 'candidato' if post.candidato_id else 'empresa',
            'foto': getattr(autor, 'foto_url', None) or getattr(autor, 'logo_url', None)
        }
    return {
        'id': post.id,
        'conteudo': post.conteudo,
        'tipo': post.tipo,
        'autor': autor_data,
        'created_at': post.created_at.isoformat() if post.created_at else None
    }

@posts_bp.route('/', methods=['GET'])
def listar_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    stmt = db.select(Post).order_by(Post.created_at.desc())
    pagination = db.paginate(stmt, page=page, per_page=per_page)
    posts = [_serializar_post(p) for p in pagination.items]
    return jsonify({'posts': posts, 'total': pagination.total})

@posts_bp.route('/', methods=['POST'])
@jwt_required()
def criar_post():
    claims = get_jwt()
    data = request.get_json()
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo é obrigatório'}), 400

    post = Post(conteudo=data['conteudo'], tipo=data.get('tipo', 'texto'))
    if claims.get('tipo') == 'candidato':
        post.candidato_id = claims['candidato_id']
    else:
        post.empresa_id = claims['empresa_id']

    db.session.add(post)
    db.session.commit()

    # retornar o post serializado para o frontend evitar que o item criado suma
    serialized = _serializar_post(post)
    return jsonify({'post': serialized, 'id': post.id, 'message': 'Post criado'}), 201