from flask import Blueprint, request, jsonify, current_app
from utils.ia_curriculum_analyzer import analyzer
import os

ia_bp = Blueprint('ia_service', __name__)


def _save_and_extract_text(file_storage):
    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, f"ia_{file_storage.filename}")
    file_storage.save(filepath)
    return analyzer.extract_text_from_file(filepath)


@ia_bp.route('/analyze-cv', methods=['POST'])
def analyze_cv():

    text = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Arquivo inválido'}), 400
        text = _save_and_extract_text(file)
    else:
        data = request.get_json(silent=True) or {}
        text = data.get('text', '')

    if not text or not text.strip():
        return jsonify({'error': 'Texto ou arquivo de currículo é necessário'}), 400

    info = analyzer.extract_information(text)
    info['raw_text_preview'] = text[:1500]
    return jsonify({'analysis': info})


@ia_bp.route('/match-job', methods=['POST'])
def match_job():

    data = request.get_json(silent=True) or {}
    requisitos = data.get('requisitos', [])
    vaga_experiencia = data.get('experiencia_anos', 0)
    vaga_formacao = data.get('formacao', [])


    text = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Arquivo inválido'}), 400
        text = _save_and_extract_text(file)
    else:
        text = data.get('text', '')

    if not text or not text.strip():
        return jsonify({'error': 'Texto ou arquivo de currículo é necessário'}), 400

    cv_info = analyzer.extract_information(text)
    vaga_info = {
        'skills': requisitos or [],
        'experiencia_anos': vaga_experiencia or 0,
        'formacao': vaga_formacao or []
    }

    score = analyzer.compute_compatibility(cv_info, vaga_info)

    missing_skills = []
    if requisitos:
        cv_skills = {s.lower() for s in cv_info.get('skills', [])}
        missing_skills = [r for r in requisitos if r.lower() not in cv_skills]

    return jsonify({
        'compatibility_score': score,
        'missing_skills': missing_skills,
        'cv_info': cv_info,
        'job_requirements': vaga_info
    })


@ia_bp.route('/improve-cv', methods=['POST'])
def improve_cv():

    data = request.get_json(silent=True) or {}
    text = None

    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Arquivo inválido'}), 400
        text = _save_and_extract_text(file)
    else:
        text = data.get('text', '')

    if not text or not text.strip():
        return jsonify({'error': 'Texto ou arquivo de currículo é necessário'}), 400

    info = analyzer.extract_information(text)

    suggestions = []

    if not info.get('skills'):
        suggestions.append('Considere listar habilidades técnicas e ferramentas que você domina (ex: Python, SQL, Docker).')
    else:
        suggestions.append(f"Habilidades encontradas: {', '.join(info.get('skills', [])[:8])}.")


    if info.get('experience_years', 0) < 2:
        suggestions.append('Se você tem experiência, inclua mais detalhes de projetos, responsabilidades e resultados quantificáveis.')
    else:
        suggestions.append('Boa quantidade de experiência listada; lembre-se de quantificar resultados com números sempre que possível.')


    if not info.get('education'):
        suggestions.append('Inclua seu nível de formação (por exemplo: bacharel, mestrado, técnico).')
    else:
        suggestions.append(f"Formação identificada: {', '.join(info.get('education'))}.")


    if info.get('keywords'):
        suggestions.append('Use palavras-chave relevantes ao cargo desejado para melhorar a compatibilidade com sistemas de triagem automática.')

    return jsonify({
        'extracted_info': info,
        'suggestions': suggestions
    })