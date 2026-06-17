from flask import Blueprint, request, jsonify, current_app, send_from_directory

from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

import os



from werkzeug.utils import secure_filename

import uuid

from sqlalchemy.orm import joinedload

from extensions import db

from models import Curriculo, Candidato, Vaga, Candidatura, Empresa

from utils.ia_curriculum_analyzer import analyzer, ChatIA



curriculos_bp = Blueprint('curriculos', __name__)



ALLOWED_EXTENSIONS = {'pdf', 'docx'}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB por arquivo
MAX_UPLOAD_FILES = 250  





def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def resolve_vaga_by_id_or_ordinal(vaga_id, user_id):
    vaga = db.session.get(Vaga, vaga_id)
    if vaga:
        return vaga

    if not user_id or vaga_id < 1:
        return None

    empresa = db.session.execute(
        db.select(Empresa).where(Empresa.user_id == user_id)
    ).scalar_one_or_none()
    if not empresa:
        return None

    return db.session.execute(
        db.select(Vaga)
            .where(Vaga.empresa_id == empresa.id, Vaga.ativa == True)
            .order_by(Vaga.created_at.asc(), Vaga.id.asc())
            .offset(vaga_id - 1)
            .limit(1)
    ).scalar_one_or_none()




@curriculos_bp.route('/upload', methods=['POST'])

@jwt_required()

def upload_curriculo():

    user_id = get_jwt_identity()

    candidato = db.session.execute(db.select(Candidato).where(Candidato.user_id == user_id)).scalar_one_or_none()

    if not candidato:

        return jsonify({'error': 'Candidato não encontrado'}), 404



    if 'file' not in request.files:

        return jsonify({'error': 'Arquivo não enviado'}), 400



    file = request.files['file']

    if file.filename == '':

        return jsonify({'error': 'Arquivo inválido'}), 400





    if not allowed_file(file.filename):

        return jsonify({'error': 'Formato não permitido. Use PDF ou DOCX'}), 415





    file.seek(0, os.SEEK_END)

    file_size = file.tell()

    file.seek(0)

    if file_size > MAX_FILE_SIZE:

        return jsonify({'error': 'Arquivo muito grande (máximo 5MB)'}), 413





    file_header = file.read(4)

    file.seek(0)

    if file.filename.lower().endswith('.pdf') and not file_header.startswith(b'%PDF'):

        return jsonify({'error': 'Arquivo PDF inválido'}), 415

    elif file.filename.lower().endswith('.docx') and file_header != b'PK\x03\x04':

        return jsonify({'error': 'Arquivo DOCX inválido'}), 415





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



    db.session.commit()

    return jsonify({'message': 'Currículo enviado', 'curriculo_id': curriculo.id, 'arquivo_url': filename})





@curriculos_bp.route('/parse', methods=['POST'])

@jwt_required()

def parse_curriculo():

    user_id = get_jwt_identity()

    candidato = db.session.execute(db.select(Candidato).where(Candidato.user_id == user_id)).scalar_one_or_none()

    if not candidato:

        return jsonify({'error': 'Candidato não encontrado'}), 404



    data = request.get_json() or {}

    experiencia = data.get('experiencia', [])

    educacao = data.get('educacao', [])

    habilidades = data.get('habilidades', [])

    idiomas = data.get('idiomas', [])



    curriculo = db.session.execute(db.select(Curriculo).where(Curriculo.candidato_id == candidato.id)).scalar_one_or_none()

    if not curriculo:

        curriculo = Curriculo(candidato_id=candidato.id)

        db.session.add(curriculo)



    curriculo.experiencia = experiencia

    curriculo.educacao = educacao

    curriculo.habilidades = habilidades

    curriculo.idiomas = idiomas



    db.session.commit()

    return jsonify({'message': 'Currículo salvo', 'curriculo_id': curriculo.id})





@curriculos_bp.route('/<int:curriculo_id>', methods=['GET'])

@jwt_required()

def get_curriculo(curriculo_id):

    curriculo = db.session.get(Curriculo, curriculo_id)

    if not curriculo:

        return jsonify({'error': 'Currículo não encontrado'}), 404



    return jsonify({

        'id': curriculo.id,

        'candidato_id': curriculo.candidato_id,

        'experiencia': curriculo.experiencia,

        'educacao': curriculo.educacao,

        'habilidades': curriculo.habilidades,

        'idiomas': curriculo.idiomas,

        'arquivo_url': curriculo.arquivo_url
    })


