from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

import os
import uuid
from werkzeug.utils import secure_filename

from extensions import db
from models import Vaga, Empresa, Candidatura, Candidato, Curriculo, Notificacao

vagas_bp = Blueprint('vagas', __name__)

ALLOWED_FILE_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE = 20 * 1024 * 1024


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_FILE_EXTENSIONS


def save_curriculo_file(file, candidato):
    if file.filename == '':
        raise ValueError('Arquivo inválido')

    if not allowed_file(file.filename):
        raise ValueError('Formato não permitido. Use PDF ou DOCX')

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise ValueError('Arquivo muito grande (máximo 20MB)')

    file_header = file.read(4)
    file.seek(0)
    ext = file.filename.lower().rsplit('.', 1)[1]
    if ext == 'pdf' and not file_header.startswith(b'%PDF'):
        raise ValueError('Arquivo PDF inválido')
    elif ext == 'docx' and file_header != b'PK\x03\x04':
        raise ValueError('Arquivo DOCX inválido')

    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, filename)
    file.save(filepath)

    curriculo = db.session.execute(db.select(Curriculo).where(Curriculo.candidato_id == candidato.id)).scalar_one_or_none()
    if not curriculo:
        curriculo = Curriculo(candidato_id=candidato.id, arquivo_url=filename)
        db.session.add(curriculo)
    else:
        if curriculo.arquivo_url:
            old_filepath = os.path.join(uploads_dir, curriculo.arquivo_url)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        curriculo.arquivo_url = filename

    db.session.flush()
    return curriculo


@vagas_bp.route('/', methods=['GET'])
def list_vagas():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    empresa_id = request.args.get('empresa_id')


    try:
        claims = get_jwt()
    except Exception:
        claims = {}
    print(f"[VAGAS] list_vagas chamada - args={dict(request.args)} auth_header_present={bool(request.headers.get('Authorization'))} claims={claims}")


    if not empresa_id:
        if claims and claims.get('tipo') == 'empresa':
            empresa_id = claims.get('empresa_id')

    query = db.session.query(Vaga)
    if empresa_id:
        try:
            query = query.filter(Vaga.empresa_id == int(empresa_id))
        except ValueError:

            pass
    query = query.filter(Vaga.ativa == True)

    total = query.count()
    vagas = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for v in vagas:
        items.append({
            'id': v.id,
            'empresa_id': v.empresa_id,
            'titulo': v.titulo,
            'descricao': v.descricao,
            'requisitos': v.requisitos,
            'tipo_contrato': v.tipo_contrato,
            'localizacao': v.localizacao,
            'salario_min': float(v.salario_min) if v.salario_min is not None else None,
            'salario_max': float(v.salario_max) if v.salario_max is not None else None,
            'ativa': bool(v.ativa)
        })

    return jsonify({'total': total, 'page': page, 'per_page': per_page, 'vagas': items})


@vagas_bp.route('/<int:vaga_id>', methods=['GET'])
def get_vaga(vaga_id):
    vaga = db.session.get(Vaga, vaga_id)
    if not vaga:
        return jsonify({'error': 'Vaga não encontrada'}), 404

    return jsonify({
        'id': vaga.id,
        'empresa_id': vaga.empresa_id,
        'titulo': vaga.titulo,
        'descricao': vaga.descricao,
        'requisitos': vaga.requisitos,
        'tipo_contrato': vaga.tipo_contrato,
        'localizacao': vaga.localizacao,
        'salario_min': float(vaga.salario_min) if vaga.salario_min is not None else None,
        'salario_max': float(vaga.salario_max) if vaga.salario_max is not None else None,
        'ativa': bool(vaga.ativa)
    })


