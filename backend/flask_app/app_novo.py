

















from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
from dotenv import load_dotenv


from utils.ia_curriculum_analyzer import analyzer


from utils.metrics import setup_metrics_endpoint, track_request_metrics, track_ia_metrics, track_text_size
from utils.logger import logger, log_performance

load_dotenv()

app = Flask(__name__)


cors_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:3001').split(',')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})


setup_metrics_endpoint(app)



@app.route('/', methods=['GET'])
@track_request_metrics
def health():

    logger.api_request('GET', '/', 200)
    return jsonify({
        'message': 'Flask - Motor de IA rodando!',
        'status': 'ok',
        'version': '2.0',
        'servico': 'análise de currículo'
    }), 200


@app.route('/api/analisar', methods=['POST'])
@track_request_metrics
@track_ia_metrics('curriculum_analysis')
@log_performance('curriculum_analysis')
def analisar():





















    try:
        data = request.get_json(silent=True)

        if not data:
            logger.api_request('POST', '/api/analisar', 400, error='Corpo da requisição vazio')
            return jsonify({'error': 'Corpo da requisição vazio'}), 400

        curriculo_texto = data.get('curriculo_texto', '')
        vaga_requisitos = data.get('vaga_requisitos', [])

        if not curriculo_texto or not isinstance(curriculo_texto, str):
            logger.api_request('POST', '/api/analisar', 400, error='curriculo_texto é obrigatório (string)')
            return jsonify({'error': 'curriculo_texto é obrigatório (string)'}), 400

        if not isinstance(vaga_requisitos, list):
            logger.api_request('POST', '/api/analisar', 400, error='vaga_requisitos deve ser uma lista')
            return jsonify({'error': 'vaga_requisitos deve ser uma lista'}), 400


        track_text_size(curriculo_texto)


        logger.ia_processing('curriculum_analysis', 
                            len(curriculo_texto), 
                            len(vaga_requisitos))


        resultado = analyzer.analyze_curriculum(
            curriculo_texto,
            vaga_requisitos
        )

        logger.api_request('POST', '/api/analisar', 200, 
                          compatibilidade=resultado.get('compatibilidade_pct'),
                          skills_encontrados=len(resultado.get('skills_encontrados', [])))

        return jsonify(resultado), 200

    except Exception as e:
        logger.error('Erro na análise de currículo', 
                    error=str(e), 
                    endpoint='/api/analisar',
                    tipo='erro_analise')
        return jsonify({
            'error': str(e),
            'tipo': 'erro_analise'
        }), 500


@app.route('/api/extrair-skills', methods=['POST'])
@track_request_metrics
@track_ia_metrics('skills_extraction')
@log_performance('skills_extraction')
def extrair_skills():














    try:
        data = request.get_json()
        curriculo_texto = data.get('curriculo_texto', '')

        if not curriculo_texto:
            logger.api_request('POST', '/api/extrair-skills', 400, error='curriculo_texto é obrigatório')
            return jsonify({'error': 'curriculo_texto é obrigatório'}), 400


        track_text_size(curriculo_texto)


        logger.ia_processing('skills_extraction', len(curriculo_texto))

        skills = analyzer.extract_skills(curriculo_texto)

        logger.api_request('POST', '/api/extrair-skills', 200, skills_extraidas=len(skills))

        return jsonify({
            'skills': skills,
            'total': len(skills)
        }), 200

    except Exception as e:
        logger.error('Erro na extração de skills', 
                    error=str(e), 
                    endpoint='/api/extrair-skills')
        return jsonify({'error': str(e)}), 500


@app.route('/api/extrair-experiencia', methods=['POST'])
@track_request_metrics
@track_ia_metrics('experience_extraction')
@log_performance('experience_extraction')
def extrair_experiencia():













    try:
        data = request.get_json()
        curriculo_texto = data.get('curriculo_texto', '')

        if not curriculo_texto:
            logger.api_request('POST', '/api/extrair-experiencia', 400, error='curriculo_texto é obrigatório')
            return jsonify({'error': 'curriculo_texto é obrigatório'}), 400


        track_text_size(curriculo_texto)


        logger.ia_processing('experience_extraction', len(curriculo_texto))

        anos = analyzer.extract_experience_years(curriculo_texto)

        logger.api_request('POST', '/api/extrair-experiencia', 200, anos_experiencia=anos)

        return jsonify({
            'anos_experiencia': anos
        }), 200

    except Exception as e:
        logger.error('Erro na extração de experiência', 
                    error=str(e), 
                    endpoint='/api/extrair-experiencia')
        return jsonify({'error': str(e)}), 500