@curriculos_bp.route('/<int:curriculo_id>', methods=['DELETE'])
@jwt_required()
def delete_curriculo(curriculo_id):
    curriculo = db.session.get(Curriculo, curriculo_id)
    if not curriculo:
        return jsonify({'error': 'Currículo não encontrado'}), 404

    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    filepath = os.path.join(uploads_dir, curriculo.arquivo_url) if curriculo.arquivo_url else None
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass

    db.session.delete(curriculo)
    db.session.commit()

    return jsonify({'message': 'Currículo removido com sucesso'})


@curriculos_bp.route('/arquivo/<path:filename>', methods=['GET'])
def get_curriculo_arquivo(filename):
    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    safe_name = secure_filename(filename)
    if safe_name != filename:
        return jsonify({'error': 'Nome de arquivo inválido'}), 400
    return send_from_directory(uploads_dir, filename)





@curriculos_bp.route('/analyze', methods=['POST'])

@jwt_required()

def analyze_curriculo():



    data = request.get_json() or {}

    vaga_id = data.get('vaga_id')

    curriculo_id = data.get('curriculo_id')



    vaga = db.session.get(Vaga, vaga_id)

    curriculo = db.session.get(Curriculo, curriculo_id)

    if not vaga or not curriculo:

        return jsonify({'error': 'Vaga ou currículo não encontrado'}), 404





    requisitos = vaga.requisitos or []

    habilidades = curriculo.habilidades or []





    req_set = set([str(r).strip().lower() for r in requisitos])

    hab_set = set([str(h).strip().lower() for h in habilidades])



    if not req_set:

        score = 0.0

    else:

        matches = req_set.intersection(hab_set)

        score = round((len(matches) / len(req_set)) * 100, 2)





    cand = db.session.execute(db.select(Candidatura).where(Candidatura.vaga_id == vaga.id, Candidatura.candidato_id == curriculo.candidato_id)).scalar_one_or_none()

    if cand:

        cand.score_analise = score

        db.session.commit()



    return jsonify({'vaga_id': vaga.id, 'curriculo_id': curriculo.id, 'compatibility_score': score})









def _extract_text(file_storage):

    if not file_storage or not getattr(file_storage, 'filename', None):
        return {'filename': None, 'text': '', 'error': 'Arquivo inválido.'}

    filename = file_storage.filename
    if not allowed_file(filename):
        return {'filename': filename, 'text': '', 'error': 'Formato não permitido. Use PDF ou DOCX.'}

    # try to check size if possible
    try:
        file_storage.stream.seek(0, os.SEEK_END)
        fsize = file_storage.stream.tell()
        file_storage.stream.seek(0)
        if fsize > MAX_FILE_SIZE:
            mb = MAX_FILE_SIZE // (1024 * 1024)
            return {'filename': filename, 'text': '', 'error': f'Arquivo muito grande (máximo {mb}MB).'}
    except Exception:
        pass

    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)

    safe_name = secure_filename(file_storage.filename)
    filepath = os.path.join(uploads_dir, f"temp_{uuid.uuid4()}_{safe_name}")

    try:
        file_storage.save(filepath)

        # basic header validation
        try:
            with open(filepath, 'rb') as fh:
                header = fh.read(4)
        except Exception:
            header = b''

        if filepath.lower().endswith('.pdf') and not header.startswith(b'%PDF'):
            return {'filename': filename, 'text': '', 'error': 'Arquivo PDF inválido.'}
        if filepath.lower().endswith('.docx') and header != b'PK\x03\x04':
            return {'filename': filename, 'text': '', 'error': 'Arquivo DOCX inválido.'}

        text = analyzer.extract_text_from_file(filepath)
        if not text:
            return {'filename': filename, 'text': '', 'error': 'Não foi possível extrair texto do arquivo.'}

        return {'filename': filename, 'text': text, 'error': None}

    except Exception as e:
        print(f"Erro IA extrair texto {file_storage.filename}: {e}")
        return {'filename': filename, 'text': '', 'error': 'Erro interno ao processar o arquivo.'}
    finally:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass





@curriculos_bp.route('/ia/upload', methods=['POST'])

@jwt_required()

