from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from models import Post, Candidato, Empresa, Curtida, Comentario, CurtidaComentario, Notificacao, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

posts_feed_bp = Blueprint('posts_feed', __name__)

def _serializar_autor(candidato=None, empresa=None):
    """Serializa dados do autor"""
    if candidato:
        return {
            'id': candidato.id,
            'nome': candidato.nome,
            'tipo': 'candidato',
            'foto': candidato.foto_url,
            'headline': candidato.headline
        }
    elif empresa:
        return {
            'id': empresa.id,
            'nome': empresa.nome,
            'tipo': 'empresa',
            'foto': empresa.logo_url,
            'setor': empresa.setor
        }
    return {'id': 0, 'nome': 'Desconhecido', 'tipo': 'unknown'}

def _serializar_post_completo(post, user_id=None):
    """Serializa um post com todas as informações"""
    autor_candidato = post.autor_candidato
    autor_empresa = post.autor_empresa
    autor_data = _serializar_autor(autor_candidato, autor_empresa)
    
    # Verificar se o usuário curtiu este post
    user_curtiu = False
    if user_id:
        user_curtiu = bool(db.session.execute(
            db.select(Curtida).where(
                Curtida.post_id == post.id,
                (Curtida.candidato_id == user_id) | (Curtida.empresa_id == user_id)
            )
        ).scalar())
    
    return {
        'id': post.id,
        'conteudo': post.conteudo,
        'tipo': post.tipo,
        'autor': autor_data,
        'created_at': post.created_at.isoformat() if post.created_at else None,
        'curtidas': post.curtidas.count(),
        'comentarios': post.comentarios.count(),
        'usuario_curtiu': user_curtiu
    }

def _serializar_comentario_completo(comentario, user_id=None):
    """Serializa um comentário com respostas"""
    autor_data = _serializar_autor(comentario.candidato, comentario.empresa)
    
    user_curtiu = False
    if user_id:
        user_curtiu = bool(db.session.execute(
            db.select(CurtidaComentario).where(
                CurtidaComentario.comentario_id == comentario.id,
                (CurtidaComentario.candidato_id == user_id) | (CurtidaComentario.empresa_id == user_id)
            )
        ).scalar())
    
    # Respostas
    respostas = []
    if comentario.respostas:
        for resposta in comentario.respostas:
            respostas.append(_serializar_comentario_completo(resposta, user_id))
    
    return {
        'id': comentario.id,
        'conteudo': comentario.conteudo,
        'autor': autor_data,
        'created_at': comentario.created_at.isoformat() if comentario.created_at else None,
        'curtidas': comentario.curtidas_comentario.count() if comentario.curtidas_comentario else 0,
        'respostas': respostas,
        'usuario_curtiu': user_curtiu
    }

def _criar_notificacao(user_id, tipo, titulo, mensagem, link=None):
    """Helper para criar notificações"""
    try:
        notif = Notificacao(
            user_id=user_id,
            tipo=tipo,
            titulo=titulo,
            mensagem=mensagem,
            link=link,
            lida=False
        )
        db.session.add(notif)
        db.session.commit()
        return notif
    except Exception as e:
        logger.error(f"Erro ao criar notificação: {e}")
        db.session.rollback()
        return None

# ========== ROTAS DE POSTS ==========