@vagas_bp.route('/', methods=['POST'])
@jwt_required()
def create_vaga():
    try:
        claims = get_jwt()
        if claims.get('tipo') != 'empresa':
            return jsonify({'error': 'Apenas empresas podem criar vagas'}), 403

        user_id = get_jwt_identity()
        empresa = db.session.execute(db.select(Empresa).where(Empresa.user_id == user_id)).scalar_one_or_none()
        if not empresa:
            return jsonify({'error': 'Empresa não encontrada'}), 404

        data = request.get_json() or {}


        try:
            salario_min = float(data.get('salario_min')) if data.get('salario_min') else None
        except (ValueError, TypeError):
            salario_min = None

        try:
            salario_max = float(data.get('salario_max')) if data.get('salario_max') else None
        except (ValueError, TypeError):
            salario_max = None

        vaga = Vaga(
            empresa_id=empresa.id,
            titulo=data.get('titulo', 'Vaga sem título'),
            descricao=data.get('descricao'),
            requisitos=data.get('requisitos', []),
            tipo_contrato=data.get('tipo_contrato'),
            localizacao=data.get('localizacao'),
            salario_min=salario_min,
            salario_max=salario_max,
            ativa=data.get('ativa', True)
        )

        db.session.add(vaga)
        db.session.commit()
        return jsonify({'vaga_id': vaga.id}), 201
    except Exception as e:
        print(f"Erro ao criar vaga: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': f'Erro ao salvar vaga: {str(e)}'}), 500


@vagas_bp.route('/<int:vaga_id>', methods=['PATCH'])
@jwt_required()
def update_vaga(vaga_id):
    claims = get_jwt()
    if claims.get('tipo') != 'empresa':
        return jsonify({'error': 'Apenas empresas podem atualizar vagas'}), 403

    user_id = get_jwt_identity()
    empresa = db.session.execute(db.select(Empresa).where(Empresa.user_id == user_id)).scalar_one_or_none()
    if not empresa:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    vaga = db.session.get(Vaga, vaga_id)
    if not vaga:
        return jsonify({'error': 'Vaga não encontrada'}), 404

    if vaga.empresa_id != empresa.id:
        return jsonify({'error': 'Permissão negada'}), 403

    data = request.get_json() or {}
    for field in ('titulo', 'descricao', 'requisitos', 'tipo_contrato', 'localizacao', 'salario_min', 'salario_max', 'ativa'):
        if field in data:
            setattr(vaga, field, data[field])

    db.session.commit()
    return jsonify({'message': 'Vaga atualizada'})


@vagas_bp.route('/candidaturas', methods=['POST'])
@jwt_required()
def create_candidatura():
    claims = get_jwt()
    if claims.get('tipo') != 'candidato':
        return jsonify({'error': 'Apenas candidatos podem se candidatar'}), 403

    user_id = get_jwt_identity()
    candidato = db.session.execute(db.select(Candidato).where(Candidato.user_id == user_id)).scalar_one_or_none()
    if not candidato:
        return jsonify({'error': 'Candidato não encontrado'}), 404

    file = None
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict() or {}
        file = request.files.get('file')
    else:
        data = request.get_json() or {}

    vaga_id = data.get('vaga_id')
    if not vaga_id:
        return jsonify({'error': 'vaga_id é obrigatório'}), 400

    vaga = db.session.get(Vaga, vaga_id)
    if not vaga:
        return jsonify({'error': 'Vaga não encontrada'}), 404

    existing = db.session.execute(db.select(Candidatura).where(Candidatura.vaga_id == vaga.id, Candidatura.candidato_id == candidato.id)).scalar_one_or_none()
    if existing:
        return jsonify({'error': 'Já existe uma candidatura para esta vaga'}), 409

    if file:
        try:
            curriculo = save_curriculo_file(file, candidato)
        except ValueError as err:
            return jsonify({'error': str(err)}), 400
    else:
        curriculo = candidato.curriculo

    def curriculo_tem_dados(curr):
        if not curr:
            return False
        if getattr(curr, 'arquivo_url', None):
            return True
        if getattr(curr, 'habilidades', None):
            if isinstance(curr.habilidades, list) and len(curr.habilidades) > 0:
                return True
        if getattr(curr, 'idiomas', None):
            if isinstance(curr.idiomas, list) and len(curr.idiomas) > 0:
                return True
        if getattr(curr, 'experiencia', None):
            if isinstance(curr.experiencia, list) and len(curr.experiencia) > 0:
                return True
        if getattr(curr, 'educacao', None):
            if isinstance(curr.educacao, list) and len(curr.educacao) > 0:
                return True
        return False

    if not curriculo_tem_dados(curriculo):
        return jsonify({'error': 'É necessário ter um currículo no perfil antes de se candidatar a uma vaga.'}), 400

    cand = Candidatura(vaga_id=vaga.id, candidato_id=candidato.id, status='pendente')
    db.session.add(cand)
    db.session.commit()

    # análise automática simples (placeholder) - gera score_analise e feedback
    try:
        curriculo = candidato.curriculo
        requisitos = vaga.requisitos or []
        habilidades = []
        if curriculo:
            habilidades = curriculo.habilidades or []

        # normalizar strings para comparação
        req_set = set([str(r).strip().lower() for r in requisitos if r])
        hab_set = set([str(h).strip().lower() for h in (habilidades or []) if h])

        matches = len(req_set.intersection(hab_set)) if req_set else 0
        if req_set:
            score = int((matches / max(1, len(req_set))) * 100)
        else:
            score = 50

        cand.score_analise = score
        cand.feedback = f'Análise automática: score {score}, matches: {matches} de {len(req_set)}'
        db.session.commit()

        # calcular ranking simples entre candidaturas já analisadas para esta vaga
        analisadas = db.session.execute(db.select(Candidatura).where(Candidatura.vaga_id == vaga.id, Candidatura.score_analise != None)).scalars().all()
        ranking = None
        if analisadas and len(analisadas) > 1:
            sorted_list = sorted(analisadas, key=lambda c: float(c.score_analise or 0), reverse=True)
            for idx, cobj in enumerate(sorted_list, start=1):
                if cobj.id == cand.id:
                    ranking = idx
                    break

        # criar notificação para o candidato informando que a candidatura foi recebida
        # NÃO enviar o score automático ao candidato antes da análise manual da empresa
        try:
            user_id = candidato.user_id
            titulo = 'Candidatura recebida'
            mensagem = f'Sua candidatura para "{vaga.titulo}" foi recebida e está em análise pela empresa. Você será notificado quando houver uma decisão.'

            notif = Notificacao(user_id=user_id, tipo='candidatura', titulo=titulo, mensagem=mensagem)
            db.session.add(notif)
            db.session.commit()
        except Exception:
            db.session.rollback()
    except Exception:
        db.session.rollback()

    return jsonify({
        'candidatura_id': cand.id,
        'score_analise': float(cand.score_analise) if cand.score_analise else None,
        'ranking': ranking
    }), 201


@vagas_bp.route('/candidaturas/by_empresa/<int:empresa_id>', methods=['GET'])
@jwt_required()
def get_candidaturas_empresa(empresa_id):

    claims = get_jwt()
    user_id = get_jwt_identity()


    empresa = db.session.execute(db.select(Empresa).where(Empresa.user_id == user_id)).scalar_one_or_none()
    if not empresa or empresa.id != empresa_id:
        return jsonify({'error': 'Permissão negada'}), 403


    candidaturas = db.session.execute(
        db.select(Candidatura).join(Vaga).where(Vaga.empresa_id == empresa_id)
    ).scalars().all()

    # agrupa candidaturas por vaga para calcular ranking somente quando há mais de um candidato analisado
    vagas_por_id = {}
    for cand in candidaturas:
        vagas_por_id.setdefault(cand.vaga_id, []).append(cand)

    items = []
    for vaga_id, grupo in vagas_por_id.items():
        analisadas = [c for c in grupo if c.score_analise is not None]
        ranking_map = {}
        if len(analisadas) > 1:
            sorted_list = sorted(analisadas, key=lambda c: float(c.score_analise or 0), reverse=True)
            ranking_map = {c.id: idx + 1 for idx, c in enumerate(sorted_list)}

        for cand in grupo:
            items.append({
                'id': cand.id,
                'vaga_id': cand.vaga_id,
                'candidato_id': cand.candidato_id,
                'status': cand.status,
                'score_analise': float(cand.score_analise) if cand.score_analise else None,
                'ranking': ranking_map.get(cand.id),
                'feedback': cand.feedback,
                'created_at': cand.created_at.isoformat() if cand.created_at else None,
                'vaga': {
                    'id': cand.vaga.id,
                    'titulo': cand.vaga.titulo,
                    'empresa_id': cand.vaga.empresa_id
                },
                'candidato': {
                    'id': cand.candidato.id,
                    'nome': cand.candidato.nome,
                    'email': cand.candidato.user.email if cand.candidato.user else None
                }
            })

    return jsonify({'candidaturas': items})


@vagas_bp.route('/candidaturas/<int:candidatura_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_candidatura(candidatura_id):
    claims = get_jwt()
    data = request.get_json() or {}

    cand = db.session.get(Candidatura, candidatura_id)
    if not cand:
        return jsonify({'error': 'Candidatura não encontrada'}), 404

    user_id = get_jwt_identity()
    if claims.get('tipo') == 'empresa':
        empresa = db.session.execute(db.select(Empresa).where(Empresa.user_id == user_id)).scalar_one_or_none()
        if not empresa or empresa.id != cand.vaga.empresa_id:
            return jsonify({'error': 'Permissão negada'}), 403

        if 'status' in data:
            cand.status = data['status']
        if 'feedback' in data:
            cand.feedback = data['feedback']
        if 'score_analise' in data:
            cand.score_analise = data['score_analise']

        db.session.commit()

        if 'status' in data and data['status'] in ['aprovado', 'rejeitado']:
            try:
                titulo = 'Candidatura aprovada' if data['status'] == 'aprovado' else 'Candidatura não selecionada'
                mensagem = f'Sua candidatura para "{cand.vaga.titulo}" foi {"aprovada" if data["status"] == "aprovado" else "rejeitada"}. '
                mensagem += 'Confira o resultado na área de resultados do seu CV.'
                notificacao = Notificacao(
                    user_id=cand.candidato.user_id,
                    tipo='candidatura',
                    titulo=titulo,
                    mensagem=mensagem
                )
                db.session.add(notificacao)
                db.session.commit()
            except Exception:
                db.session.rollback()

        return jsonify({'message': 'Candidatura atualizada'})

    elif claims.get('tipo') == 'candidato':
        candidato = db.session.execute(db.select(Candidato).where(Candidato.user_id == user_id)).scalar_one_or_none()
        if not candidato or candidato.id != cand.candidato_id:
            return jsonify({'error': 'Permissão negada'}), 403

        if 'status' in data and data['status'] in ['cancelado', 'retirado']:
            cand.status = data['status']
            db.session.commit()
            return jsonify({'message': 'Candidatura atualizada'})

        return jsonify({'error': 'Permissão negada'}), 403

    else:
        return jsonify({'error': 'Permissão negada'}), 403