def ia_upload():



    files = request.files.getlist('files')

    if not files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400

    if len(files) > MAX_UPLOAD_FILES:
        return jsonify({
            'error': f'Seu upload excede o limite de {MAX_UPLOAD_FILES} arquivos. Por favor, envie em pacotes menores.'
        }), 413

    texts = []
    errors = []

    for f in files:
        # Assistente só aceita PDFs conforme especificado
        if not f.filename.lower().endswith('.pdf'):
            errors.append({'filename': f.filename, 'error': 'Formato inválido. A assistente aceita apenas arquivos PDF.'})
            continue
        result = _extract_text(f)
        if result.get('error'):
            errors.append({'filename': result.get('filename'), 'error': result.get('error')})
        else:
            texts.append({'filename': result.get('filename'), 'text': result.get('text')})

    response = {
        'texts': texts,
        'errors': errors,
        'processed': len(texts),
        'failed': len(errors)
    }

    if not texts and errors:
        return jsonify({
            'error': 'Nenhum arquivo válido foi processado.',
            **response
        }), 400

    if errors:
        response['message'] = f'{len(texts)} arquivo(s) processado(s) com {len(errors)} falha(s).'

    return jsonify(response)





@curriculos_bp.route('/ia/analyze', methods=['POST'])

@jwt_required()

def ia_analyze():



    data = request.get_json() or {}

    texts = data.get('texts', [])

    requisitos = data.get('requisitos', [])

    results = []

    for idx, text in enumerate(texts):
        analysis = analyzer.analyze_curriculum_v2(text or '', requisitos)
        results.append({'index': idx, **analysis})

    return jsonify({'results': results})


@curriculos_bp.route('/ia/analyze-profile', methods=['POST'])

@jwt_required()

def ia_analyze_profile():
    data = request.get_json() or {}
    profile = data.get('profile') or {}

    curriculo_text = ''
    if isinstance(profile, dict):
        parts = []
        habilidades = profile.get('curriculo', {}).get('habilidades') or []
        idiomas = profile.get('curriculo', {}).get('idiomas') or []
        experiencia = profile.get('curriculo', {}).get('experiencia') or []
        educacao = profile.get('curriculo', {}).get('educacao') or []

        if habilidades:
            parts.append('Habilidades: ' + ', '.join(str(h) for h in habilidades))
        if idiomas:
            parts.append('Idiomas: ' + ', '.join(str(i) for i in idiomas))
        if experiencia:
            for item in experiencia:
                if isinstance(item, dict):
                    parts.append('Experiência: ' + ', '.join(str(v) for v in item.values() if v))
                else:
                    parts.append('Experiência: ' + str(item))
        if educacao:
            parts.append('Educação: ' + ', '.join(str(e) for e in educacao))
        if profile.get('headline'):
            parts.append('Headline: ' + profile.get('headline'))
        if profile.get('sobre'):
            parts.append('Sobre: ' + profile.get('sobre'))

        curriculo_text = '\n'.join(parts).strip()

    analysis = analyzer.analyze_curriculum_v2(curriculo_text, [])
    suggestions = [
        'Melhore a descrição das experiências com resultados mensuráveis.',
        'Inclua palavras-chave da vaga no seu currículo para aumentar a compatibilidade.',
        'Atualize sua formação e idiomas para destacar competências relevantes.'
    ]

    return jsonify({
        'analysis': analysis,
        'suggestions': suggestions
    })


@curriculos_bp.route('/<int:curriculo_id>/status', methods=['PUT'])
@jwt_required()
def update_curriculo_status(curriculo_id):
    """Endpoint para empresas/administradores atualizarem o resultado do currículo."""
    claims = get_jwt()
    tipo = claims.get('tipo')
    if tipo not in ('empresa', 'admin'):
        return jsonify({'error': 'Permissão negada'}), 403

    data = request.get_json() or {}
    status = (data.get('status') or '').lower()
    motivo = data.get('motivo')

    if status not in ('pendente', 'aprovado', 'reprovado'):
        return jsonify({'error': 'Status inválido'}), 400

    curriculo = db.session.get(Curriculo, curriculo_id)
    if not curriculo:
        return jsonify({'error': 'Currículo não encontrado'}), 404

    curriculo.status_resultado = status
    curriculo.status_motivo = motivo
    db.session.commit()

    # Criar notificação para o candidato
    try:
        titulo = 'Resultado do currículo'
        if status == 'aprovado':
            mensagem = 'Seu currículo foi aprovado. Parabéns!'
        elif status == 'reprovado':
            mensagem = 'Seu currículo foi reprovado.'
            if motivo:
                mensagem += f' Motivo: {motivo}'
        else:
            mensagem = 'Resultado do currículo atualizado para Pendente.'

        from models import Notificacao
        notif_user_id = getattr(curriculo.candidato, 'user_id', None)
        if notif_user_id:
            notif = Notificacao(user_id=notif_user_id, tipo='curriculo', titulo=titulo, mensagem=mensagem)
            db.session.add(notif)
        db.session.add(notif)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({'message': 'Status do currículo atualizado'})





