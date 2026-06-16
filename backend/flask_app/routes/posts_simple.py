from flask import Blueprint, request, jsonify
from datetime import datetime

posts_simple_bp = Blueprint('posts_simple', __name__)

# In-memory post store (fallback when DB isn't available)
POSTS = [
    {
        'id': 'dummy-1',
        'autor': {'id': 'user-1', 'nome': 'João Silva', 'tipo': 'candidato'},
        'conteudo': 'Olá pessoal! Comecei a procurar por um novo desafio profissional 🚀',
        'timestamp': datetime.now().isoformat(),
        'likes': 5,
        'comentarios': []
    },
    {
        'id': 'dummy-2',
        'autor': {'id': 'user-2', 'nome': 'Tech Empresa', 'tipo': 'empresa'},
        'conteudo': 'Estamos contratando! Procuramos desenvolvedores Full Stack com experiência em React e Node.js 💼',
        'timestamp': datetime.now().isoformat(),
        'likes': 12,
        'comentarios': []
    }
]

# In-memory notifications for fallback
NOTIFICATIONS = []

def create_notification(user_id, titulo, mensagem, tipo='info', referencia_tipo=None, referencia_id=None):
    n = {
        'id': f'notif-{int(datetime.now().timestamp()*1000)}-{len(NOTIFICATIONS)+1}',
        'user_id': user_id,
        'titulo': titulo,
        'mensagem': mensagem,
        'tipo': tipo,
        'referencia_tipo': referencia_tipo,
        'referencia_id': referencia_id,
        'lida': False,
        'created_at': datetime.now().isoformat()
    }
    NOTIFICATIONS.append(n)
    return n

@posts_simple_bp.route('/', methods=['GET'])
def get_posts_simple():
    """Get all posts (simple version, no DB dependency)"""
    return jsonify({
        'posts': POSTS,
        'total': len(POSTS),
        'source': 'fallback'
    }), 200

@posts_simple_bp.route('/', methods=['POST'])
def create_post_simple():
    """Create a new post (simple version, in-memory)"""
    data = request.get_json()
    
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo é obrigatório'}), 400
    
    new_post = {
        'id': f'post-{len(POSTS) + 1}',
        'autor': {
            'id': data.get('autor_id', 'anonymous'),
            'nome': data.get('autor_nome', 'Usuário'),
            'tipo': data.get('autor_tipo', 'candidato')
        },
        'conteudo': data['conteudo'],
        'timestamp': datetime.now().isoformat(),
        'likes': 0,
        'comentarios': []
    }
    
    POSTS.append(new_post)
    
    return jsonify({
        'post': new_post,
        'message': 'Post criado com sucesso',
        'source': 'fallback'
    }), 201

@posts_simple_bp.route('/<post_id>', methods=['GET'])
def get_post_simple(post_id):
    """Get a specific post"""
    post = next((p for p in POSTS if p['id'] == post_id), None)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    return jsonify({'post': post}), 200

@posts_simple_bp.route('/<post_id>', methods=['DELETE'])
def delete_post_simple(post_id):
    """Delete a post"""
    global POSTS
    
    post = next((p for p in POSTS if p['id'] == post_id), None)
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    POSTS = [p for p in POSTS if p['id'] != post_id]
    
    return jsonify({'message': 'Post deletado com sucesso'}), 200

@posts_simple_bp.route('/<post_id>/like', methods=['POST'])
def like_post_simple(post_id):
    """Like a post"""
    post = next((p for p in POSTS if p['id'] == post_id), None)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    post['likes'] = post.get('likes', 0) + 1
    # criar notificação para o dono do post
    try:
        actor_name = request.json.get('autor_nome') if request.is_json else None
        create_notification(post.get('autor', {}).get('id'), 'Seu post recebeu um like', f"{actor_name or 'Alguém'} curtiu seu post.", tipo='like', referencia_tipo='post', referencia_id=post_id)
    except Exception:
        pass

    return jsonify({
        'post': post,
        'message': 'Like adicionado'
    }), 200

@posts_simple_bp.route('/<post_id>/comentario', methods=['POST'])
def add_comment_simple(post_id):
    """Add a comment to a post"""
    post = next((p for p in POSTS if p['id'] == post_id), None)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    data = request.get_json()
    if not data or not data.get('conteudo'):
        return jsonify({'error': 'Conteúdo do comentário é obrigatório'}), 400
    
    comentario = {
        'id': f'comment-{len(post.get("comentarios", []))+1}',
        'conteudo': data['conteudo'],
        'autor': {
            'id': data.get('autor_id', 'anonymous'),
            'nome': data.get('autor_nome', 'Usuário'),
            'tipo': data.get('autor_tipo', 'candidato')
        },
        'created_at': datetime.now().isoformat()
    }
    
    post['comentarios'] = post.get('comentarios', [])
    post['comentarios'].append(comentario)
    # notificar dono do post
    try:
        actor_name = comentario.get('autor', {}).get('nome')
        create_notification(post.get('autor', {}).get('id'), 'Novo comentário no seu post', f"{actor_name or 'Alguém'} comentou: \"{(comentario.get('conteudo') or '')[:80]}\"", tipo='comentario', referencia_tipo='post', referencia_id=post_id)
    except Exception:
        pass

    return jsonify({
        'post': post,
        'comentario': comentario,
        'message': 'Comentário adicionado'
    }), 201


@posts_simple_bp.route('/<post_id>/comentario/<comment_id>/like', methods=['POST'])
def like_comment_simple(post_id, comment_id):
    post = next((p for p in POSTS if p['id'] == post_id), None)
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404

    comment = next((c for c in post.get('comentarios', []) if c.get('id') == comment_id), None)
    if not comment:
        return jsonify({'error': 'Comentário não encontrado'}), 404

    comment['likes'] = comment.get('likes', 0) + 1

    # notificar autor do comentário
    try:
        actor_name = request.json.get('autor_nome') if request.is_json else None
        create_notification(comment.get('autor', {}).get('id'), 'Seu comentário recebeu um like', f"{actor_name or 'Alguém'} curtiu seu comentário.", tipo='like', referencia_tipo='comentario', referencia_id=comment_id)
    except Exception:
        pass

    return jsonify({'post': post, 'comment': comment, 'message': 'Like no comentário adicionado'})


@posts_simple_bp.route('/notificacoes', methods=['GET'])
def list_notifications_simple():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'notificacoes': []})
    user_notifs = [n for n in NOTIFICATIONS if str(n.get('user_id')) == str(user_id)]
    user_notifs = sorted(user_notifs, key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify({'notificacoes': user_notifs})


@posts_simple_bp.route('/notificacoes/count', methods=['GET'])
def count_notifications_simple():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'unread_count': 0})
    count = sum(1 for n in NOTIFICATIONS if str(n.get('user_id')) == str(user_id) and not n.get('lida'))
    return jsonify({'unread_count': count})


@posts_simple_bp.route('/notificacoes/unread', methods=['GET'])
def unread_notifications_simple():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'data': []})
    user_notifs = [n for n in NOTIFICATIONS if str(n.get('user_id')) == str(user_id) and not n.get('lida')]
    user_notifs = sorted(user_notifs, key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify({'data': user_notifs})


@posts_simple_bp.route('/notificacoes/<notif_id>/mark-read', methods=['POST'])
def mark_notification_read_simple(notif_id):
    n = next((x for x in NOTIFICATIONS if x.get('id') == notif_id), None)
    if not n:
        return jsonify({'error': 'Notificação não encontrada'}), 404
    n['lida'] = True
    return jsonify({'data': n})