@app.route('/api/extrair-educacao', methods=['POST'])
@track_request_metrics
@track_ia_metrics('education_extraction')
@log_performance('education_extraction')
def extrair_educacao():














    try:
        data = request.get_json()
        curriculo_texto = data.get('curriculo_texto', '')

        if not curriculo_texto:
            logger.api_request('POST', '/api/extrair-educacao', 400, error='curriculo_texto é obrigatório')
            return jsonify({'error': 'curriculo_texto é obrigatório'}), 400


        track_text_size(curriculo_texto)


        logger.ia_processing('education_extraction', len(curriculo_texto))

        educacao = analyzer.extract_education(curriculo_texto)


        hierarquia = ['técnico', 'bacharel', 'especialização', 'mestrado', 'doutorado']
        nivel_maximo = None
        for nivel in reversed(hierarquia):
            if nivel in educacao:
                nivel_maximo = nivel
                break

        logger.api_request('POST', '/api/extrair-educacao', 200, 
                          nivel_maximo=nivel_maximo, 
                          niveis_encontrados=len(educacao))

        return jsonify({
            'educacao': educacao,
            'nivel_maximo': nivel_maximo
        }), 200

    except Exception as e:
        logger.error('Erro na extração de educação', 
                    error=str(e), 
                    endpoint='/api/extrair-educacao')
        return jsonify({'error': str(e)}), 500


@app.route('/api/extrair-tudo', methods=['POST'])
@track_request_metrics
@track_ia_metrics('complete_extraction')
@log_performance('complete_extraction')
def extrair_tudo():









    try:
        data = request.get_json()
        curriculo_texto = data.get('curriculo_texto', '')
        vaga_requisitos = data.get('vaga_requisitos', None)

        if not curriculo_texto:
            logger.api_request('POST', '/api/extrair-tudo', 400, error='curriculo_texto é obrigatório')
            return jsonify({'error': 'curriculo_texto é obrigatório'}), 400


        track_text_size(curriculo_texto)


        logger.ia_processing('complete_extraction', 
                            len(curriculo_texto), 
                            len(vaga_requisitos) if vaga_requisitos else 0)


        skills = analyzer.extract_skills(curriculo_texto)
        experience = analyzer.extract_experience_years(curriculo_texto)
        education = analyzer.extract_education(curriculo_texto)
        keywords = analyzer.extract_keywords(curriculo_texto, limit=20)

        resultado = {
            'skills': skills,
            'experiencia_anos': experience,
            'educacao': education,
            'palavras_chave': keywords
        }


        if vaga_requisitos and isinstance(vaga_requisitos, list):
            analise = analyzer.analyze_curriculum(curriculo_texto, vaga_requisitos)
            resultado['analise_compatibilidade'] = analise

        logger.api_request('POST', '/api/extrair-tudo', 200, 
                          skills=len(skills),
                          experiencia_anos=experience,
                          educacao=len(education),
                          keywords=len(keywords),
                          compatibilidade=analise.get('compatibilidade_pct') if vaga_requisitos else None)

        return jsonify(resultado), 200

    except Exception as e:
        logger.error('Erro na extração completa', 
                    error=str(e), 
                    endpoint='/api/extrair-tudo')
        return jsonify({'error': str(e)}), 500




@app.errorhandler(404)
@track_request_metrics
def not_found(error):
    logger.api_request(request.method, request.path, 404, error='Endpoint não encontrado')
    return jsonify({
        'error': 'Endpoint não encontrado',
        'message': f'{request.method} {request.path}'
    }), 404


@app.errorhandler(405)
@track_request_metrics
def method_not_allowed(error):
    logger.api_request(request.method, request.path, 405, error='Método HTTP não permitido')
    return jsonify({
        'error': 'Método HTTP não permitido',
        'methods_allowed': ['POST', 'GET']
    }), 405


@app.errorhandler(500)
@track_request_metrics
def internal_error(error):
    logger.error('Erro interno do servidor', 
                error=str(error), 
                endpoint=request.path,
                method=request.method)
    return jsonify({
        'error': 'Erro interno do servidor',
        'message': str(error)
    }), 500




if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True') == 'True'

    print(f
















)

    app.run(host='0.0.0.0', port=port, debug=debug)