@curriculos_bp.route('/ia/filter', methods=['POST'])

@jwt_required()

def ia_filter():



    data = request.get_json() or {}

    analyses = data.get('analyses', [])

    threshold = float(data.get('threshold', 0))

    filtered = [a for a in analyses if a.get('compatibilidade_pct', 0) >= threshold]

    return jsonify({'filtered': filtered})







@curriculos_bp.route('/ia/extract', methods=['POST'])

@jwt_required(optional=True)

def ia_extract():



    data = request.get_json() or {}

    texts = data.get('texts', [])

    results = []

    for txt in texts:

        info = analyzer.extract_information(txt or "")

        results.append(info)

    return jsonify({'extracted': results})





@curriculos_bp.route('/ia/compatibility', methods=['POST'])

@jwt_required(optional=True)

def ia_compatibility():



    data = request.get_json() or {}

    cv_info = data.get('cv_info') or {}

    vaga_info = data.get('vaga_info') or {}

    score = analyzer.compute_compatibility(cv_info, vaga_info)

    return jsonify({'compatibility_pct': score})





@curriculos_bp.route('/ia/recommend', methods=['POST'])

@jwt_required(optional=True)

def ia_recommend():



    data = request.get_json() or {}

    text = data.get('text', '')

    vagas = data.get('vagas', [])

    top_k = int(data.get('top_k') or 5)

    recs = analyzer.recommend_vagas(text, vagas, top_k=top_k)

    return jsonify({'recommendations': recs})









@curriculos_bp.route('/vagas/<int:vaga_id>/screen', methods=['POST'])

@jwt_required(optional=True)