@posts_feed_bp.route('/feed', methods=['GET'])
def listar_feed():
    """Lista posts para o feed (público)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Buscar posts ordenados por data, mais recentes primeiro
    stmt = db.select(Post).order_by(Post.created_at.desc())
    pagination = db.paginate(stmt, page=page, per_page=per_page)
    
    user_id = None
    try:
        # Se houver token, pega o user_id para saber se curtiu
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
    except:
        pass
    
    posts = [_serializar_post_completo(p, user_id) for p in pagination.items]
    return jsonify({
        'posts': posts,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@posts_feed_bp.route('/', methods=['POST'])
@jwt_required()
def criar_post():
    """Criar novo post"""
    claims = get_jwt()
    data = request.get_json()
    
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo é obrigatório'}), 400
    
    post = Post(
        conteudo=data['conteudo'],
        tipo=data.get('tipo', 'texto')
    )
    
    if claims.get('tipo') == 'candidato':
        post.candidato_id = claims.get('candidato_id')
    else:
        post.empresa_id = claims.get('empresa_id')
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'post': _serializar_post_completo(post),
        'message': 'Post criado com sucesso'
    }), 201

@posts_feed_bp.route('/<int:post_id>', methods=['GET'])
def obter_post(post_id):
    """Obter detalhes de um post"""
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    user_id = None
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
    except:
        pass
    
    return jsonify({'post': _serializar_post_completo(post, user_id)}), 200

# ========== ROTAS DE CURTIDAS ==========

@posts_feed_bp.route('/<int:post_id>/curtir', methods=['POST'])
@jwt_required()
def curtir_post(post_id):
    """Curtir um post"""
    claims = get_jwt()
    post = db.session.get(Post, post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    # Verificar se já curtiu
    candidato_id = claims.get('candidato_id') if claims.get('tipo') == 'candidato' else None
    empresa_id = claims.get('empresa_id') if claims.get('tipo') == 'empresa' else None
    
    curtida_existente = db.session.execute(
        db.select(Curtida).where(
            Curtida.post_id == post_id,
            (Curtida.candidato_id == candidato_id) | (Curtida.empresa_id == empresa_id)
        )
    ).scalar()
    
    if curtida_existente:
        return jsonify({'error': 'Você já curtiu este post'}), 400
    
    # Criar curtida
    curtida = Curtida(
        post_id=post_id,
        candidato_id=candidato_id,
        empresa_id=empresa_id
    )
    db.session.add(curtida)
    db.session.commit()
    
    # Criar notificação para o autor do post
    autor = post.autor_candidato or post.autor_empresa
    if autor and autor.user_id:
        autor_curtiu = None
        if claims.get('tipo') == 'candidato':
            autor_curtiu = db.session.get(Candidato, claims.get('candidato_id'))
        else:
            autor_curtiu = db.session.get(Empresa, claims.get('empresa_id'))

        if autor_curtiu:
            autor_curtida = _serializar_autor(autor_curtiu if claims.get('tipo') == 'candidato' else None,
                                             autor_curtiu if claims.get('tipo') == 'empresa' else None)
            _criar_notificacao(
                autor.user_id,
                'curtida',
                f'{autor_curtida["nome"]} curtiu seu post',
                f'{autor_curtida["nome"]} ({autor_curtida["tipo"]}) curtiu: "{post.conteudo[:50]}..."',
                f'/posts/{post_id}'
            )
    
    return jsonify({
        'message': 'Post curtido com sucesso',
        'curtidas': post.curtidas.count() + 1
    }), 201

@posts_feed_bp.route('/<int:post_id>/descurtir', methods=['POST'])
@jwt_required()
def descurtir_post(post_id):
    """Remover curtida de um post"""
    claims = get_jwt()
    
    candidato_id = claims.get('candidato_id') if claims.get('tipo') == 'candidato' else None
    empresa_id = claims.get('empresa_id') if claims.get('tipo') == 'empresa' else None
    
    curtida = db.session.execute(
        db.select(Curtida).where(
            Curtida.post_id == post_id,
            (Curtida.candidato_id == candidato_id) | (Curtida.empresa_id == empresa_id)
        )
    ).scalar()
    
    if not curtida:
        return jsonify({'error': 'Você não curtiu este post'}), 404
    
    db.session.delete(curtida)
    db.session.commit()
    
    post = db.session.get(Post, post_id)
    return jsonify({
        'message': 'Curtida removida',
        'curtidas': post.curtidas.count()
    }), 200

# ========== ROTAS DE COMENTÁRIOS ==========

@posts_feed_bp.route('/<int:post_id>/comentarios', methods=['GET'])
def listar_comentarios(post_id):
    """Listar comentários de um post"""
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    user_id = None
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
    except:
        pass
    
    # Apenas comentários de nível superior (sem pai)
    comentarios = db.session.execute(
        db.select(Comentario)
        .where(Comentario.post_id == post_id, Comentario.comentario_pai_id.is_(None))
        .order_by(Comentario.created_at.desc())
    ).scalars().all()
    
    return jsonify({
        'comentarios': [_serializar_comentario_completo(c, user_id) for c in comentarios],
        'total': len(comentarios)
    }), 200

@posts_feed_bp.route('/<int:post_id>/comentarios', methods=['POST'])
@jwt_required()
def comentar_post(post_id):
    """Criar comentário em um post"""
    claims = get_jwt()
    post = db.session.get(Post, post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    data = request.get_json()
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo é obrigatório'}), 400
    
    comentario = Comentario(
        post_id=post_id,
        conteudo=data['conteudo']
    )
    
    if claims.get('tipo') == 'candidato':
        comentario.candidato_id = claims.get('candidato_id')
    else:
        comentario.empresa_id = claims.get('empresa_id')
    
    db.session.add(comentario)
    db.session.commit()
    
    # Criar notificação para o autor do post
    autor_post = post.autor_candidato or post.autor_empresa
    if autor_post and autor_post.user_id:
        _criar_notificacao(
            autor_post.user_id,
            'comentario',
            f'Novo comentário em seu post',
            f'{_serializar_autor(comentario.candidato, comentario.empresa)["nome"]}: "{data["conteudo"][:50]}..."',
            f'/posts/{post_id}'
        )
    
    return jsonify({
        'comentario': _serializar_comentario_completo(comentario),
        'message': 'Comentário adicionado'
    }), 201

@posts_feed_bp.route('/comentarios/<int:comentario_id>/responder', methods=['POST'])
@jwt_required()
def responder_comentario(comentario_id):
    """Responder um comentário"""
    claims = get_jwt()
    comentario_pai = db.session.get(Comentario, comentario_id)
    
    if not comentario_pai:
        return jsonify({'error': 'Comentário não encontrado'}), 404
    
    data = request.get_json()
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo é obrigatório'}), 400
    
    resposta = Comentario(
        post_id=comentario_pai.post_id,
        conteudo=data['conteudo'],
        comentario_pai_id=comentario_id
    )
    
    if claims.get('tipo') == 'candidato':
        resposta.candidato_id = claims.get('candidato_id')
    else:
        resposta.empresa_id = claims.get('empresa_id')
    
    db.session.add(resposta)
    db.session.commit()
    
    # Notificar autor do comentário original
    if comentario_pai.candidato and comentario_pai.candidato.user_id:
        _criar_notificacao(
            comentario_pai.candidato.user_id,
            'resposta',
            'Nova resposta ao seu comentário',
            data['conteudo'][:100],
            f'/posts/{comentario_pai.post_id}'
        )
    elif comentario_pai.empresa and comentario_pai.empresa.user_id:
        _criar_notificacao(
            comentario_pai.empresa.user_id,
            'resposta',
            'Nova resposta ao seu comentário',
            data['conteudo'][:100],
            f'/posts/{comentario_pai.post_id}'
        )
    
    return jsonify({
        'resposta': _serializar_comentario_completo(resposta),
        'message': 'Resposta adicionada'
    }), 201

@posts_feed_bp.route('/comentarios/<int:comentario_id>/curtir', methods=['POST'])
@jwt_required()
def curtir_comentario(comentario_id):
    """Curtir um comentário"""
    claims = get_jwt()
    comentario = db.session.get(Comentario, comentario_id)
    
    if not comentario:
        return jsonify({'error': 'Comentário não encontrado'}), 404
    
    candidato_id = claims.get('candidato_id') if claims.get('tipo') == 'candidato' else None
    empresa_id = claims.get('empresa_id') if claims.get('tipo') == 'empresa' else None
    
    curtida_existente = db.session.execute(
        db.select(CurtidaComentario).where(
            CurtidaComentario.comentario_id == comentario_id,
            (CurtidaComentario.candidato_id == candidato_id) | (CurtidaComentario.empresa_id == empresa_id)
        )
    ).scalar()
    
    if curtida_existente:
        return jsonify({'error': 'Você já curtiu este comentário'}), 400
    
    curtida = CurtidaComentario(
        comentario_id=comentario_id,
        candidato_id=candidato_id,
        empresa_id=empresa_id
    )
    db.session.add(curtida)
    db.session.commit()
    
    return jsonify({
        'message': 'Comentário curtido',
        'curtidas': comentario.curtidas_comentario.count()
    }), 201

# ========== ROTAS DE NOTIFICAÇÕES DE FEED ==========

@posts_feed_bp.route('/notificacoes/nao-lidas', methods=['GET'])
@jwt_required()
def obter_notificacoes_feed():
    """Obter notificações não lidas (posts, curtidas, comentários)"""
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    
    notificacoes = db.session.execute(
        db.select(Notificacao)
        .where(Notificacao.user_id == user_id, Notificacao.lida == False)
        .order_by(Notificacao.created_at.desc())
        .limit(50)
    ).scalars().all()
    
    return jsonify({
        'notificacoes': [{
            'id': n.id,
            'tipo': n.tipo,
            'titulo': n.titulo,
            'mensagem': n.mensagem,
            'link': n.link,
            'created_at': n.created_at.isoformat() if n.created_at else None
        } for n in notificacoes]
    }), 200