def screen_candidates(vaga_id):

















    try:

        try:

            user_id = get_jwt_identity()

        except:

            user_id = None



        try:

            vaga = db.session.get(Vaga, vaga_id)

            if not vaga:

                return jsonify({'error': 'Vaga não encontrada'}), 404





            empresa = vaga.empresa

            if user_id and empresa.user_id != user_id:

                return jsonify({'error': 'Permissão negada'}), 403

        except Exception as e:

            print(f"Erro ao validar vaga: {e}")

            return jsonify({'error': f'Erro ao validar vaga: {str(e)}'}), 400



        data = request.get_json() or {}

        top_k = int(data.get('top_k') or 5)

        mark = bool(data.get('mark') is True or data.get('mark') == 'true')





        candidaturas = db.session.execute(

            db.select(Candidatura)
                .options(
                    joinedload(Candidatura.candidato)
                        .joinedload(Candidato.curriculo),
                    joinedload(Candidatura.candidato)
                        .joinedload(Candidato.user)
                )
                .where(
                    Candidatura.vaga_id == vaga.id, 
                    Candidatura.status.in_(['pendente', 'em_analise'])
                )

        ).scalars().all()



        results = []





        requisitos = vaga.requisitos or []
        uploads_dir = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)



        for cand in candidaturas:

            try:



                curriculo = db.session.execute(

                    db.select(Curriculo).where(Curriculo.candidato_id == cand.candidato_id)

                ).scalar_one_or_none()



                candidato = db.session.get(Candidato, cand.candidato_id)

                if not candidato:

                    continue





                curriculum_text = ""





                if curriculo and curriculo.arquivo_url:
                    arquivo_path = os.path.join(uploads_dir, curriculo.arquivo_url)
                    if os.path.exists(arquivo_path):

                        try:

                            curriculum_text = analyzer.extract_text_from_file(arquivo_path)

                        except Exception as e:
                            print(f"Erro ao extrair arquivo currículo: {e}")
                            curriculum_text = ""





                if not curriculum_text and curriculo:

                    parts = []





                    if curriculo.habilidades:

                        parts.append("Habilidades: " + ", ".join(str(h) for h in curriculo.habilidades))





                    if curriculo.experiencia:

                        for exp in curriculo.experiencia:

                            if isinstance(exp, dict):

                                parts.append("Experiência: " + ", ".join(str(v) for v in exp.values() if v))

                            else:

                                parts.append("Experiência: " + str(exp))





                    if curriculo.educacao:

                        parts.append("Educação: " + ", ".join(str(e) for e in curriculo.educacao))





                    if curriculo.idiomas:

                        parts.append("Idiomas: " + ", ".join(str(i) for i in curriculo.idiomas))



                    curriculum_text = "\n".join(parts)





                if not curriculum_text:

                    curriculum_text = f"Candidato {candidato.nome}"





                analysis = analyzer.analyze_curriculum(curriculum_text, requisitos)





                candidato_email = 'N/A'

                try:

                    if candidato.user and hasattr(candidato.user, 'email'):

                        candidato_email = candidato.user.email

                except:

                    pass



                result = {

                    'candidatura_id': cand.id,

                    'candidato_id': cand.candidato_id,

                    'candidato_nome': candidato.nome,

                    'candidato_email': candidato_email,

                    'compatibilidade_pct': analysis['compatibilidade_pct'],

                    'recomendacao': analysis['recomendacao'],

                    'pontos_fortes': analysis['pontos_fortes'],

                    'pontos_falta': analysis['pontos_falta'],

                    'skills_encontrados': analysis['skills_encontrados'],

                    'experiencia_anos': analysis['experiencia_anos'],

                    'formacao': analysis['formacao'],

                }





                try:

                    cand.score_analise = analysis['compatibilidade_pct']

                    db.session.add(cand)

                except Exception as e:

                    print(f"Erro ao salvar score_analise: {e}")

                    db.session.rollback()



                results.append(result)



            except Exception as e:

                print(f"Erro ao analisar candidatura {cand.id}: {e}")

                continue





        results_sorted = sorted(results, key=lambda x: x['compatibilidade_pct'], reverse=True)





        if mark and results_sorted:

            to_mark = results_sorted[:top_k]

            for item in to_mark:

                try:

                    c = db.session.get(Candidatura, item['candidatura_id'])

                    if c:

                        c.status = 'em_analise'

                        db.session.add(c)

                except Exception as e:

                    print(f"Erro ao marcar candidatura: {e}")

            try:

                db.session.commit()

            except Exception as e:

                print(f"Erro ao fazer commit: {e}")

                db.session.rollback()

        else:

            try:

                db.session.commit()

            except Exception as e:

                print(f"Erro ao fazer commit: {e}")

                db.session.rollback()



        return jsonify({

            'vaga_id': vaga.id,

            'vaga_titulo': vaga.titulo,

            'total_candidaturas': len(results),

            'results': results_sorted

        })

    except Exception as e:

        print(f"Erro geral em screen_candidates: {e}")

        import traceback

        traceback.print_exc()

        return jsonify({'error': f'Erro ao analisar candidatos: {str(e)}'}), 500







chat_sessions = {}  



@curriculos_bp.route('/ia/chat', methods=['POST'])

@jwt_required()

def ia_chat():



    user_id = get_jwt_identity()
    if user_id not in chat_sessions:

        chat_sessions[user_id] = ChatIA()
        claims = get_jwt()
        chat_sessions[user_id].set_user_tipo(claims.get('tipo'))


    chat = chat_sessions[user_id]

    data = request.get_json() or {}

    message = data.get('message', '').strip()

    funcao = data.get('funcao')  



    if not message:

        return jsonify({'error': 'Mensagem vazia'}), 400





    if funcao:

        chat.set_funcao_ativa(funcao)

        response = chat.process_message_with_funcao(message, funcao)

    else:

        response = chat.process_message(message)



    return jsonify({'response': response})





@curriculos_bp.route('/ia/chat/load', methods=['POST'])

@jwt_required()

def ia_chat_load():



    user_id = get_jwt_identity()
    if user_id not in chat_sessions:

        chat_sessions[user_id] = ChatIA()
        claims = get_jwt()
        chat_sessions[user_id].set_user_tipo(claims.get('tipo'))


    chat = chat_sessions[user_id]

    data = request.get_json() or {}

    texts = data.get('texts', [])



    chat.load_curriculums(texts)

    return jsonify({'message': f'{len(texts)} currículo(s) carregado(s) no chat.'})





@curriculos_bp.route('/ia/chat/analyses', methods=['GET'])

@jwt_required()

def ia_chat_analyses():



    user_id = get_jwt_identity()



    if user_id not in chat_sessions:

        return jsonify({'analyses': []})



    chat = chat_sessions[user_id]

    return jsonify({'analyses': chat.get_analyses()})
